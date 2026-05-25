"use client";
import { useState } from "react";

function TranscriptPanel({ transcript }) {
  const [copied, setCopied] = useState(false);
  const words  = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const empty  = !transcript;

  async function copy() {
    if (empty) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (empty) return;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([transcript], { type: "text/plain" })),
      download: `transcript-${Date.now()}.txt`,
    });
    a.click();
  }

  return (
    <div className="card" style={{ padding: "36px 32px" }}>

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="label">Transcript</span>
          {!empty && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 9px",
              borderRadius: 100,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#a5b4fc",
            }}>
              {words} {words === 1 ? "word" : "words"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-action" onClick={copy} disabled={empty} aria-label="Copy">
            {copied ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Copied</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
            )}
          </button>
          <button className="btn-action" onClick={download} disabled={empty} aria-label="Export">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Text area */}
      <div className="tx-area">
        {empty ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 110, gap: 10, opacity: 0.38 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ color: "var(--text-3)" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p style={{ fontSize: 13.5, color: "var(--text-3)", textAlign: "center", fontStyle: "italic" }}>
              Transcript will appear here
            </p>
          </div>
        ) : (
          transcript
        )}
      </div>

      {copied && (
        <div className="toast toast-indigo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Copied to clipboard
        </div>
      )}
    </div>
  );
}

export default TranscriptPanel;