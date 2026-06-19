"use client";
import { useState, useEffect, useRef } from "react";

const NUM_BARS = 60;

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function RecorderPanel({ setTranscript, mode }) {
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

  // Common
  const [loading, setLoading]   = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [bars, setBars]         = useState(Array(NUM_BARS).fill(8));
  const [volume, setVolume]     = useState(80);
  const waveRef = useRef(null);

  const [trialLimitReached, setTrialLimitReached] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("guest_mode") === "true") {
      const txCount = parseInt(localStorage.getItem("guest_tx_count") || "0", 10);
      if (txCount >= 1) {
        setTrialLimitReached(true);
      }
    }
  }, []);

  /* Waveform animation */
  useEffect(() => {
    if (isRecording) {
      waveRef.current = setInterval(() => {
        setBars(
          Array.from({ length: NUM_BARS }, (_, i) => {
            const center = NUM_BARS / 2;
            const dist = Math.abs(i - center) / center;
            const base = (1 - dist * 0.6) * 40;
            return Math.random() * base + 4;
          })
        );
      }, 80);
    } else {
      clearInterval(waveRef.current);
      setBars(Array(NUM_BARS).fill(8));
    }
    return () => clearInterval(waveRef.current);
  }, [isRecording]);

  /* Timer */
  useEffect(() => {
    let t;
    if (isRecording) t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  // Refs for streaming
  const chunksRef = useRef([]);
  const isProcessingRef = useRef(false);

  /* Start recording */
  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      
      rec.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          
          // Pseudo-streaming: send accumulated audio to API
          if (!isProcessingRef.current && isRecording) {
            isProcessingRef.current = true;
            try {
              const blob = new Blob(chunksRef.current, { type: "audio/webm" });
              const fd = new FormData();
              fd.append("audio", blob, "rec.webm");
              
              const token = localStorage.getItem("token") || sessionStorage.getItem("token");
              const headers = {};
              if (token) headers["Authorization"] = `Bearer ${token}`;
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/transcribe?save=false`, {
                method: "POST",
                headers: headers,
                body: fd,
              });
              
              if (res.ok) {
                const data = await res.json();
                if (data.transcript) {
                  setTranscript(data.transcript);
                }
              }
            } catch (err) {
              console.error("Streaming transcription error:", err);
            } finally {
              isProcessingRef.current = false;
            }
          }
        }
      };

      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(blob));
        const fd = new FormData();
        fd.append("audio", blob, "rec.webm");
        try {
          setLoading(true);
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          const headers = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;
          // Final transcription with save=true (default)
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/transcribe`, {
            method: "POST",
            headers: headers,
            body: fd,
          });
          const data = await res.json();
          if (res.ok) {
            setTranscript(data.transcript || "");
            if (localStorage.getItem("guest_mode") === "true" && data.transcript?.trim()) {
              localStorage.setItem("guest_tx_count", "1");
              setTimeout(() => setTrialLimitReached(true), 4000);
            }
            if (!data.transcript?.trim()) {
              alert("No clear speech detected in the recording.");
            }
          } else {
            alert(data.error || "Failed to transcribe audio.");
          }
        } catch (e) {
          console.error(e);
          alert("An error occurred during transcription.");
        } finally {
          setLoading(false);
          chunksRef.current = [];
        }
      };

      // Start with timeslice to fire ondataavailable periodically
      rec.start(3000); 
      setMediaRecorder(rec);
      setIsRecording(true);
      setSeconds(0);
      setAudioURL("");
      setShowSaved(false);
      setTranscript("");
    } catch {
      alert("Microphone access denied.");
    }
  }

  function stop() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream?.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setSeconds(0);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }
  }

  /* Upload handlers */
  const selectFile = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const allowed = ["webm", "wav", "mp3", "m4a", "ogg"];
    if (!allowed.includes(ext)) {
      alert(`Unsupported format. Allowed: ${allowed.join(", ")}`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10 MB.");
      return;
    }
    setSelectedFile(file);
    setUploadAudioURL(URL.createObjectURL(file));
    setTranscript("");
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append("audio", selectedFile, selectedFile.name);
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/transcribe`, {
        method: "POST",
        headers: headers,
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setTranscript(data.transcript || "");
        if (localStorage.getItem("guest_mode") === "true" && data.transcript?.trim()) {
          localStorage.setItem("guest_tx_count", "1");
          setTimeout(() => setTrialLimitReached(true), 4000);
        }
        if (data.transcript?.trim()) {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 3000);
        } else {
          alert("No clear speech detected.");
        }
      } else {
        alert(data.error || "Failed to transcribe.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadAudioURL("");
    setTranscript("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (trialLimitReached) {
    return (
      <div className="recording-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, padding: "40px 20px", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "rgba(245,158,11,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
        </div>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>Trial Limit Reached</h3>
        <p style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 360, lineHeight: 1.5, marginBottom: 24 }}>
          You have successfully tested the one-time free transcription trial. Create a free account to unlock unlimited transcriptions and save history!
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <a
            href="/register"
            style={{
              padding: "10px 18px", borderRadius: 10, textDecoration: "none",
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: "#fff", fontSize: 12.5, fontWeight: 700,
              boxShadow: "0 6px 20px rgba(124,58,237,0.3)",
              cursor: "pointer"
            }}
          >
            Create Free Account
          </a>
          <a
            href="/login"
            style={{
              padding: "10px 18px", borderRadius: 10, textDecoration: "none",
              background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
              color: "var(--text-2)", fontSize: 12.5, fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  /* ── Render: Upload mode ── */
  if (mode === "upload") {
    return (
      <div className="recording-panel" style={{ flex: "none", minHeight: 220 }}>
        <div className="recording-panel-toprow" style={{ marginBottom: 14 }}>
          <span className="recording-title">Audio Upload</span>
          <div className="badge-row">
            {loading
              ? <span className="badge badge-processing"><div className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />Processing</span>
              : <span className="badge badge-idle">Upload Mode</span>
            }
          </div>
        </div>

        {!selectedFile ? (
          <div
            className={`upload-zone${dragOver ? " dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) selectFile(f); }}
            onClick={() => !loading && fileInputRef.current?.click()}
            style={{ cursor: loading ? "not-allowed" : "pointer" }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
              accept="audio/webm,audio/wav,audio/mpeg,audio/mp3,audio/m4a,audio/ogg"
              style={{ display: "none" }}
              disabled={loading}
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Drop your audio file here</p>
            <p style={{ fontSize: 11, color: "var(--text-3)" }}>or click to browse · MP3, WAV, WEBM, M4A, OGG · max 10 MB</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</p>
                <p style={{ fontSize: 10.5, color: "var(--text-3)" }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {uploadAudioURL && <audio controls src={uploadAudioURL} />}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleUploadSubmit}
                disabled={loading}
                style={{
                  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "9px 16px", borderRadius: 9, border: "none",
                  background: "linear-gradient(135deg, #d97706, #f59e0b)",
                  color: "rgba(0,0,0,0.85)", fontWeight: 700, fontSize: 12.5,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(245,158,11,0.3)", fontFamily: "inherit",
                }}
              >
                {loading ? <><div className="spinner" style={{ width: 13, height: 13 }} />Transcribing…</> : "Transcribe File"}
              </button>
              <button className="btn-action btn-action-delete" onClick={clearFile} disabled={loading}>Clear</button>
            </div>
          </div>
        )}

        {showSaved && (
          <div className="toast toast-green">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Transcription complete!
          </div>
        )}
      </div>
    );
  }

  /* ── Render: Record mode (main view) ── */
  const maxSeconds  = 300; // 5 min demo max

  return (
    <div className="recording-panel">
      {/* Top row */}
      <div className="recording-panel-toprow">
        <span className="recording-title">
          Audio Recorder
        </span>
        <div className="badge-row">
          {isRecording ? (
            <>
              <span className="badge badge-active"><span className="dot dot-green" />Active</span>
              <span className="badge badge-amber"><span className="dot dot-amber" />Amber</span>
            </>
          ) : loading ? (
            <span className="badge badge-processing"><div className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />Processing</span>
          ) : (
            <span className="badge badge-idle">Idle</span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="recording-timestamp">
        {fmt(seconds)} / {fmt(maxSeconds)}
      </div>

      {/* Waveform */}
      <div className="waveform-container">
        {bars.map((h, i) => {
          const center = NUM_BARS / 2;
          const dist = Math.abs(i - center) / center;
          const isPeak = isRecording && h > 30 && dist < 0.35;
          return (
            <div
              key={i}
              className={`waveform-bar${isRecording ? " active" : ""}${isPeak ? " peak" : ""}`}
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>

      {/* Record button row */}
      <div className="record-center-row">
        <button
          id="record-btn"
          onClick={isRecording ? stop : start}
          disabled={loading}
          className={`btn-record-main${isRecording ? " recording" : ""}`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(0,0,0,0.8)">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span className="btn-record-time">{fmt(seconds)}</span>
            </>
          ) : loading ? (
            <div className="spinner" style={{ width: 20, height: 20, borderColor: "rgba(0,0,0,0.2)", borderTopColor: "rgba(0,0,0,0.8)" }} />
          ) : (
            <>
              <span className="btn-record-label">RECORD</span>
              <span className="btn-record-time">{fmt(seconds)} / {fmt(maxSeconds)}</span>
            </>
          )}
        </button>
      </div>

      {/* Controls row */}
      <div className="controls-row">
        {/* Volume */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="vol-slider"
          style={{
            background: `linear-gradient(to right, var(--amber) ${volume}%, rgba(255,255,255,0.1) ${volume}%)`,
          }}
          aria-label="Volume"
        />
        <span className="ctrl-text">{volume}%</span>

        <div className="ctrl-sep" />

        {/* Playback speed */}
        <span className="ctrl-text">1×</span>

        <div className="ctrl-sep" />

        {/* Duration */}
        <span className="ctrl-text" style={{ marginLeft: "auto" }}>
          {fmt(seconds)} / {fmt(maxSeconds)}
        </span>
      </div>

      {/* Playback after recording */}
      {audioURL && !isRecording && (
        <div style={{ marginTop: 14 }}>
          <div className="hr" />
          <audio controls src={audioURL} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={audioURL}
              download="recording.webm"
              className="btn-action"
              style={{
                fontSize: 11,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                background: "rgba(245,158,11,0.08)",
                color: "var(--amber)",
                borderColor: "rgba(245,158,11,0.2)"
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Recording
            </a>
            <button
              className="btn-action btn-action-delete"
              style={{ fontSize: 11 }}
              onClick={() => { setAudioURL(""); setTranscript(""); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
              </svg>
              Delete Recording
            </button>
          </div>
        </div>
      )}

      {showSaved && (
        <div className="toast toast-amber">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          Recording saved · Transcribing…
        </div>
      )}
    </div>
  );
}

export default RecorderPanel;