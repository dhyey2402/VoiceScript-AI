"use client"

import { useState } from "react"

import Header from "@/components/Header"
import RecorderPanel from "@/components/RecorderPanel"
import TranscriptPanel from "@/components/TranscriptPanel"

export default function Home() {

  const [transcript, setTranscript] = useState("")

  return (
    <main className="min-h-screen bg-gray-100">

      <Header />

      <div className="max-w-3xl mx-auto p-6">

        <RecorderPanel
          setTranscript={setTranscript}
        />

        <TranscriptPanel
          transcript={transcript}
        />

      </div>

    </main>
  )
}