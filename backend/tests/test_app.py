import pytest
import io
import json
from unittest.mock import patch, MagicMock
from app import app as flask_app
from models import db, User, Transcript

@pytest.fixture
def client():
    # Setup test configuration
    flask_app.config["TESTING"] = True
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    flask_app.config["JWT_SECRET_KEY"] = "test-secret-key"
    
    with flask_app.test_client() as client:
        with flask_app.app_context():
            db.create_all()
            yield client
            db.drop_all()

# Helper function to register and login a test user
def get_auth_token(client, username="testuser", email="test@example.com", password="password123"):
    # Register
    client.post("/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    # Login
    res = client.post("/login", json={
        "username": username,
        "password": password
    })
    return res.json["token"]

# --- AUTH REGISTRATION TESTS ---

def test_register_success(client):
    res = client.post("/register", json={
        "username": "dhyey_patel",
        "email": "dhyey@example.com",
        "password": "securepassword"
    })
    assert res.status_code == 200
    assert "registered successfully" in res.json["message"]

def test_register_missing_fields(client):
    res = client.post("/register", json={
        "username": "dhyey_patel"
    })
    assert res.status_code == 400
    assert "required" in res.json["error"]

def test_register_invalid_email(client):
    res = client.post("/register", json={
        "username": "dhyey_patel",
        "email": "invalid-email",
        "password": "securepassword"
    })
    assert res.status_code == 400
    assert "Invalid email" in res.json["error"]

def test_register_password_too_short(client):
    res = client.post("/register", json={
        "username": "dhyey_patel",
        "email": "dhyey@example.com",
        "password": "123"
    })
    assert res.status_code == 400
    assert "at least 6 characters" in res.json["error"]

# --- AUTH LOGIN TESTS ---

def test_login_success(client):
    token = get_auth_token(client)
    assert token is not None
    assert isinstance(token, str)

def test_login_invalid_credentials(client):
    # Register test user
    client.post("/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    # Attempt login with bad password
    res = client.post("/login", json={
        "username": "testuser",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json["error"]

# --- PROFILE TESTS ---

def test_get_profile(client):
    token = get_auth_token(client)
    res = client.get("/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json["username"] == "testuser"
    assert res.json["email"] == "test@example.com"

def test_update_profile(client):
    token = get_auth_token(client)
    res = client.put("/profile", 
        headers={"Authorization": f"Bearer {token}"},
        json={
            "username": "updateduser",
            "email": "updated@example.com"
        }
    )
    assert res.status_code == 200
    assert "updated successfully" in res.json["message"]
    
    # Verify changes
    profile_res = client.get("/profile", headers={"Authorization": f"Bearer {token}"})
    assert profile_res.json["username"] == "updateduser"
    assert profile_res.json["email"] == "updated@example.com"

# --- TRANSCRIBE TESTS ---

@patch("app.requests.post")
def test_transcribe_mock(mock_post, client):
    token = get_auth_token(client)
    
    # Configure mock Deepgram STT response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {"transcript": "hello world from pytest units"}
                    ]
                }
            ]
        }
    }
    mock_post.return_value = mock_response

    # Call /transcribe with a dummy WAV file
    data = {
        "audio": (io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"), "test.wav")
    }
    
    res = client.post(
        "/transcribe",
        data=data,
        headers={"Authorization": f"Bearer {token}"},
        content_type="multipart/form-data"
    )
    
    assert res.status_code == 200
    assert res.json["transcript"] == "hello world from pytest units"

def test_transcribe_missing_file(client):
    token = get_auth_token(client)
    res = client.post(
        "/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        content_type="multipart/form-data"
    )
    assert res.status_code == 400
    assert "No file uploaded" in res.json["error"]

def test_transcribe_unsupported_format(client):
    token = get_auth_token(client)
    data = {
        "audio": (io.BytesIO(b"unsupported text"), "test.txt")
    }
    res = client.post(
        "/transcribe",
        data=data,
        headers={"Authorization": f"Bearer {token}"},
        content_type="multipart/form-data"
    )
    assert res.status_code == 400
    assert "Unsupported file type" in res.json["error"]

# --- TRANSCRIPT CRUD TESTS ---

def test_get_transcripts_list(client):
    token = get_auth_token(client)
    
    # Inject a dummy transcript using the app database context
    with flask_app.app_context():
        user = User.query.filter_by(username="testuser").first()
        t = Transcript(
            text="pytest list test transcript",
            user_id=user.id,
            duration_seconds=12,
            filename="pytest.wav",
            language="en"
        )
        db.session.add(t)
        db.session.commit()

    res = client.get("/transcripts", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert len(res.json) == 1
    assert res.json[0]["text"] == "pytest list test transcript"

def test_rename_transcript(client):
    token = get_auth_token(client)
    
    # Inject a dummy transcript
    with flask_app.app_context():
        user = User.query.filter_by(username="testuser").first()
        t = Transcript(
            text="pytest details test transcript",
            user_id=user.id,
            duration_seconds=5,
            filename="pytest.wav",
            language="en"
        )
        db.session.add(t)
        db.session.commit()
        t_id = t.id

    res = client.patch(
        f"/transcripts/{t_id}/name",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "New Cool Name"}
    )
    assert res.status_code == 200
    assert res.json["name"] == "New Cool Name"

def test_delete_transcript(client):
    token = get_auth_token(client)
    
    # Inject a dummy transcript
    with flask_app.app_context():
        user = User.query.filter_by(username="testuser").first()
        t = Transcript(
            text="pytest list test transcript",
            user_id=user.id,
            duration_seconds=5,
            filename="pytest.wav",
            language="en"
        )
        db.session.add(t)
        db.session.commit()
        t_id = t.id

    # Verify existing
    res_list = client.get("/transcripts", headers={"Authorization": f"Bearer {token}"})
    assert len(res_list.json) == 1

    # Delete
    del_res = client.delete(f"/transcripts/{t_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200
    assert "deleted successfully" in del_res.json["message"]

    # Verify deleted
    res_list_after = client.get("/transcripts", headers={"Authorization": f"Bearer {token}"})
    assert len(res_list_after.json) == 0
