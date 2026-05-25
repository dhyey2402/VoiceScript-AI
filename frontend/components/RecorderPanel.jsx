"use client";
import { useState, useEffect, useRef } from "react";

const BARS = 13;

function RecorderPanel({ setTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds]         = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [showSaved, setShowSaved]     = useState(false);
  const [bars, setBars]               = useState(Array(BARS).fill(4));
  const waveRef = useRef(null);

  /* wave animation */
  useEffect(() => {
    if (isRecording) {
      waveRef.current = setInterval(() => {
        setBars(Array.from({ length: BARS }, () => Math.random() * 32 + 4));
      }, 120);
    } else {
      clearInterval(waveRef.current);
      setBars(Array(BARS).fill(4));
    }
    return () => clearInterval(waveRef.current);
  }, [isRecording]);

  /* timer */
  useEffect(() => {
    let t;
    if (isRecording) t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(blob));
        const fd = new FormData();
        fd.append("file", blob, "rec.webm");
        try {
          setLoading(true);
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          const res = await fetch("http://127.0.0.1:5000/transcribe", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: fd,
          });
          const data = await res.json();
          setTranscript(data.transcript);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
      };
      rec.start();
      setMediaRecorder(rec);
      setIsRecording(true);
      setSeconds(0);
      setAudioURL("");
      setShowSaved(false);
    } catch {
      alert("Microphone access denied.");
    }
  }

  function stop() {
    mediaRecorder.stop();
    setIsRecording(false);
    setSeconds(0);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  }

  return (
    <div className="card fade-up-2" style={{ padding: "36px 32px" }}>

      {/* Top row: label + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <span className="label">Recorder</span>
        {loading ? (
          <span className="chip chip-processing"><div className="spinner" style={{ width:10, height:10, borderWidth:1.5 }} />Processing</span>
        ) : isRecording ? (
          <span className="chip chip-recording"><div className="dot dot-red" />Recording</span>
        ) : (
          <span className="chip chip-idle"><div className="dot dot-gray" />Idle</span>
        )}
      </div>

      {/* Main control row */}
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>

        {/* Button */}
        <button
          onClick={isRecording ? stop : start}
          className={`btn-record ${isRecording ? "btn-record-active" : "btn-record-idle"}`}
          aria-label={isRecording ? "Stop" : "Record"}
        >
          {isRecording ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
              <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Right side content */}
        <div style={{ flex: 1 }}>
          {isRecording ? (
            <>
              <div className="wave" style={{ marginBottom: 10 }}>
                {bars.map((h, i) => (
                  <div key={i} className="wave-bar on" style={{ height: h }} />
                ))}
              </div>
              <div className="timer">{fmt(seconds)}</div>
            </>
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="spinner" />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-1)" }}>Transcribing…</p>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Deepgram AI is at work</p>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-1)", marginBottom: 4 }}>
                {audioURL ? "Ready to play back" : "Ready to record"}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>
                {audioURL ? "Review your audio below" : "Tap the mic to start"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audio playback */}
      {audioURL && !isRecording && (
        <>
          <div className="hr" />
          <audio controls src={audioURL} style={{ marginBottom: 14 }} />
          <button
            className="btn-action btn-action-delete"
            onClick={() => { setAudioURL(""); setTranscript(""); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
            Delete
          </button>
        </>
      )}

      {showSaved && (
        <div className="toast toast-green">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          Saved · transcribing now…
        </div>
      )}
    </div>
  );
}

export default RecorderPanel;