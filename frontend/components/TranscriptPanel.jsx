function TranscriptPanel({ transcript }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 mt-6">
      <h2 className="text-xl font-semibold mb-3 text-black">
        Transcript
      </h2>

      <p className="mt-4 text-black">
        {transcript || "Your transcript will appear here..."}
      </p>
    </div>
  )
}

export default TranscriptPanel