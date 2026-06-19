"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Icon components
const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const HistoryIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
  </svg>
);

const SettingsIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" />
  </svg>
);

const UploadIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DotsIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />
  </svg>
);

const LogoutIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatDuration(seconds) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


export default function Sidebar({ activeNav, onNavChange, onModalOpen, activeTranscriptId, onTranscriptSelect }) {
  const router = useRouter();
  const [user, setUser] = useState({ username: "User", email: "" });
  const [transcripts, setTranscripts] = useState([]);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const renameInputRef = useRef(null);

  // Fetch user profile
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setUser({ username: "Guest User", email: "Guest Mode" });
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.username) setUser(d); })
      .catch(() => {});
  }, []);

  // Fetch recent transcripts
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/transcripts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTranscripts(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    router.push("/login");
  }

  async function handleDelete(e, id) {
    e.stopPropagation(); // prevent selecting the item
    if (!window.confirm("Delete this transcript? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/transcripts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTranscripts((prev) => prev.filter((t) => String(t.id) !== String(id)));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete.");
      }
    } catch {
      alert("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  }

  function startRename(e, item) {
    e.stopPropagation();
    setRenamingId(item.id);
    setRenameValue(item.name || item.title);
    // Focus input on next tick
    setTimeout(() => renameInputRef.current?.focus(), 30);
  }

  async function commitRename(id) {
    const trimmed = renameValue.trim();
    if (!trimmed) { cancelRename(); return; }
    // Skip API call if unchanged
    const current = transcripts.find((t) => String(t.id) === String(id));
    if (trimmed === (current?.name || "")) { cancelRename(); return; }

    setRenameSaving(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/transcripts/${id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setTranscripts((prev) =>
          prev.map((t) => String(t.id) === String(id) ? { ...t, name: trimmed } : t)
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to rename.");
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setRenameSaving(false);
      setRenamingId(null);
    }
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  const userInitial = user.username && localStorage.getItem("guest_mode") !== "true" ? user.username.charAt(0).toUpperCase() : "G";

  // Build display list — prefer custom name, fall back to text preview
  const displayList = transcripts.map((t) => ({
    id: String(t.id),
    name: t.name || null,
    title: t.name
      ? t.name
      : t.text
      ? t.text.slice(0, 32) + (t.text.length > 32 ? "\u2026" : "")
      : "Recording",
    date: formatDate(t.created_at),
    duration: formatDuration(t.duration_seconds),
    dot: "green",
  }));

  return (
    <>
      {/* ── Icon Rail ── */}
      <div className="icon-rail">
        {/* Logo */}
        <div className="icon-rail-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
            <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Nav icons */}
        <button
          id="nav-record"
          className={`icon-btn${activeNav === "record" ? " active" : ""}`}
          title="Record"
          onClick={() => onNavChange("record")}
        >
          <MicIcon />
        </button>
        <button
          id="nav-history"
          className={`icon-btn${activeNav === "history" ? " active" : ""}`}
          title="History"
          onClick={() => {
            if (localStorage.getItem("guest_mode") === "true") {
              router.push("/register");
            } else {
              router.push("/history");
            }
          }}
        >
          <HistoryIcon />
        </button>
        <button
          id="nav-upload"
          className={`icon-btn${activeNav === "upload" ? " active" : ""}`}
          title="Upload Audio"
          onClick={() => onNavChange("upload")}
        >
          <UploadIcon />
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings */}
        <button
          id="nav-settings"
          className="icon-btn"
          title="Settings"
          onClick={() => {
            if (localStorage.getItem("guest_mode") === "true") {
              router.push("/register");
            } else {
              onModalOpen && onModalOpen();
            }
          }}
        >
          <SettingsIcon />
        </button>

        {/* Avatar */}
        <div style={{ position: "relative" }}>
          <button
            id="nav-avatar"
            onClick={() => setAvatarMenuOpen((p) => !p)}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: localStorage.getItem("guest_mode") === "true"
                ? "linear-gradient(135deg, #4b5563, #6b7280)"
                : avatarMenuOpen ? "2px solid rgba(245,158,11,0.6)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(0,0,0,0.85)",
              flexShrink: 0,
              transition: "all 0.18s ease",
              boxShadow: avatarMenuOpen ? "0 0 0 3px rgba(245,158,11,0.15)" : "none",
            }}
          >
            {userInitial}
          </button>

          {/* Avatar dropdown */}
          {avatarMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAvatarMenuOpen(false)} />
              <div
                className="fade-up"
                style={{
                  position: "absolute",
                  left: "calc(100% + 10px)",
                  bottom: 0,
                  zIndex: 50,
                  width: 220,
                  background: "#181b22",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 14,
                  padding: "16px 14px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                  animationDuration: "0.18s",
                }}
              >
                <div style={{ paddingBottom: 12, marginBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>{user.username}</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                </div>
                {localStorage.getItem("guest_mode") === "true" ? (
                  <>
                    <button
                      onClick={() => { setAvatarMenuOpen(false); router.push("/login"); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent",
                        color: "var(--text-2)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg> Sign In
                    </button>
                    <button
                      onClick={() => { setAvatarMenuOpen(false); router.push("/register"); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent",
                        color: "var(--amber)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginTop: 4, transition: "all 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg> Register
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setAvatarMenuOpen(false); onModalOpen && onModalOpen(); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent",
                        color: "var(--text-2)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <SettingsIcon size={14} /> Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent",
                        color: "#f87171", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginTop: 4, transition: "all 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <LogoutIcon size={14} /> Sign Out
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Transcripts Sidebar ── */}
      <div className="transcripts-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-label">Recent Transcripts</span>
          <button
            style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}
            title="More options"
          >
            <DotsIcon />
          </button>
        </div>

        <div className="sidebar-list">
          {displayList.length === 0 ? (
            localStorage.getItem("guest_mode") === "true" ? (
              <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-3)", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <p style={{ fontSize: 11.5, lineHeight: 1.4 }}>Create an account to save your transcription history!</p>
                <button
                  onClick={() => router.push("/register")}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    cursor: "pointer", transition: "transform 0.15s ease",
                    boxShadow: "0 4px 12px rgba(124,58,237,0.25)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  Sign Up Free
                </button>
              </div>
            ) : (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-3)", fontSize: 11 }}>
                No recordings yet
              </div>
            )
          ) : (
            displayList.map((item) => (
              <div
                key={item.id}
                className={`transcript-item${activeTranscriptId === item.id ? " active" : ""}`}
                onClick={() => renamingId !== item.id && onTranscriptSelect && onTranscriptSelect(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ position: "relative" }}
              >
                {/* Title — inline editable when renamingId matches */}
                {renamingId === item.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(item.id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={renameSaving}
                    maxLength={200}
                    placeholder="Enter a name…"
                    style={{
                      width: "100%",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.4)",
                      borderRadius: 6,
                      padding: "3px 6px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-1)",
                      outline: "none",
                      fontFamily: "inherit",
                      marginBottom: 3,
                    }}
                  />
                ) : (
                  <div
                    className="transcript-item-title"
                    title={item.name ? `Custom name: ${item.name}` : "Double-click to rename"}
                  >
                    {item.title}
                    {item.name && (
                      <span style={{
                        display: "inline-block",
                        width: 5, height: 5,
                        borderRadius: "50%",
                        background: "var(--amber)",
                        marginLeft: 5,
                        verticalAlign: "middle",
                        opacity: 0.7,
                      }} />
                    )}
                  </div>
                )}

                <div className="transcript-item-date">{item.date}</div>
                <div className="transcript-item-bottom">
                  <span className={`transcript-dot transcript-dot-${item.dot}`} />
                  <span className="transcript-duration">{item.duration}</span>
                </div>

                {/* Action buttons — appear on hover */}
                {hoveredId === item.id && renamingId !== item.id && (
                  <div style={{
                    position: "absolute",
                    top: 7,
                    right: 7,
                    display: "flex",
                    gap: 3,
                  }}>
                    {/* Rename button */}
                    <button
                      onClick={(e) => startRename(e, item)}
                      title="Rename transcript"
                      style={{
                        width: 22, height: 22, borderRadius: 6, border: "none",
                        background: "rgba(245,158,11,0.12)",
                        color: "var(--amber)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", padding: 0, transition: "all 0.15s",
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      title="Delete transcript"
                      style={{
                        width: 22, height: 22, borderRadius: 6, border: "none",
                        background: "rgba(244,63,94,0.12)",
                        color: "#f87171",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: deletingId === item.id ? "not-allowed" : "pointer",
                        padding: 0, transition: "all 0.15s",
                      }}
                    >
                      {deletingId === item.id ? (
                        <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
