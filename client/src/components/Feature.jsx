const Feature = () => {
  return (
    <section id="features" className="relative flex flex-col items-center text-center px-6 lg:px-20 py-20 bg-gradient-to-b from-black via-[#0a0a0a] to-[#111111]">
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide mb-6">
        AI-Driven Features
      </h2>
      <p className="text-base sm:text-lg text-gray-300 max-w-3xl mb-12">
        Interview-Ace brings you a complete suite of tools built for smarter, faster preparation. Highlights include adaptive question generation, real-time voice cues, detailed scoring, and instant review with improvements suggestions.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
        <article className="p-6 border border-gray-700 rounded-2xl bg-black/40 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-2">Intelligent Question Bank</h3>
          <p className="text-gray-300 text-sm">Context-aware questions update as you improve, making every session feel fresh and challenging.</p>
        </article>
        <article className="p-6 border border-gray-700 rounded-2xl bg-black/40 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-2">Voice AI Coaching</h3>
          <p className="text-gray-300 text-sm">Practice without typing—just speak and get instant feedback on tone, pacing, and content.</p>
        </article>
        <article className="p-6 border border-gray-700 rounded-2xl bg-black/40 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-2">Score & Analytics</h3>
          <p className="text-gray-300 text-sm">See performance trends on relevance, depth, and communication quality across sessions.</p>
        </article>
      </div>
    </section>
  )
}

export default Feature
