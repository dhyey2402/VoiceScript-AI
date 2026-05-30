"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

  // User Profile States
  const [user, setUser] = useState({ username: "User", email: "" });
  
  // Edit Profile States
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current user details on load
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      fetch(`${API}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            router.push("/login");
            throw new Error("Unauthorized");
          }
          if (!res.ok) throw new Error("Failed to fetch profile");
          return res.json();
        })
        .then((data) => {
          if (data.username) {
            setUser(data);
            setEditUsername(data.username);
            setEditEmail(data.email);
          }
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
        });
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    router.push("/login");
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setError("Session expired. Please log in again.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          password: editPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setSuccess("Profile updated successfully!");
      setUser({ username: editUsername, email: editEmail });
      setEditPassword("");
      
      // Auto close modal after brief delay
      setTimeout(() => {
        setModalOpen(false);
        setSuccess("");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Get user initial for avatar display
  const userInitial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <header style={{ position: "relative", padding: "72px 24px 48px" }}>
      {/* Floating Top Navbar Container */}
      <div
        className="absolute"
        style={{
          top: 24,
          right: 24,
          zIndex: 100,
        }}
      >
        {/* Avatar Circular Glass Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center rounded-full transition duration-200 focus:outline-none"
          style={{
            width: 44,
            height: 44,
            background: "rgba(255, 255, 255, 0.05)",
            border: menuOpen ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: menuOpen ? "0 0 14px rgba(139,92,246,0.3)" : "none",
            cursor: "pointer",
          }}
          aria-label="User profile menu"
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              background: "linear-gradient(135deg, #c4b5fd 0%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {userInitial}
          </span>
        </button>

        {/* Backdrop-blurred Dropdown Menu */}
        {menuOpen && (
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            
            <div
              className="absolute right-0 mt-3 rounded-2xl z-50 fade-up"
              style={{
                width: 280,
                background: "rgba(10, 12, 20, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                padding: "24px 20px",
                boxShadow: "0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)",
                animationDuration: "0.2s",
              }}
            >
              {/* Active User Metadata */}
              <div 
                className="pb-4" 
                style={{ 
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 16
                }}
              >
                <p 
                  className="text-white truncate"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                    letterSpacing: "-0.01em"
                  }}
                >
                  {user.username}
                </p>
                <p 
                  className="truncate mt-1"
                  style={{
                    fontSize: 12.5,
                    color: "#94a3b8",
                  }}
                >
                  {user.email}
                </p>
              </div>

              {/* Action items list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setModalOpen(true);
                  }}
                  className="w-full flex items-center hover:text-white rounded-xl hover:bg-white/5 transition text-left focus:outline-none cursor-pointer"
                  style={{
                    padding: "10px 14px",
                    gap: "14px",
                    color: "#cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 500
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#8b5cf6" }}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Profile Settings
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/history");
                  }}
                  className="w-full flex items-center hover:text-white rounded-xl hover:bg-white/5 transition text-left focus:outline-none cursor-pointer"
                  style={{
                    padding: "10px 14px",
                    gap: "14px",
                    color: "#cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 500
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#06b6d4" }}>
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Transcript History
                </button>

                <div className="h-[1px] bg-white/6" style={{ margin: "8px 0" }} />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center hover:text-rose-300 rounded-xl hover:bg-rose-500/10 transition text-left focus:outline-none cursor-pointer"
                  style={{
                    padding: "10px 14px",
                    gap: "14px",
                    color: "#f43f5e",
                    fontSize: 13.5,
                    fontWeight: 600
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Branding Logo & Slogan Header (Original UI Layout Elevated) */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <div
          className="fade-up"
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
            <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <h1
        className="shimmer fade-up"
        style={{
          fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: 14,
          textAlign: "center",
        }}
      >
        VoiceScript
      </h1>

      <p
        className="fade-up-1"
        style={{
          fontSize: "1rem",
          color: "var(--text-2)",
          lineHeight: 1.65,
          maxWidth: 380,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        Speak and get perfectly formatted text — powered by Deepgram AI.
      </p>

      {/* Profile Management Overlay Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 z-[999]"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Modal click-away */}
          <div className="absolute inset-0" onClick={() => setModalOpen(false)} />

          <div
            className="w-full max-w-[440px] card fade-up z-10"
            style={{
              padding: "44px 36px",
              background: "rgba(10, 12, 20, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              animationDuration: "0.25s",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.65rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Profile Settings
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition rounded-full p-1.5 hover:bg-white/5 cursor-pointer focus:outline-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Error alerts inside modal */}
            {error && (
              <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-6 fade-up">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success alerts inside modal */}
            {success && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm mb-6 fade-up">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Profile Update Form */}
            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Edit Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    paddingLeft: 18,
                    paddingRight: 18,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 14,
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  className="focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                  required
                />
              </div>

              {/* Edit Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    paddingLeft: 18,
                    paddingRight: 18,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 14,
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  className="focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                  required
                />
              </div>

              {/* Edit Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    paddingLeft: 18,
                    paddingRight: 18,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 14,
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  className="focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                />
              </div>

              <div className="h-[2px]" />

              {/* Footer Modal Action Row */}
              <div 
                className="flex justify-end items-center gap-4 pt-4" 
                style={{ 
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  marginTop: 8
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="hover:text-white transition cursor-pointer"
                  style={{
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#cbd5e1",
                    background: "transparent",
                    border: "none",
                    outline: "none"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="relative overflow-hidden group transition duration-300"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                    boxShadow: "0 6px 18px rgba(124, 58, 237, 0.25)",
                    color: "#ffffff",
                    cursor: saving ? "not-allowed" : "pointer",
                    padding: "11px 22px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    outline: "none"
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {saving ? (
                      <>
                        <div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5, borderTopColor: "#fff" }} />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;