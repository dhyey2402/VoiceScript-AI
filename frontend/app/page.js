"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import RecorderPanel from "@/components/RecorderPanel";
import TranscriptPanel from "@/components/TranscriptPanel";

export default function Home() {
  const [transcript, setTranscript]       = useState("");
  const [activeNav, setActiveNav]         = useState("record");
  const [activeTranscript, setActiveTranscript] = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [checkingAuth, setCheckingAuth]   = useState(true);
  const router = useRouter();

  // Profile edit states
  const [user, setUser]                   = useState({ username: "User", email: "" });
  const [editUsername, setEditUsername]   = useState("");
  const [editEmail, setEditEmail]         = useState("");
  const [editPassword, setEditPassword]   = useState("");
  const [saving, setSaving]               = useState(false);
  const [formError, setFormError]         = useState("");
  const [formSuccess, setFormSuccess]     = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const guestMode = localStorage.getItem("guest_mode") === "true" || !token;
    if (!token && !guestMode) {
      router.push("/login");
    } else {
      if (!token) {
        localStorage.setItem("guest_mode", "true");
        setUser({ username: "Guest User", email: "Guest Mode" });
        setCheckingAuth(false);
      } else {
        localStorage.removeItem("guest_mode");
        setCheckingAuth(false);
        // Fetch profile for modal
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.username) {
              setUser(d);
              setEditUsername(d.username);
              setEditEmail(d.email || "");
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (localStorage.getItem("guest_mode") === "true") {
      setFormError("Guest profile cannot be modified. Please register/login.");
      return;
    }
    setSaving(true);
    setFormError("");
    setFormSuccess("");
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) { setFormError("Session expired."); setSaving(false); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: editUsername, email: editEmail, password: editPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Update failed."); return; }
      setFormSuccess("Profile updated!");
      setUser({ username: editUsername, email: editEmail });
      setEditPassword("");
      setTimeout(() => { setModalOpen(false); setFormSuccess(""); }, 1400);
    } catch {
      setFormError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0e12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2.5 }} />
      </div>
    );
  }

  return (
    <>
      <div className="app-shell">
        {/* ── Left Sidebar (icon rail + transcripts panel) ── */}
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          onModalOpen={() => setModalOpen(true)}
          activeTranscriptId={activeTranscript}
          onTranscriptSelect={setActiveTranscript}
        />

        {/* ── Main Content ── */}
        <div className="main-content">
          {/* Recording / Upload panel */}
          <RecorderPanel setTranscript={setTranscript} mode={activeNav} />

          {/* Live Transcription panel */}
          <TranscriptPanel transcript={transcript} />
        </div>
      </div>

      {/* ── Profile Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box fade-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-1)" }}>
                Profile Settings
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text-1)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Alerts */}
            {formError && (
              <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 9, padding: "10px 14px", fontSize: 12.5, color: "#f87171", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 9, padding: "10px 14px", fontSize: 12.5, color: "#86efac", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="form-label">Username</label>
                <input className="form-input" type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="Leave blank to keep unchanged" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "9px 16px", fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "9px 20px", fontSize: 12.5, fontWeight: 700,
                    background: "linear-gradient(135deg, #d97706, #f59e0b)",
                    color: "rgba(0,0,0,0.85)", border: "none", borderRadius: 9,
                    cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.25)",
                    display: "inline-flex", alignItems: "center", gap: 8,
                  }}
                >
                  {saving ? <><div className="spinner" style={{ width: 12, height: 12, borderColor: "rgba(0,0,0,0.15)", borderTopColor: "rgba(0,0,0,0.7)" }} />Saving…</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}