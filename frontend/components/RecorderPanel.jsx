"use client" 
import { useState, useEffect  } from "react"

function RecorderPanel({ setTranscript }) {
    const [isRecording, setIsRecording] = useState(false)

    const [seconds, setSeconds] = useState(0)

    const [showStartedText, setShowStartedText] = useState(false)

    const [mediaRecorder, setMediaRecorder] = useState(null)

    const [audioURL, setAudioURL] = useState("")

    const [showSavedMessage, setShowSavedMessage] = useState(false)

    const [loading, setLoading] = useState(false)

    async function handleStart() {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
            })

            const recorder = new MediaRecorder(stream)

            const chunks = []

            recorder.ondataavailable = (event) => {
            chunks.push(event.data)
            }

            recorder.onstop = async () => {

                const blob = new Blob(chunks, {
                    type: "audio/webm"
                })

                const url = URL.createObjectURL(blob)

                setAudioURL(url)

                const formData = new FormData()

                formData.append("file", blob, "recording.webm")

                try {

                    setLoading(true)

                    const response = await fetch(
                    "http://127.0.0.1:5000/transcribe",
                    {
                        method: "POST",
                        body: formData
                    }
                    )

                    const data = await response.json()
                    setTranscript(data.transcript)

                    console.log(data)

                } catch (error) {

                    console.log(error)

                } finally {

                    setLoading(false)

                }

            }

            recorder.start()

            setMediaRecorder(recorder)

            setIsRecording(true)

            setShowStartedText(true)

            setTimeout(() => {
            setShowStartedText(false)
            }, 2000)

        } catch (error) {

            console.log(error)

            alert("Microphone access denied")

        } 
    }
    function handleStop() {
        mediaRecorder.stop()
        setIsRecording(false)
        setSeconds(0) 
        setShowSavedMessage(true)
    }

    useEffect(() => {

        let interval

        if (isRecording) {

            interval = setInterval(() => {

            setSeconds(prev => prev + 1)

            }, 1000)

        }

        return () => clearInterval(interval)

    }, [isRecording])

  return (
    <div className="bg-white shadow-md rounded-xl p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 text-black">
        Recorder
      </h2>

      <div className="flex items-center gap-4 flex-wrap">
        {!isRecording && (<button onClick={handleStart} className="bg-green-500 hover:bg-green-600 transition text-white px-4 py-2 rounded-lg">
          Start Recording
        </button> )}

        {isRecording && (<button onClick={handleStop} className="bg-red-500 hover:bg-red-600 transition text-white px-4 py-2 rounded-lg">
          Stop Recording
        </button> )}

        {isRecording && (
        <div className="flex items-center gap-2 mt-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>

            <span className="text-red-500 font-medium">
            Recording Live
            </span>
        </div>
        )}

        {showStartedText && (
            <span className="text-green-600 font-medium self-center animate-pulse">
                Recording Started
            </span>
        )}

      </div>
       <p className={`mt-4 text-lg ${isRecording ? "text-red-500" : "text-green-500"}`}>
        {isRecording ? "Recording..." : "Not Recording"}
       </p>
       {isRecording && (<p className={`text-2xl font-bold mt-2 ${isRecording ? "text-red-500" : "text-green-500"}`} >
          00:{seconds < 10 ? `0${seconds}` : seconds}
       </p> )}

       {loading && (
            <p className="text-blue-500 mt-4">
                Uploading audio...
            </p>
    )}

       {audioURL && (
        <audio
            controls
            src={audioURL}
            className="mt-4 w-full"
        />
        )}

        {audioURL && (
            <button
                onClick={() => setAudioURL("")}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg mt-4"
            >
                Delete Recording
            </button>
        )}

        {showSavedMessage && (
            <p className="text-green-600 font-medium mt-4">
                Recording saved successfully
            </p>
        )}

    </div>
    
  )
}

export default RecorderPanel