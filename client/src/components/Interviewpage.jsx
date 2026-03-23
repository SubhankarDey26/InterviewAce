import { useState, useEffect, useRef } from "react"
import 'remixicon/fonts/remixicon.css'

// ─── VAPI INTEGRATION ─────────────────────────────────────────────────────────
// Install: npm install @vapi-ai/web
// Then uncomment the import below and add your keys to .env
// import Vapi from "@vapi-ai/web"
//
// const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY)
// ─────────────────────────────────────────────────────────────────────────────

const InterviewPage = ({ onLogout, onBack, user, interviewConfig }) => {
  // interviewConfig = { name, technicalSkills, questionType, jobDescription }

  const [callStatus, setCallStatus]   = useState("idle")   // idle | connecting | active | ended
  const [isMuted, setIsMuted]         = useState(false)
  const [transcript, setTranscript]   = useState([])        // [{ role, text }]
  const [feedback, setFeedback]       = useState(null)      // ML result object (from your team)
  const [aiSpeaking, setAiSpeaking]   = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const timerRef  = useRef(null)
  const vapiRef   = useRef(null)
  const scrollRef = useRef(null)

  // ── Auto-scroll transcript ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  // ── Timer ──
  useEffect(() => {
    if (callStatus === "active") {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      if (callStatus === "idle") setCallDuration(0)
    }
    return () => clearInterval(timerRef.current)
  }, [callStatus])

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // ── Build a system prompt from the interview config ──
  const buildSystemPrompt = () => {
    const cfg = interviewConfig || {}
    return `You are a professional ${cfg.questionType || "Technical"} interviewer at a top tech company.
Candidate name: ${cfg.name || "the candidate"}.
Their skills: ${cfg.technicalSkills || "general software development"}.
Job description: ${cfg.jobDescription || "a software engineering role"}.
Conduct a realistic interview. Ask one question at a time. Be professional but conversational.
After they answer, give brief acknowledgment then ask the next question.
After 5-7 questions, thank them and end the interview politely.`
  }

  // ── Start Call ──
  const startInterview = async () => {
    setCallStatus("connecting")
    setTranscript([])
    setFeedback(null)

    try {
      // ── REAL VAPI INTEGRATION (uncomment when keys are set) ──────────────
      // vapiRef.current = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY)
      //
      // vapiRef.current.on("call-start",   () => setCallStatus("active"))
      // vapiRef.current.on("call-end",     () => { setCallStatus("ended"); setAiSpeaking(false); setUserSpeaking(false) })
      // vapiRef.current.on("speech-start", () => setAiSpeaking(true))
      // vapiRef.current.on("speech-end",   () => setAiSpeaking(false))
      // vapiRef.current.on("message", (msg) => {
      //   if (msg.type === "transcript") {
      //     setTranscript(prev => [...prev, { role: msg.role, text: msg.transcript }])
      //   }
      // })
      // vapiRef.current.on("error", (e) => { console.error(e); setCallStatus("idle") })
      //
      // await vapiRef.current.start({
      //   transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
      //   model: {
      //     provider: "openai",
      //     model: "gpt-4o",
      //     systemPrompt: buildSystemPrompt(),
      //   },
      //   voice: { provider: "11labs", voiceId: "burt" },
      //   name: "Interview-Ace AI",
      // })
      // ─────────────────────────────────────────────────────────────────────

      // ── DEMO MODE (remove when VAPI keys are ready) ───────────────────────
      await new Promise(r => setTimeout(r, 1200))
      setCallStatus("active")
      const demoLines = [
        { role: "assistant", text: `Hello ${interviewConfig?.name || "there"}! I'm your AI interviewer today. We'll be doing a ${interviewConfig?.questionType || "technical"} interview. Are you ready to begin?` },
      ]
      for (let i = 0; i < demoLines.length; i++) {
        await new Promise(r => setTimeout(r, 600 * (i + 1)))
        setAiSpeaking(true)
        await new Promise(r => setTimeout(r, 1000))
        setAiSpeaking(false)
        setTranscript(prev => [...prev, demoLines[i]])
      }
      // ─────────────────────────────────────────────────────────────────────
    } catch (err) {
      console.error("VAPI start error:", err)
      setCallStatus("idle")
    }
  }

  // ── End Call ──
  const endInterview = async () => {
    // vapiRef.current?.stop()   // ← uncomment for real VAPI

    // Demo: simulate ending
    setCallStatus("ended")
    setAiSpeaking(false)
    setUserSpeaking(false)

    // Placeholder feedback — your ML team will replace this with real data
    setFeedback({
      overallScore: 78,
      relevance: 82,
      depth: 74,
      communication: 79,
      strengths: ["Clear problem-solving approach", "Good use of examples"],
      improvements: ["Could elaborate more on system design tradeoffs", "Pace answers slightly slower"],
      summary: "Strong candidate with good fundamentals. Demonstrates solid understanding of core concepts with room to deepen architectural thinking.",
    })
  }

  // ── Toggle Mute ──
  const toggleMute = () => {
    // vapiRef.current?.setMuted(!isMuted)   // ← uncomment for real VAPI
    setIsMuted(m => !m)
  }

  // ── Download transcript ──
  const downloadResult = () => {
    if (!feedback && transcript.length === 0) return
    const lines = transcript.map(t => `[${t.role.toUpperCase()}]: ${t.text}`).join("\n\n")
    const fb = feedback ? `\n\n--- FEEDBACK ---\nOverall Score: ${feedback.overallScore}/100\nSummary: ${feedback.summary}` : ""
    const blob = new Blob([lines + fb], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `interview-${interviewConfig?.name || "result"}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusLabel = {
    idle: "Ready",
    connecting: "Connecting…",
    active: "Live",
    ended: "Completed",
  }

  const statusColor = {
    idle: "text-gray-500",
    connecting: "text-yellow-400",
    active: "text-green-400",
    ended: "text-[#e99b63]",
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">

      {/* ambient glows */}
      <div className="fixed top-[15%] right-[-8%] w-[25rem] h-0 shadow-[0_0_600px_25px_#e99b6322] -rotate-[25deg] -z-10 pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-5%] w-[20rem] h-0 shadow-[0_0_400px_15px_#e99b6318] rotate-[15deg] -z-10 pointer-events-none" />

      {/* ── TOP NAV ── */}
      <header className="flex items-center gap-3 px-4 lg:px-8 py-3 border-b border-gray-800 shrink-0">
        {/* Tab 1 – Interview (active) */}
        <button className="px-5 py-2 rounded-lg border border-[#e99b63] text-[#e99b63] text-xs tracking-widest font-medium bg-[#e99b63]/8 cursor-pointer">
          1 · INTERVIEW
        </button>

        {/* Tab 2 – Resume (disabled) */}
        <button
          disabled
          className="px-5 py-2 rounded-lg border border-gray-800 text-gray-600 text-xs tracking-widest font-medium cursor-not-allowed"
        >
          2 · RESUME
        </button>

        {/* spacer */}
        <div className="flex-1" />

        {/* Status pill */}
        <div className={`hidden sm:flex items-center gap-2 text-xs tracking-widest ${statusColor[callStatus]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${callStatus === "active" ? "bg-green-400 animate-pulse" : callStatus === "connecting" ? "bg-yellow-400 animate-pulse" : callStatus === "ended" ? "bg-[#e99b63]" : "bg-gray-600"}`} />
          {statusLabel[callStatus]}
          {callStatus === "active" && (
            <span className="ml-1 font-mono text-green-400">{formatTime(callDuration)}</span>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-700 text-xs tracking-widest text-gray-400 transition-all duration-200 hover:border-white hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <i className="ri-logout-box-r-line" />
          LOGOUT
        </button>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* ════════════════ LEFT PANEL – RESULT ════════════════ */}
        <aside className="w-full lg:w-[38%] border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col p-5 gap-4 overflow-hidden">

          {/* Panel label */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <i className="ri-bar-chart-grouped-line text-[#e99b63] text-lg" />
              <span className="text-xs tracking-[0.2em] text-[#e99b63] uppercase font-medium">
                Result
              </span>
            </div>
            {feedback && (
              <span className="text-xs tracking-widest text-gray-500">
                Score: <span className="text-white font-semibold">{feedback.overallScore}/100</span>
              </span>
            )}
          </div>

          {/* Score bars — shown after interview ends */}
          {feedback ? (
            <div className="flex-1 overflow-y-auto space-y-5 pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>

              {/* Score bars */}
              <div className="space-y-3">
                {[
                  { label: "Relevance",     value: feedback.relevance },
                  { label: "Depth",         value: feedback.depth },
                  { label: "Communication", value: feedback.communication },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs tracking-wider text-gray-400 mb-1.5">
                      <span>{label}</span>
                      <span className="text-white">{value}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#e99b63] to-[#c47a40] rounded-full"
                        style={{ width: `${value}%`, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall ring */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-white/[0.02]">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#1f1f1f" strokeWidth="6" />
                    <circle
                      cx="32" cy="32" r="26"
                      fill="none" stroke="#e99b63" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - feedback.overallScore / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                    {feedback.overallScore}
                  </span>
                </div>
                <div>
                  <p className="text-xs tracking-widest text-gray-500 uppercase mb-1">Overall</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{feedback.summary}</p>
                </div>
              </div>

              {/* Strengths */}
              <div className="space-y-2">
                <p className="text-xs tracking-widest text-gray-600 uppercase">Strengths</p>
                {feedback.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <i className="ri-check-line text-green-400 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div className="space-y-2">
                <p className="text-xs tracking-widest text-gray-600 uppercase">Improve</p>
                {feedback.improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <i className="ri-arrow-up-circle-line text-[#e99b63] mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-gray-800 rounded-2xl p-6">
              <div className="w-14 h-14 rounded-full border border-gray-800 flex items-center justify-center">
                <i className="ri-bar-chart-2-line text-2xl text-gray-700" />
              </div>
              <p className="text-xs tracking-widest text-gray-700 uppercase max-w-[16rem]">
                {callStatus === "active"
                  ? "Interview in progress…"
                  : "Results will appear here after your interview"}
              </p>
              {callStatus === "active" && (
                <div className="flex gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-[#e99b63] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#e99b63] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#e99b63] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          )}

          {/* Download */}
          <button
            onClick={downloadResult}
            disabled={!feedback && transcript.length === 0}
            className="shrink-0 flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-gray-700 text-sm tracking-widest text-gray-400 transition-all duration-200 hover:border-[#e99b63] hover:text-[#e99b63] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-download-2-line" />
            Download
          </button>
        </aside>

        {/* ════════════════ RIGHT PANEL – VAPI AI ════════════════ */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 gap-8">

          {/* ── AI Visualiser ── */}
          <div className="relative w-full max-w-lg">
            <div className={`relative rounded-2xl border overflow-hidden transition-all duration-500
              ${callStatus === "active"
                ? aiSpeaking
                  ? "border-[#e99b63] shadow-[0_0_40px_rgba(233,155,99,0.2)]"
                  : "border-gray-700 shadow-[0_0_20px_rgba(233,155,99,0.08)]"
                : "border-gray-800"
              }
              bg-gradient-to-b from-[#0d0d0d] to-black`}
            >
              {/* inner glow bar */}
              {callStatus === "active" && aiSpeaking && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e99b63] to-transparent" />
              )}

              <div className="p-8 min-h-[18rem] flex flex-col items-center justify-center gap-6">

                {/* Avatar orb */}
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                    ${callStatus === "active"
                      ? "bg-[#e99b63]/15 border-2 border-[#e99b63]/60"
                      : "bg-gray-900 border-2 border-gray-800"
                    }`}>
                    <i className={`ri-customer-service-2-line text-4xl transition-colors duration-300
                      ${callStatus === "active" ? "text-[#e99b63]" : "text-gray-600"}`} />
                  </div>

                  {/* Pulse rings when AI speaks */}
                  {callStatus === "active" && aiSpeaking && (
                    <>
                      <span className="absolute inset-0 rounded-full border border-[#e99b63]/40 animate-ping" />
                      <span className="absolute -inset-3 rounded-full border border-[#e99b63]/20 animate-ping" style={{ animationDelay: "200ms" }} />
                    </>
                  )}
                </div>

                {/* Status / waveform */}
                {callStatus === "idle" && (
                  <div className="text-center">
                    <p className="text-lg font-light tracking-widest text-gray-300 mb-1">VAPI AI</p>
                    <p className="text-xs tracking-[0.2em] text-gray-600">
                      {interviewConfig?.questionType?.toUpperCase() || "INTERVIEW"} · VOICE ASSISTANT
                    </p>
                  </div>
                )}

                {callStatus === "connecting" && (
                  <div className="text-center space-y-2">
                    <p className="text-sm tracking-widest text-yellow-400">Connecting…</p>
                    <div className="flex gap-1.5 justify-center">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="w-1 bg-yellow-400/60 rounded-full animate-pulse"
                          style={{ height: `${12 + Math.random() * 16}px`, animationDelay: `${i * 120}ms` }} />
                      ))}
                    </div>
                  </div>
                )}

                {callStatus === "active" && (
                  <div className="text-center space-y-3 w-full">
                    {/* Waveform bars */}
                    <div className="flex items-end justify-center gap-1 h-10">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-full transition-all duration-150 ${aiSpeaking ? "bg-[#e99b63]" : userSpeaking ? "bg-white" : "bg-gray-700"}`}
                          style={{
                            height: aiSpeaking || userSpeaking
                              ? `${8 + Math.abs(Math.sin(Date.now() / (100 + i * 50) + i)) * 28}px`
                              : "4px",
                            animation: (aiSpeaking || userSpeaking) ? `wave ${0.4 + i * 0.05}s ease-in-out infinite alternate` : "none",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs tracking-widest text-gray-500">
                      {aiSpeaking ? "AI is speaking…" : userSpeaking ? "Listening…" : "Your turn to respond"}
                    </p>
                  </div>
                )}

                {callStatus === "ended" && (
                  <div className="text-center space-y-2">
                    <i className="ri-checkbox-circle-line text-4xl text-[#e99b63]" />
                    <p className="text-sm tracking-widest text-[#e99b63]">Interview Complete</p>
                    <p className="text-xs tracking-wider text-gray-600">Review your results on the left</p>
                  </div>
                )}
              </div>

              {/* Live transcript ticker */}
              {callStatus === "active" && transcript.length > 0 && (
                <div className="border-t border-gray-800 p-4">
                  <p className="text-xs text-gray-500 tracking-wider line-clamp-2">
                    <span className={transcript[transcript.length - 1]?.role === "assistant" ? "text-[#e99b63]" : "text-white"}>
                      {transcript[transcript.length - 1]?.role === "assistant" ? "AI: " : "You: "}
                    </span>
                    {transcript[transcript.length - 1]?.text}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="flex flex-col items-center gap-4 w-full max-w-lg">

            {/* Main CTA */}
            {callStatus === "idle" && (
              <button
                onClick={startInterview}
                className="w-full py-4 px-8 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-widest text-sm transition-all duration-300 hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer flex items-center justify-center gap-3"
              >
                <i className="ri-mic-line text-lg" />
                START INTERVIEW
              </button>
            )}

            {callStatus === "connecting" && (
              <button disabled className="w-full py-4 px-8 rounded-full bg-gray-800 text-gray-500 font-semibold uppercase tracking-widest text-sm cursor-not-allowed flex items-center justify-center gap-3">
                <span className="w-3 h-3 rounded-full border-2 border-gray-500 border-t-white animate-spin" />
                CONNECTING
              </button>
            )}

            {callStatus === "active" && (
              <div className="flex gap-3 w-full">
                {/* Mute toggle */}
                <button
                  onClick={toggleMute}
                  className={`flex items-center justify-center gap-2 py-4 px-5 rounded-full border text-sm tracking-widest font-medium transition-all duration-200 cursor-pointer
                    ${isMuted
                      ? "border-red-500/60 text-red-400 bg-red-500/10"
                      : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                    }`}
                >
                  <i className={isMuted ? "ri-mic-off-line" : "ri-mic-line"} />
                  <span className="hidden sm:inline">{isMuted ? "UNMUTE" : "MUTE"}</span>
                </button>

                {/* End interview */}
                <button
                  onClick={endInterview}
                  className="flex-1 py-4 px-6 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 font-semibold uppercase tracking-widest text-sm transition-all duration-200 hover:bg-red-500/25 hover:border-red-400 cursor-pointer flex items-center justify-center gap-3"
                >
                  <i className="ri-stop-circle-line text-lg" />
                  END INTERVIEW
                </button>
              </div>
            )}

            {callStatus === "ended" && (
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setCallStatus("idle"); setTranscript([]); setFeedback(null) }}
                  className="flex-1 py-4 px-6 rounded-full border border-gray-700 text-gray-400 font-semibold uppercase tracking-widest text-sm transition-all duration-200 hover:border-white hover:text-white cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-restart-line" />
                  RETRY
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 py-4 px-6 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-widest text-sm transition-all duration-300 hover:bg-white cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-arrow-left-line" />
                  DASHBOARD
                </button>
              </div>
            )}

            {/* Interview info strip */}
            {interviewConfig && callStatus !== "ended" && (
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { icon: "ri-user-3-line",       label: interviewConfig.name },
                  { icon: "ri-code-s-slash-line",  label: interviewConfig.questionType },
                  { icon: "ri-tools-line",         label: interviewConfig.technicalSkills?.split(",")[0]?.trim() },
                ].filter(x => x.label).map(({ icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-800 text-xs tracking-wider text-gray-500">
                    <i className={icon} />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Transcript drawer (hidden scrollable full log) */}
      {transcript.length > 2 && callStatus !== "idle" && (
        <div
          ref={scrollRef}
          className="hidden lg:block fixed bottom-0 right-0 w-[60%] max-h-24 overflow-y-auto bg-black/80 backdrop-blur border-t border-gray-800 px-6 py-3 space-y-1"
          style={{ scrollbarWidth: "none" }}
        >
          {transcript.slice(-6).map((t, i) => (
            <p key={i} className="text-xs text-gray-600 truncate">
              <span className={t.role === "assistant" ? "text-[#e99b63]/70" : "text-white/60"}>
                {t.role === "assistant" ? "AI: " : "You: "}
              </span>
              {t.text}
            </p>
          ))}
        </div>
      )}

      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  )
}

export default InterviewPage