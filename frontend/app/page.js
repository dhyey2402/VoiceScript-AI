"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import RecorderPanel from "@/components/RecorderPanel";
import TranscriptPanel from "@/components/TranscriptPanel";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {

  const token =
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

  if (!token) {

    router.push("/login");

  } else {

    setCheckingAuth(false);

  }

}, []);

if (checkingAuth) {

  return (

    <div className="min-h-screen bg-black flex items-center justify-center text-white">

      Checking authentication...

    </div>
  );
}

  return (
    <>
      {/* Glowing background */}
      <div className="glow-bg">
        <div className="glow-1" />
        <div className="glow-2" />
      </div>
      <div className="grid-bg" />

      <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <Header />

        <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 24px 80px" }}>
          <RecorderPanel setTranscript={setTranscript} />

          <div style={{ height: 16 }} />

          <TranscriptPanel transcript={transcript} />

          {/* Footer */}
          <p style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-3)",
            marginTop: 48,
          }}>
            VoiceScript AI · Deepgram Neural Engine
          </p>
        </div>
      </main>
    </>
  );
}