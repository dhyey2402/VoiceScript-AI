"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTranscripts() {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/transcripts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch transcripts");
        }

        const data = await response.json();
        setTranscripts(data);
      } catch (error) {
        console.error("Error fetching transcripts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTranscripts();
  }, [router]);

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

          {/* Transcript Cards Grid/List */}
          <div className="space-y-6">
            {!loading &&
              transcripts.map((item, index) => (
                <div
                  key={item.id}
                  className={`card fade-up`}
                  style={{
                    padding: "28px 24px",
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  {/* Card Content Transcript */}
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.7,
                      color: "var(--text-1)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.text}
                  </p>

                  <div className="hr" style={{ margin: "20px 0" }} />

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
                        {new Date(item.created_at).toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </>
  );
}