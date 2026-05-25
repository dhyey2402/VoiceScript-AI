# 🎙️ VoiceScript AI — Speech to Text SaaS Application

VoiceScript AI is a full-stack AI-powered speech-to-text web application that allows users to record audio, transcribe speech into text using Deepgram AI, save transcripts to PostgreSQL, and manage private transcript history with JWT authentication.

---

# 🚀 Features

## 🎤 Real-Time Audio Recording

* Record audio directly from the browser using the MediaRecorder API
* Live recording indicator
* Recording timer
* Audio playback support

---

## 🧠 AI Speech-to-Text Transcription

* Integrated with Deepgram AI API
* Converts speech into accurate text
* Supports:

  * Smart punctuation
  * Smart formatting
  * Language detection support

---

## 🗂 Transcript History System

* Save transcripts permanently in PostgreSQL
* View all saved transcripts in History page
* Display:

  * Transcript text
  * Language
  * Duration
  * Timestamp

---

## 🔐 Authentication & Authorization

* JWT-based authentication system
* User registration and login
* Protected routes
* Multi-user support
* Private transcript storage
* Remember Me functionality

---

## 🎨 Modern Frontend UI

* Built using React + Next.js
* Responsive dark-themed interface
* Modern card-based UI
* Loading states and animations
* Clean SaaS-style design

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Next.js App Router
* Tailwind CSS

## Backend

* Flask
* Flask-JWT-Extended
* Flask-CORS

## Database

* PostgreSQL
* SQLAlchemy ORM

## AI / APIs

* Deepgram Speech-to-Text API

---

# 🧩 Project Architecture

```
Frontend (Next.js)
↓
Flask Backend API
↓
Deepgram AI API
↓
PostgreSQL Database
```

---

# 📂 Project Structure

```
speech-to-text/
│
├── frontend/
│   ├── app/
│   ├── components/
│   └── public/
│
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── .env
│   └── requirements.txt
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/speech-to-text-app.git
```

---

## 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:3000
```

---

## 3️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on:
```
http://localhost:5000
```

---

# 🔑 Environment Variables

Create a `.env` file inside backend folder:

```env
DATABASE_URL=your_postgresql_database_url

DEEPGRAM_API_KEY=your_deepgram_api_key

JWT_SECRET_KEY=your_secret_key
```

---

# 🗄️ Database Schema

## User Table

| Column   | Type    |
| -------- | ------- |
| id       | Integer |
| username | String  |
| email    | String  |
| password | String  |

---

## Transcript Table

| Column           | Type        |
| ---------------- | ----------- |
| id               | Integer     |
| text             | Text        |
| created_at       | DateTime    |
| duration_seconds | Integer     |
| filename         | String      |
| language         | String      |
| user_id          | Foreign Key |

---

# 🔐 Authentication Flow

```
User Registers
↓
User Logs In
↓
JWT Token Generated
↓
Token Stored in Browser
↓
Protected API Access
```

---

# 🌟 Current Features Implemented

✅ Speech Recording
✅ AI Transcription
✅ PostgreSQL Persistence
✅ Transcript History
✅ JWT Authentication
✅ Multi-User Support
✅ Protected Routes
✅ Remember Me Login
✅ Modern UI

---

# 🚧 Upcoming Features

* Transcript Download
* Copy Transcript
* Delete Transcript
* Search & Filters
* Audio File Upload
* Dark/Light Theme Toggle
* Deployment
* User Dashboard
* Analytics

---

# 📸 Screenshots

(Add screenshots here later)

---

# 👨‍💻 Developer

Developed by Dhyey Patel

---

# 📄 License

This project is licensed under the MIT License.
