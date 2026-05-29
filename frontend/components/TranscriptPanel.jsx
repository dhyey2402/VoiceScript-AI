"use client";
import { useState, useEffect, useRef } from "react";

// Parse raw transcript into speaker blocks (heuristic split on newlines or "Speaker N:" patterns)
function parseBlocks(text) {
  if (!text) return [];
  // Try speaker-tagged format: "Speaker 1 (Name): text"
  const speakerRe = /^(Speaker\s+\d+(?:\s*\([^)]*\))?)\s*:\s*/im;
  if (speakerRe.test(text)) {
    const lines = text.split(/\n+/).filter(Boolean);
    const blocks = [];
    let current = null;
    for (const line of lines) {
      const m = line.match(/^(Speaker\s+\d+(?:\s*\([^)]*\))?)\s*:\s*(.*)$/i);
      if (m) {
        if (current) blocks.push(current);
        current = { speaker: m[1], text: m[2] };
      } else if (current) {
        current.text += " " + line;
      } else {
        blocks.push({ speaker: null, text: line });
      }
    }
    if (current) blocks.push(current);
    return blocks;
  }
  // Fallback: single block
  return [{ speaker: null, text }];
}

// Animate text reveal character by character
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState(text);
  const prev = useRef(text);
  useEffect(() => {
    if (text === prev.current) return;
    // Only animate appended text
    if (text.startsWith(prev.current)) {
      const newPart = text.slice(prev.current.length);
      let i = 0;
      const base = prev.current;
      const id = setInterval(() => {
        i++;
        setDisplayed(base + newPart.slice(0, i));
        if (i >= newPart.length) clearInterval(id);
      }, speed);
      prev.current = text;
      return () => clearInterval(id);
    } else {
      setDisplayed(text);
      prev.current = text;
    }
  }, [text, speed]);
  return displayed;
}

function TranscriptPanel({ transcript }) {
  const [copied, setCopied] = useState(false);
  const displayed = useTypewriter(transcript || "");
  const blocks = parseBlocks(displayed);
  const bodyRef = useRef(null);

  const empty = !displayed?.trim();
  const wordCount = displayed ? displayed.trim().split(/\s+/).filter(Boolean).length : 0;

  // Auto-scroll to bottom as text grows
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [displayed]);

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

  // Speaker color cycling
  const speakerColors = ["var(--amber)", "#60a5fa", "#34d399", "#f472b6", "#a78bfa"];
  const speakerMap = {};
  let colorIdx = 0;
  function speakerColor(speaker) {
    if (!speaker) return "var(--text-3)";
    if (!speakerMap[speaker]) {
      speakerMap[speaker] = speakerColors[colorIdx % speakerColors.length];
      colorIdx++;
    }
    return speakerMap[speaker];
  }

  return (
    <div className="transcript-panel">
      {/* Header */}
      <div className="transcript-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="live-label">Live Transcription</span>
          {!empty && (
            <span style={{
              fontSize: 9.5, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              color: "var(--amber)",
            }}>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          )}
          {!empty && (
            <span className="analyzing-label">Analyzing input…</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            id="transcript-copy"
            className="btn-action"
            onClick={copy}
            disabled={empty}
            aria-label="Copy transcript"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            id="transcript-export"
            className="btn-action"
            onClick={download}
            disabled={empty}
            aria-label="Export transcript"
            title="Download as .txt"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          {/* Collapse icon (visual only) */}
          <button
            style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
            title="Collapse"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="transcript-body" ref={bodyRef}>
        {empty ? (
          <div className="transcript-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", fontStyle: "italic" }}>
              Transcript will appear here as you record
            </p>
          </div>
        ) : (
          blocks.map((block, i) => (
            <div key={i} className="transcript-block">
              {block.speaker && (
                <span className="transcript-speaker" style={{ color: speakerColor(block.speaker) }}>
                  {block.speaker}:
                </span>
              )}
              <p className="transcript-text">{block.text}</p>
            </div>
          ))
        )}
      </div>

      {copied && (
        <div className="toast toast-amber">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied to clipboard
        </div>
      )}
    </div>
  );
}

export default TranscriptPanel;