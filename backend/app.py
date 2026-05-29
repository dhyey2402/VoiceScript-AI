from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import re
from datetime import timedelta
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

# CORS: allow origins defined in ALLOWED_ORIGINS env var (comma-separated)
# Falls back to localhost for local development
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
# Tokens expire in 7 days (or 30 days if REMEMBER_ME header is sent)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

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

        # Save to database only if requested
        save_param = request.args.get("save", "true").lower()
        if save_param == "true":
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
            "name": t.name,
            "created_at": t.created_at,
            "duration_seconds": t.duration_seconds,
            "filename": t.filename,
            "language": t.language
        })

    return jsonify(result)

@app.route("/transcripts/<int:transcript_id>", methods=["DELETE"])
@jwt_required()
def delete_transcript(transcript_id):

    current_user_id = int(get_jwt_identity())

    transcript = Transcript.query.filter_by(
        id=transcript_id,
        user_id=current_user_id
    ).first()

    if not transcript:
        return jsonify({"error": "Transcript not found"}), 404

    try:
        db.session.delete(transcript)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete transcript"}), 500

    return jsonify({"message": "Transcript deleted successfully"})

@app.route("/transcripts/<int:transcript_id>/name", methods=["PATCH"])
@jwt_required()
def rename_transcript(transcript_id):

    current_user_id = int(get_jwt_identity())

    transcript = Transcript.query.filter_by(
        id=transcript_id,
        user_id=current_user_id
    ).first()

    if not transcript:
        return jsonify({"error": "Transcript not found"}), 404

    data = request.json
    new_name = data.get("name", "").strip()

    if not new_name:
        return jsonify({"error": "Name cannot be empty"}), 400

    if len(new_name) > 200:
        return jsonify({"error": "Name too long (max 200 characters)"}), 400

    try:
        transcript.name = new_name
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to rename transcript"}), 500

    return jsonify({"message": "Renamed successfully", "name": transcript.name})

@app.route("/register", methods=["POST"])
def register():

    data = request.json or {}

    username = (data.get("username") or "").strip()
    email    = (data.get("email")    or "").strip()
    password =  data.get("password") or ""

    # --- Input validation ---
    if not username or not email or not password:
        return jsonify({"error": "Username, email and password are required"}), 400

    if len(username) < 3 or len(username) > 50:
        return jsonify({"error": "Username must be 3–50 characters"}), 400

    if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
        return jsonify({"error": "Username may only contain letters, numbers, underscores, dots and hyphens"}), 400

    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        return jsonify({"error": "Invalid email address"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Validate username uniqueness
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "Username is already taken"}), 400

    # Validate email uniqueness
    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({"error": "Email is already taken"}), 400

    hashed_password = generate_password_hash(password)

    new_user = User(
        username=username,
        email=email,
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

@app.route("/transcripts/<int:transcript_id>", methods=["GET"])
@jwt_required()
def get_transcript(transcript_id):

    current_user_id = int(get_jwt_identity())

    transcript = Transcript.query.filter_by(
        id=transcript_id,
        user_id=current_user_id
    ).first()

    if not transcript:
        return jsonify({"error": "Transcript not found"}), 404

    return jsonify({
        "id": transcript.id,
        "text": transcript.text,
        "name": transcript.name,
        "created_at": transcript.created_at.isoformat() if transcript.created_at else None,
        "duration_seconds": transcript.duration_seconds,
        "filename": transcript.filename,
        "language": transcript.language
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