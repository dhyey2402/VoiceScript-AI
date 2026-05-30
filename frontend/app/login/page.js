"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("token", data.token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", data.token);
        localStorage.removeItem("token");
      }
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
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

      <main className="min-h-screen flex items-center justify-center px-6 relative z-10">
        <div 
          className="w-full max-w-[420px] card fade-up" 
          style={{ 
            padding: "48px 40px",
            background: "rgba(10, 12, 20, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)"
          }}
        >
          {/* Logo Branding */}
          <div className="flex justify-center mb-8">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
                <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className="shimmer"
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: "2.5rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: 8,
              }}
            >
              VoiceScript
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-2)", letterSpacing: "0.01em" }}>
              Sign in to manage your AI transcripts
            </p>
          </div>

          {/* Alert Error Banner */}
          {error && (
            <div
              className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-6 fade-up"
              style={{ animationDuration: "0.2s" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Spacious & Robust Input Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <div 
                  style={{ 
                    position: "absolute", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    left: 16, 
                    display: "flex", 
                    alignItems: "center", 
                    pointerEvents: "none", 
                    color: "#94a3b8" 
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    paddingLeft: 48,
                    paddingRight: 18,
                    paddingTop: 14,
                    paddingBottom: 14,
                    fontSize: 14,
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  className="focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <div 
                  style={{ 
                    position: "absolute", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    left: 16, 
                    display: "flex", 
                    alignItems: "center", 
                    pointerEvents: "none", 
                    color: "#94a3b8" 
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    paddingLeft: 48,
                    paddingRight: 18,
                    paddingTop: 14,
                    paddingBottom: 14,
                    fontSize: 14,
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  className="focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                  required
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: "flex", alignItems: "center", marginTop: 4, marginBottom: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: 17,
                    height: 17,
                    accentColor: "#8b5cf6",
                    cursor: "pointer",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 4
                  }}
                />
                <span style={{ fontSize: 13.5, color: "var(--text-2)", fontWeight: 500 }}>
                  Remember Me
                </span>
              </label>
            </div>

            {/* Gradient Premium Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden group py-3.5 rounded-2xl font-semibold text-sm transition duration-300 focus:outline-none"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.3)",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 8
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: "#fff" }} />
                    Logging in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition group-hover:translate-x-0.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </span>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            </button>

            {/* Redirection Link */}
            <p style={{ color: "var(--text-2)", fontSize: 13.5 }} className="text-center mt-6">
              Don't have an account?{" "}
              <a
                href="/register"
                className="font-semibold text-violet-400 hover:text-violet-300 hover:underline transition"
              >
                Register
              </a>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}