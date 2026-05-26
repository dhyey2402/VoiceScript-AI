from flask import Flask, request,  jsonify 
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from models import db, Transcript, User
from flask_jwt_extended import JWTManager
from pydub import AudioSegment
from flask_jwt_extended import create_access_token
from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

app = Flask(__name__)

CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

db.init_app(app)
jwt = JWTManager(app)


@app.route("/login", methods=["POST"])
def login():

    data = request.json

    user = User.query.filter_by(
        username=data["username"]
    ).first()

    if not user:

        return jsonify({
            "error": "Invalid credentials"
        }), 401

    if not check_password_hash(
        user.password,
        data["password"]
    ):

        return jsonify({
            "error": "Invalid credentials"
        }), 401

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "token": access_token
    })

@app.route("/transcribe", methods=["POST"])
@jwt_required()
def transcribe():

    current_user_id = int(get_jwt_identity())

    audio_file = request.files.get("audio") or request.files.get("file")

    if not audio_file:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    filename = audio_file.filename
    if not filename:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    # Validate file extension before writing to disk
    extension = filename.split(".")[-1].lower()
    allowed_extensions = ["webm", "wav", "mp3", "m4a", "ogg"]
    if extension not in allowed_extensions:
        return jsonify({
            "error": f"Unsupported file type. Supported formats: {', '.join(allowed_extensions)}"
        }), 400

    # Validate file size (max 10MB) before loading into memory
    MAX_FILE_SIZE = 10 * 1024 * 1024
    audio_file.seek(0, 2)
    file_size = audio_file.tell()
    audio_file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({
            "error": "File too large. Maximum size is 10MB."
        }), 400

    # Save to a temporary file using the original extension so pydub can decode it correctly
    temp_input = f"temp_input.{extension}"
    converted_path = "converted_audio.wav"

    try:
        audio_file.save(temp_input)

        # Decode using pydub just to get metadata duration
        audio = AudioSegment.from_file(temp_input)
        duration_seconds = int(len(audio) / 1000)

        # Map file extension to exact Deepgram Content-Type to avoid processing distortion
        content_type_map = {
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "webm": "audio/webm",
            "m4a": "audio/m4a",
            "ogg": "audio/ogg"
        }
        content_type = content_type_map.get(extension, "audio/wav")

        # Send the ORIGINAL high-fidelity audio file directly to Deepgram
        with open(temp_input, "rb") as audio_data:
            response = requests.post(
                "https://api.deepgram.com/v1/listen?punctuate=true&smart_format=true",
                headers={
                    "Authorization": f"Token {DEEPGRAM_API_KEY}",
                    "Content-Type": content_type
                },
                data=audio_data   
            )

        if response.status_code != 200:
            return jsonify({
                "error": f"Deepgram API error: {response.text}"
            }), response.status_code

        result = response.json()
        transcript = result.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "")

        # Save to database
        try:
            new_transcript = Transcript(
                text=transcript,
                user_id=current_user_id,
                duration_seconds=duration_seconds,
                filename=filename,
                language="en"
            )
            db.session.add(new_transcript)
            db.session.commit()
        except Exception as db_err:
            print("Database error:", db_err)
            db.session.rollback()

        return jsonify({
            "transcript": transcript
        })

    except Exception as e:
        print("Transcription error:", e)
        return jsonify({
            "error": f"Failed to process audio: {str(e)}"
        }), 500

    finally:
        # Clean up temporary files safely
        if os.path.exists(temp_input):
            try:
                os.remove(temp_input)
            except Exception:
                pass
        if os.path.exists(converted_path):
            try:
                os.remove(converted_path)
            except Exception:
                pass


@app.route("/transcripts", methods=["GET"])
@jwt_required()
def get_transcripts():

    current_user_id = int(get_jwt_identity())

    transcripts = Transcript.query.filter_by(
        user_id=current_user_id
    ).order_by(
        Transcript.created_at.desc()
    ).all()

    result = []

    for t in transcripts:

        result.append({
            "id": t.id,
            "text": t.text,
            "created_at": t.created_at,
            "duration_seconds": t.duration_seconds,
            "filename": t.filename,
            "language": t.language
        })

    return jsonify(result)

@app.route("/register", methods=["POST"])
def register():

    data = request.json

    # Validate username uniqueness
    existing_user = User.query.filter_by(username=data["username"]).first()
    if existing_user:
        return jsonify({"error": "Username is already taken"}), 400

    # Validate email uniqueness
    existing_email = User.query.filter_by(email=data["email"]).first()
    if existing_email:
        return jsonify({"error": "Email is already taken"}), 400

    hashed_password = generate_password_hash(
        data["password"]
    )

    new_user = User(
        username=data["username"],
        email=data["email"],
        password=hashed_password
    )

    db.session.add(new_user)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error occurred during registration"}), 500

    return jsonify({
        "message": "User registered successfully"
    })

@app.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "username": user.username,
        "email": user.email
    })

@app.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    
    if username and username != user.username:
        existing = User.query.filter_by(username=username).first()
        if existing:
            return jsonify({"error": "Username is already taken"}), 400
        user.username = username
        
    if email and email != user.email:
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({"error": "Email is already taken"}), 400
        user.email = email
        
    if password:
        user.password = generate_password_hash(password)
        
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error occurred"}), 500
        
    return jsonify({"message": "Profile updated successfully"})

if __name__ == '__main__':
    app.run(debug=True)