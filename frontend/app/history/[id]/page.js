"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

function fmt(s) {
  if (!s && s !== 0) return "--:--";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

export default function TranscriptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // Action states
  const [copied, setCopied]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMsg, setToastMsg]     = useState("");
  const [toastType, setToastType]   = useState("green");

  function showToast(msg, type = "green") {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 2800);
  }

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // ── Fetch transcript detail ──────────────────────
  const fetchTranscript = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    try {
      const res = await fetch(`${API}/transcripts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        router.push("/login");
        return;
      }
      if (res.status === 404) { setError("Transcript not found."); return; }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTranscript(data);
    } catch {
      setError("Failed to load transcript. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchTranscript(); }, [fetchTranscript]);

  // ── Copy ─────────────────────────────────────────
  async function handleCopy() {
    if (!transcript?.text) return;
    try {
      await navigator.clipboard.writeText(transcript.text);
      setCopied(true);
      showToast("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy.", "amber");
    }
  }

  // ── Download .txt ────────────────────────────────
  function handleDownload() {
    if (!transcript?.text) return;
    const name = transcript.name
      ? transcript.name.replace(/[^a-z0-9_\-]/gi, "_")
      : `transcript-${transcript.id}`;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([transcript.text], { type: "text/plain" })),
      download: `${name}.txt`,
    });
    a.click();
    showToast("Downloading as .txt");
  }

  // ── Delete ───────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    const token = getToken();
    try {
      const res = await fetch(`${API}/transcripts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("Transcript deleted.");
        setTimeout(() => router.push("/history"), 900);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete.", "amber");
        setShowDeleteConfirm(false);
      }
    } catch {
      showToast("An error occurred.", "amber");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  // Word count helper
  const wordCount = transcript?.text
    ? transcript.text.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <>
      {/* Background */}
      <div className="glow-bg">
        <div className="glow-1" />
        <div className="glow-2" />
      </div>
      <div className="grid-bg" />

      <main
        style={{
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
          padding: "48px 24px 80px",
          color: "var(--text-1)",
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          {/* Back button */}
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <button
              onClick={() => router.push("/history")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "8px 16px",
                cursor: "pointer",
                color: "var(--text-2)",
                fontSize: 12.5,
                fontWeight: 600,
                transition: "all 0.18s ease",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "var(--text-1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.color = "var(--text-2)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to History
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-3)", fontSize: 13 }}>Loading transcript…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="card fade-up"
              style={{ padding: "40px 32px", textAlign: "center", borderColor: "rgba(244,63,94,0.2)" }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" style={{ margin: "0 auto 16px", opacity: 0.7 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ color: "#f87171", fontSize: 15, fontWeight: 600 }}>{error}</p>
              <button
                onClick={() => router.push("/history")}
                className="btn-action"
                style={{ marginTop: 20 }}
              >
                Go to History
              </button>
            </div>
          )}

          {/* Transcript detail */}
          {!loading && !error && transcript && (
            <>
              {/* Header row */}
              <div className="fade-up" style={{ marginBottom: 24 }}>
                <h1
                  className="shimmer"
                  style={{
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    marginBottom: 8,
                  }}
                >
                  {transcript.name ||
                    (transcript.text
                      ? transcript.text.slice(0, 48) + (transcript.text.length > 48 ? "…" : "")
                      : "Untitled Recording")}
                </h1>
                <p style={{ color: "var(--text-3)", fontSize: 12.5 }}>
                  Transcript #{transcript.id}
                </p>
              </div>

              {/* Metadata chips */}
              <div
                className="fade-up"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 28,
                }}
              >
                {[
                  {
                    label: "Language",
                    value: (transcript.language || "EN").toUpperCase(),
                    color: "#a78bfa",
                  },
                  {
                    label: "Duration",
                    value: fmt(transcript.duration_seconds),
                    color: "#67e8f9",
                  },
                  {
                    label: "Words",
                    value: wordCount.toLocaleString(),
                    color: "var(--amber)",
                  },
                  {
                    label: "Date",
                    value: formatDate(transcript.created_at),
                    color: "var(--text-1)",
                  },
                  ...(transcript.filename
                    ? [{ label: "File", value: transcript.filename, color: "#86efac" }]
                    : []),
                ].map(({ label, value, color }) => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 8,
                      padding: "5px 11px",
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: "var(--text-3)",
                      maxWidth: "100%",
                    }}
                  >
                    {label}:&nbsp;
                    <strong style={{ color, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                      {value}
                    </strong>
                  </span>
                ))}
              </div>

              {/* Action bar */}
              <div
                className="fade-up"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {/* Copy */}
                <button
                  id="detail-copy"
                  className="btn-action"
                  onClick={handleCopy}
                  style={{ padding: "9px 16px", fontSize: 12.5 }}
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Text
                    </>
                  )}
                </button>

                {/* Download .txt */}
                <button
                  id="detail-download"
                  className="btn-action"
                  onClick={handleDownload}
                  style={{ padding: "9px 16px", fontSize: 12.5 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download .txt
                </button>

                {/* Delete */}
                <button
                  id="detail-delete"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-action btn-action-delete"
                  style={{ padding: "9px 16px", fontSize: 12.5, marginLeft: "auto" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                  Delete
                </button>
              </div>

              {/* Transcript text card */}
              <div
                className="card fade-up"
                style={{ padding: "28px 28px" }}
              >
                {transcript.text ? (
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.85,
                      color: "var(--text-1)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {transcript.text}
                  </p>
                ) : (
                  <p style={{ color: "var(--text-3)", fontStyle: "italic", fontSize: 14, textAlign: "center" }}>
                    No transcript text available.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div className="modal-box fade-up" onClick={(e) => e.stopPropagation()}>
            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text-1)",
                  marginBottom: 8,
                }}
              >
                Delete Transcript?
              </h2>
              <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6 }}>
                This action cannot be undone. The transcript will be permanently removed.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-action"
                style={{ padding: "10px 22px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 22px",
                  borderRadius: 9,
                  border: "1px solid rgba(244,63,94,0.3)",
                  background: "rgba(244,63,94,0.12)",
                  color: "#f87171",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.18s ease",
                }}
              >
                {deleting ? (
                  <>
                    <div className="spinner" style={{ width: 13, height: 13 }} />
                    Deleting…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className={`toast toast-${toastType}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toastMsg}
        </div>
      )}
    </>
  );
}
