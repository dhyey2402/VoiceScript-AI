# 🎙️ VoiceScript AI — Backend Service

The backend is built with Python and Flask, utilizing PostgreSQL as the main relational database (accessed via SQLAlchemy ORM) and protected with JWT-based authorization tokens. The backend also supports high-fidelity audio transcription powered by the Deepgram API.

---

## 🛠️ Tech Stack & Requirements

- **Framework**: Flask (v3)
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **Token-Auth**: Flask-JWT-Extended
- **Audio Processing**: Pydub & ffmpeg (optional, with raw-file processing fallbacks)
- **Speech-to-Text**: Deepgram API

---

## ⚙️ Local Development Setup

### 1️⃣ Set Up Virtual Environment

To configure a clean virtual environment, run:

```bash
# Inside backend/ folder
python -m venv venv

# Activate on Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Activate on Mac/Linux
source venv/bin/activate
```

### 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5402/voicescript
DEEPGRAM_API_KEY=your_deepgram_api_key
JWT_SECRET_KEY=your_secure_jwt_secret_key_string
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4️⃣ Run Development Server

```bash
python app.py
```
The backend API service runs on `http://127.0.0.1:5000`.

---

## 🧩 API Endpoints Reference

### 🔐 Authentication

#### 📝 Register User
* **Endpoint**: `POST /register`
* **Request Payload**:
  ```json
  {
    "username": "dhyey_patel",
    "email": "dhyey@example.com",
    "password": "securepassword"
  }
  ```
* **Response (200)**:
  ```json
  {
    "message": "User registered successfully"
  }
  ```

#### 🔑 Log In User
* **Endpoint**: `POST /login`
* **Request Payload**:
  ```json
  {
    "username": "dhyey_patel",
    "password": "securepassword"
  }
  ```
* **Response (200)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 🎙️ Audio Transcription

#### 🎤 Upload / Record Audio for Transcription
* **Endpoint**: `POST /transcribe`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload**: Multipart/Form-data containing `audio` or `file` file parameter.
* **Query Parameters** (Optional): `save=true` (defaults to true; set to `false` for pseudo-streaming timeslices).
* **Response (200)**:
  ```json
  {
    "transcript": "Hello world this is the text parsed from speech."
  }
  ```

---

### 🗄️ Transcript Management

#### 📂 List All User Transcripts
* **Endpoint**: `GET /transcripts`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response (200)**: Array of transcripts ordered by newest first.

#### 📄 Get Transcript Detail
* **Endpoint**: `GET /transcripts/<id>`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`

#### ✏️ Rename Transcript Title
* **Endpoint**: `PATCH /transcripts/<id>/name`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload**: `{ "name": "Meeting Notes" }`

#### 🗑️ Delete Transcript
* **Endpoint**: `DELETE /transcripts/<id>`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`

---

## 🧪 Running Backend Unit Tests

A comprehensive unit test suite using `pytest` is configured to run tests using an in-memory SQLite database.

To execute tests:

```bash
pytest tests/test_app.py
```
