from flask import Flask, request,  jsonify 
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from models import db, Transcript, User
from flask_jwt_extended import JWTManager
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

    file = request.files.get("file")

    if not file:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    audio_data = file.read()

    response = requests.post(

        "https://api.deepgram.com/v1/listen?punctuate=true&smart_format=true",

        headers={
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/webm"
        },

        data=audio_data
    )

    result = response.json()

    transcript = result["results"]["channels"][0]["alternatives"][0]["transcript"]

    try:
        new_transcript = Transcript(

            text=transcript,

            user_id=current_user_id,

            duration_seconds=10,

            filename=file.filename,

            language="en"
        )

        db.session.add(new_transcript)

        db.session.commit()

    except Exception as e:
        print("Database error:", e)
        db.session.rollback()

    return jsonify({
        "transcript": transcript
    })


@app.route("/transcripts", methods=["GET"])
@jwt_required()
def get_transcripts():

    current_user_id = int(get_jwt_identity())

    transcripts = Transcript.query.order_by(
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