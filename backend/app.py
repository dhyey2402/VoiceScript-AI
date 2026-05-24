from flask import Flask, request,  jsonify 
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

app = Flask(__name__)

CORS(app)

@app.route("/transcribe", methods=["POST"])
def transcribe():

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

    return jsonify({
        "transcript": transcript
    })

if __name__ == '__main__':
    app.run(debug=True)