"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function HistoryPage() {
  const router = useRouter();
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Action states
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("green");

  function showToast(msg, type = "green") {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 2800);
  }

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    async function fetchTranscripts() {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API}/transcripts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch transcripts");
        }

        const data = await res.json();
        setTranscripts(data);
      } catch (error) {
        console.error("Error fetching transcripts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTranscripts();
  }, [router]);

  // Search filtering
  const filteredTranscripts = useMemo(() => {
    if (!searchQuery.trim()) return transcripts;
    const lowerQ = searchQuery.toLowerCase();
    return transcripts.filter(t => 
      (t.text && t.text.toLowerCase().includes(lowerQ)) ||
      (t.name && t.name.toLowerCase().includes(lowerQ))
    );
  }, [transcripts, searchQuery]);

  // ── Actions ──────────────────────────────────────
  async function handleCopy(e, item) {
    e.stopPropagation();
    if (!item.text) return;
    try {
      await navigator.clipboard.writeText(item.text);
      setCopiedId(item.id);
      showToast("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy.", "amber");
    }
  }

  function handleDownload(e, item) {
    e.stopPropagation();
    if (!item.text) return;
    const name = item.name
      ? item.name.replace(/[^a-z0-9_\-]/gi, "_")
      : `transcript-${item.id}`;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([item.text], { type: "text/plain" })),
      download: `${name}.txt`,
    });
    a.click();
    showToast("Downloading as .txt");
  }

  async function handleDelete(id) {
    setDeletingId(id);
    const token = getToken();
    try {
      const res = await fetch(`${API}/transcripts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTranscripts(prev => prev.filter(t => t.id !== id));
        showToast("Transcript deleted.");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete.", "amber");
      }
    } catch {
      showToast("An error occurred.", "amber");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  }

  return (
    <>
      {/* Cohesive Dashboard Background Glows */}
      <div className="glow-bg">
        <div className="glow-1" />
        <div className="glow-2" />
      </div>
      <div className="grid-bg" />

      <main className="min-h-screen text-white px-6 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation Button */}
          <div className="mb-8 fade-up">
            <button
              onClick={() => router.push("/")}
              className="btn-action flex items-center gap-2 group focus:outline-none"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "8px 16px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition group-hover:-translate-x-0.5"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="font-semibold text-xs text-slate-300 group-hover:text-white transition">
                Back to Dashboard
              </span>
            </button>
          </div>

          {/* Heading */}
          <div className="mb-10 fade-up">
            <h1
              className="shimmer"
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: "clamp(2rem, 5vw, 2.75rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              Transcript History
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-2)" }}>
              View all your saved AI voice transcriptions in one place
            </p>
          </div>

          {/* Search Box */}
          <div className="fade-up" style={{ marginBottom: 24, animationDelay: "0.1s" }}>
            <div style={{ position: "relative", maxWidth: 400 }}>
              <div 
                style={{ 
                  position: "absolute", 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  left: 14, 
                  display: "flex", 
                  alignItems: "center", 
                  pointerEvents: "none", 
                  color: "#94a3b8" 
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search transcripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 12,
                  paddingLeft: 40,
                  paddingRight: 14,
                  paddingTop: 10,
                  paddingBottom: 10,
                  fontSize: 13.5,
                  color: "#ffffff",
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                className="focus:border-amber-500/50 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
              />
            </div>
          </div>
          {/* Loading State */}
          {loading && (
            <div className="text-center py-24 fade-up">
              <div className="flex justify-center mb-4">
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
              <p className="text-slate-400 text-sm animate-pulse">
                Loading transcripts...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && transcripts.length === 0 && (
            <div className="card text-center py-16 px-8 fade-up-1" style={{ padding: "64px 32px" }}>
              <div className="flex justify-center mb-5 opacity-40">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                No Saved Transcripts
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 300, margin: "0 auto" }}>
                Transcripts from your voice recordings will be archived here automatically.
              </p>
            </div>
          )}

          {!loading && transcripts.length > 0 && filteredTranscripts.length === 0 && (
            <div className="text-center py-12 fade-up">
              <p style={{ color: "var(--text-3)", fontSize: 14 }}>No transcripts match your search.</p>
            </div>
          )}

          {/* Transcript Cards Grid/List */}
          <div className="space-y-6">
            {!loading &&
              filteredTranscripts.map((item, index) => (
                <div
                  key={item.id}
                  className={`card fade-up`}
                  style={{
                    padding: "24px",
                    animationDelay: `${index * 0.05}s`,
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                  onClick={() => router.push(`/history/${item.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <h3 style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: "var(--amber)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "70%"
                    }}>
                      {item.name || `Transcript #${item.id}`}
                    </h3>
                    
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn-action" 
                        onClick={(e) => handleCopy(e, item)}
                        style={{ padding: "6px 8px" }}
                        title="Copy"
                      >
                        {copiedId === item.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                      </button>
                      <button 
                        className="btn-action" 
                        onClick={(e) => handleDownload(e, item)}
                        style={{ padding: "6px 8px" }}
                        title="Download"
                      >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      </button>
                      <button 
                        className="btn-action btn-action-delete" 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(item); }}
                        style={{ padding: "6px 8px" }}
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--text-1)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "120px",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: "vertical",
                      opacity: 0.9
                    }}
                  >
                    {item.text || <span style={{ fontStyle: "italic", opacity: 0.5 }}>No text</span>}
                  </p>

                  <div className="hr" style={{ margin: "16px 0" }} />

                  {/* Metadata Chips Bar */}
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1.5 bg-white/4 border border-white/6 px-2.5 py-1.5 rounded-lg">
                      <span className="opacity-80">Language:</span>
                      <strong className="text-violet-300 font-semibold">{item.language ? item.language.toUpperCase() : "EN"}</strong>
                    </span>

                    <span className="flex items-center gap-1.5 bg-white/4 border border-white/6 px-2.5 py-1.5 rounded-lg">
                      <span className="opacity-80">Duration:</span>
                      <strong className="text-cyan-300 font-semibold">{item.duration_seconds || 0}s</strong>
                    </span>

                    <span className="flex items-center gap-1.5 bg-white/4 border border-white/6 px-2.5 py-1.5 rounded-lg">
                      <span className="opacity-80">Date:</span>
                      <strong className="text-slate-200 font-semibold">
                        {new Date(item.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => !deletingId && setShowDeleteConfirm(null)}
          style={{ zIndex: 1000 }}
        >
          <div className="modal-box fade-up" onClick={(e) => e.stopPropagation()}>
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
                Are you sure you want to delete "{showDeleteConfirm.name || `Transcript #${showDeleteConfirm.id}`}"?
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingId === showDeleteConfirm.id}
                className="btn-action"
                style={{ padding: "10px 22px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                disabled={deletingId === showDeleteConfirm.id}
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
                  cursor: deletingId === showDeleteConfirm.id ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.18s ease",
                }}
              >
                {deletingId === showDeleteConfirm.id ? (
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