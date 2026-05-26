"use client";
import { useState, useEffect, useRef } from "react";

const BARS = 13;

function RecorderPanel({ setTranscript }) {
  const [activeTab, setActiveTab] = useState("record"); // "record" or "upload"
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds]         = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL]       = useState("");
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadAudioURL, setUploadAudioURL] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Common states
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

  // Reset states when switching tabs
  const handleTabChange = (tab) => {
    if (isRecording) return;
    setActiveTab(tab);
    setTranscript("");
    if (tab === "record") {
      setSelectedFile(null);
      setUploadAudioURL("");
    } else {
      setAudioURL("");
    }
  };

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
        fd.append("audio", blob, "rec.webm"); // Use 'audio' matching the backend API
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
          if (res.ok) {
            setTranscript(data.transcript);
            if (!data.transcript || data.transcript.trim() === "") {
              alert("Transcription was successful, but no clear speech could be recognized in the audio file.");
            }
          } else {
            alert(data.error || "Failed to transcribe audio.");
          }
        } catch (e) { 
          console.error(e); 
          alert("An error occurred during transcription.");
        } finally { 
          setLoading(false); 
        }
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
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setSeconds(0);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }
  }

  // Upload Actions
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const selectFile = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    const allowed = ["webm", "wav", "mp3", "m4a", "ogg"];
    if (!allowed.includes(extension)) {
      alert(`Unsupported file format. Supported formats: ${allowed.join(", ")}`);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 10MB.");
      return;
    }

    setSelectedFile(file);
    setUploadAudioURL(URL.createObjectURL(file));
    setTranscript("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    const fd = new FormData();
    fd.append("audio", selectedFile, selectedFile.name);

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
      if (res.ok) {
        setTranscript(data.transcript);
        if (!data.transcript || data.transcript.trim() === "") {
          alert("Transcription was successful, but no clear speech could be recognized in the audio file. Make sure your file contains distinct, spoken words.");
        } else {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 3000);
        }
      } else {
        alert(data.error || "Failed to transcribe audio.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during transcription.");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadAudioURL("");
    setTranscript("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="card fade-up-2" style={{ padding: "36px 32px" }}>

      {/* Top row: label + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <span className="label">Transcription Center</span>
        {loading ? (
          <span className="chip chip-processing"><div className="spinner" style={{ width:10, height:10, borderWidth:1.5 }} />Processing</span>
        ) : isRecording ? (
          <span className="chip chip-recording"><div className="dot dot-red" />Recording</span>
        ) : (
          <span className="chip chip-idle"><div className="dot dot-gray" />Idle</span>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "14px",
        padding: "4px",
        marginBottom: "28px"
      }}>
        <button
          onClick={() => handleTabChange("record")}
          disabled={isRecording || loading}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "record" ? "rgba(255, 255, 255, 0.06)" : "transparent",
            color: activeTab === "record" ? "var(--text-1)" : "var(--text-2)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: (isRecording || loading) ? "not-allowed" : "pointer",
            transition: "all 0.2s var(--ease)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </svg>
          Voice Recorder
        </button>
        <button
          onClick={() => handleTabChange("upload")}
          disabled={isRecording || loading}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "upload" ? "rgba(255, 255, 255, 0.06)" : "transparent",
            color: activeTab === "upload" ? "var(--text-1)" : "var(--text-2)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: (isRecording || loading) ? "not-allowed" : "pointer",
            transition: "all 0.2s var(--ease)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Audio Upload
        </button>
      </div>

      {/* Voice Recorder View */}
      {activeTab === "record" && (
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Record Button */}
          <button
            onClick={isRecording ? stop : start}
            className={`btn-record ${isRecording ? "btn-record-active" : "btn-record-idle"}`}
            aria-label={isRecording ? "Stop" : "Record"}
            disabled={loading}
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
      )}

      {/* Voice Playback */}
      {activeTab === "record" && audioURL && !isRecording && (
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

      {/* Audio Upload View */}
      {activeTab === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              style={{
                border: dragOver ? "2px dashed var(--purple)" : "2px dashed rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                padding: "36px 24px",
                textAlign: "center",
                cursor: loading ? "not-allowed" : "pointer",
                background: dragOver ? "rgba(139, 92, 246, 0.04)" : "rgba(255, 255, 255, 0.01)",
                transition: "all 0.2s var(--ease)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                position: "relative"
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/webm,audio/wav,audio/mpeg,audio/mp3,audio/m4a,audio/ogg"
                style={{ display: "none" }}
                disabled={loading}
              />
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(139, 92, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--purple)",
                marginBottom: "4px"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-1)", marginBottom: "4px" }}>
                  Drag & drop your audio file here
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
                  or click to browse from device
                </p>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "4px", letterSpacing: "0.02em" }}>
                Supports MP3, WAV, WEBM, M4A, OGG up to 10MB
              </p>
            </div>
          ) : (
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              {/* File Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--indigo)"
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "var(--text-1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "2px"
                  }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || "Audio file"}
                  </p>
                </div>
              </div>

              {/* Audio Playback Preview */}
              {uploadAudioURL && (
                <div style={{ marginTop: "4px" }}>
                  <audio controls src={uploadAudioURL} style={{ width: "100%" }} />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <button
                  onClick={handleUploadSubmit}
                  disabled={loading}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(139, 92, 246, 0.25)",
                    transition: "all 0.2s var(--ease)"
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }} />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="12 2 2 22 22 22" />
                      </svg>
                      Transcribe File
                    </>
                  )}
                </button>
                
                <button
                  onClick={clearFile}
                  disabled={loading}
                  className="btn-action btn-action-delete"
                  style={{ padding: "10px 16px" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                  </svg>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showSaved && (
        <div className="toast toast-green">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          Success · transcribing now…
        </div>
      )}
    </div>
  );
}

export default RecorderPanel;