// import { useState } from "react"
// import 'remixicon/fonts/remixicon.css'

// const Dashboard = ({ onLogout, user }) => {
//   const [selectedPlatform, setSelectedPlatform] = useState(null)
//   const [formData, setFormData] = useState({
//     name: "",
//     technicalSkills: "",
//     questionType: "",
//     jobDescription: "",
//   })
//   const [formError, setFormError] = useState("")

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value })
//     setFormError("")
//   }

//   const handleStartInterview = (e) => {
//     e.preventDefault()
//     const { name, technicalSkills, questionType, jobDescription } = formData
//     if (!name || !technicalSkills || !questionType || !jobDescription) {
//       setFormError("Please fill in all fields before starting.")
//       return
//     }
//     // TODO: Navigate to interview session page
//     alert(`Starting ${questionType} interview for ${name}!`)
//   }

//   return (
//     <div className="min-h-screen bg-black text-white overflow-x-hidden">

//       {/* Ambient glow */}
//       <div className="fixed top-[10%] right-[-5%] w-[30rem] h-0 shadow-[0_0_700px_30px_#e99b6333] -rotate-[30deg] -z-10 pointer-events-none" />
//       <div className="fixed bottom-[10%] left-[-5%] w-[20rem] h-0 shadow-[0_0_500px_20px_#e99b6322] rotate-[20deg] -z-10 pointer-events-none" />

//       {/* ── Header ── */}
//       <header className="flex justify-between items-center py-4 px-6 lg:px-20 border-b border-gray-800">
//         <h1 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-widest">
//           INTERVIEW-ACE
//         </h1>

//         <div className="flex items-center gap-4">
//           {/* <span className="hidden sm:block text-sm text-gray-400 tracking-wider">
//             {user?.username ? `Hey, ${user.username}` : "Dashboard"}
//           </span> */}
//           <button
//             onClick={onLogout}
//             className="flex items-center gap-2 py-2 px-5 rounded-full border border-gray-700 text-sm tracking-wider text-gray-300 transition-all duration-300 hover:border-white hover:text-white hover:bg-white/5 cursor-pointer"
//           >
//             <i className="ri-logout-box-r-line text-base" />
//             LOGOUT
//           </button>
//         </div>
//       </header>

//       {/* ── Hero greeting ── */}
//       <section className="px-6 lg:px-20 pt-12 pb-8 text-center flex flex-col items-center">
//         <p className="text-3xl tracking-[0.25em] text-[#e99b63] uppercase mb-2">
//           Welcome back
//         </p>
//         <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-wide">
//           Choose Your Platform
//         </h2>
//         <p className="mt-3 text-gray-400 text-base max-w-xl">
//           Select a tool below to begin. Your AI-powered career suite is ready.
//         </p>
//       </section>

//       {/* ── Platform Cards ── */}
//       <section className="px-6 lg:px-20 pb-10">
//         <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

//           {/* Card 1 – AI Interview Platform */}
//           <button
//             onClick={() => setSelectedPlatform("interview")}
//             className={`group text-left p-7 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden
//               ${selectedPlatform === "interview"
//                 ? "border-[#e99b63] bg-[#e99b63]/8 shadow-[0_0_30px_rgba(233,155,99,0.15)]"
//                 : "border-gray-700 bg-black/40 hover:border-gray-500 hover:bg-white/[0.03]"
//               }`}
//           >
//             {/* subtle inner glow when active */}
//             {selectedPlatform === "interview" && (
//               <div className="absolute inset-0 bg-gradient-to-br from-[#e99b63]/10 to-transparent pointer-events-none" />
//             )}

//             <div className="flex items-start justify-between mb-5">
//               <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors duration-300
//                 ${selectedPlatform === "interview" ? "bg-[#e99b63] text-black" : "bg-gray-800 text-[#e99b63] group-hover:bg-gray-700"}`}>
//                 <i className="ri-mic-2-line" />
//               </div>
//               <span className={`text-xs tracking-widest px-3 py-1 rounded-full border transition-colors duration-300
//                 ${selectedPlatform === "interview"
//                   ? "border-[#e99b63] text-[#e99b63]"
//                   : "border-gray-700 text-gray-500"}`}>
//                 01
//               </span>
//             </div>

//             <h3 className="text-xl font-semibold tracking-wide mb-2">
//               AI Interview Platform
//             </h3>
//             <p className="text-gray-400 text-sm leading-relaxed">
//               Voice-powered mock interviews with real-time AI scoring on relevance, depth, and communication.
//             </p>

//             <div className={`mt-5 flex items-center gap-2 text-sm font-medium tracking-wider transition-colors duration-300
//               ${selectedPlatform === "interview" ? "text-[#e99b63]" : "text-gray-600 group-hover:text-gray-400"}`}>
//               <span>GET STARTED</span>
//               <i className="ri-arrow-right-line text-base" />
//             </div>
//           </button>

//           {/* Card 2 – AI Resume Platform (coming soon) */}
//           <div className="relative p-7 rounded-2xl border border-gray-800 bg-black/20 opacity-60 cursor-not-allowed select-none">
//             <div className="absolute top-4 right-4 text-xs tracking-widest px-3 py-1 rounded-full border border-gray-700 text-gray-500">
//               SOON
//             </div>

//             <div className="flex items-start justify-between mb-5">
//               <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-800 text-gray-600">
//                 <i className="ri-file-text-line" />
//               </div>
//               <span className="text-xs tracking-widest px-3 py-1 rounded-full border border-gray-800 text-gray-600">
//                 02
//               </span>
//             </div>

//             <h3 className="text-xl font-semibold tracking-wide mb-2 text-gray-500">
//               AI Resume Platform
//             </h3>
//             <p className="text-gray-600 text-sm leading-relaxed">
//               Intelligent resume builder that tailors your CV to specific job descriptions using ML insights.
//             </p>

//             <div className="mt-5 flex items-center gap-2 text-sm font-medium tracking-wider text-gray-700">
//               <span>COMING SOON</span>
//               <i className="ri-time-line text-base" />
//             </div>
//           </div>

//         </div>
//       </section>

//       {/* ── Interview Setup Form ── */}
//       {selectedPlatform === "interview" && (
//         <section
//           className="px-6 lg:px-20 pb-20"
//           style={{ animation: "fadeSlideIn 0.4s ease forwards" }}
//         >
//           <div className="max-w-2xl mx-auto">

//             {/* Section header */}
//             <div className="flex items-center gap-3 mb-8">
//               <div className="h-px flex-1 bg-gray-800" />
//               <span className="text-xs tracking-[0.25em] text-[#e99b63] uppercase whitespace-nowrap">
//                 Interview Setup
//               </span>
//               <div className="h-px flex-1 bg-gray-800" />
//             </div>

//             <form onSubmit={handleStartInterview} className="space-y-5">

//               {/* Name */}
//               <div className="space-y-1.5">
//                 <label className="block text-xs tracking-widest text-gray-500 uppercase">
//                   Your Name
//                 </label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="e.g. Aryan Sharma"
//                   className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200"
//                 />
//               </div>

//               {/* Technical Skills */}
//               <div className="space-y-1.5">
//                 <label className="block text-xs tracking-widest text-gray-500 uppercase">
//                   Technical Skills
//                 </label>
//                 <input
//                   type="text"
//                   name="technicalSkills"
//                   value={formData.technicalSkills}
//                   onChange={handleChange}
//                   placeholder="e.g. React, Node.js, Python, MongoDB"
//                   className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200"
//                 />
//               </div>

//               {/* Question Type */}
//               <div className="space-y-1.5">
//                 <label className="block text-xs tracking-widest text-gray-500 uppercase">
//                   Question Type
//                 </label>
//                 <div className="relative">
//                   <select
//                     name="questionType"
//                     value={formData.questionType}
//                     onChange={handleChange}
//                     className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200 cursor-pointer"
//                   >
//                     <option value="" disabled className="text-gray-600">
//                       Select interview type
//                     </option>
//                     <option value="Technical" className="bg-[#111]">Technical</option>
//                     <option value="Behavioral" className="bg-[#111]">Behavioral</option>
//                     <option value="HR" className="bg-[#111]">HR</option>
//                   </select>
//                   <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg" />
//                 </div>
//               </div>

//               {/* Job Description */}
//               <div className="space-y-1.5">
//                 <label className="block text-xs tracking-widest text-gray-500 uppercase">
//                   Job Description
//                 </label>
//                 <textarea
//                   name="jobDescription"
//                   value={formData.jobDescription}
//                   onChange={handleChange}
//                   rows={5}
//                   placeholder="Paste the job description here. The AI will tailor questions to match the role requirements..."
//                   className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200 resize-none leading-relaxed"
//                 />
//               </div>

//               {/* Error message */}
//               {formError && (
//                 <p className="text-sm text-red-400 tracking-wide flex items-center gap-2">
//                   <i className="ri-error-warning-line" />
//                   {formError}
//                 </p>
//               )}

//               {/* Submit */}
//               <button
//                 type="submit"
//                 className="w-full py-4 px-6 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-widest transition-all duration-300 hover:bg-white hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] cursor-pointer"
//               >
//                 <span className="flex items-center justify-center gap-3">
//                   <i className="ri-mic-line text-lg" />
//                   Start Interview
//                 </span>
//               </button>

//             </form>
//           </div>
//         </section>
//       )}

//       {/* keyframe injection */}
//       <style>{`
//         @keyframes fadeSlideIn {
//           from { opacity: 0; transform: translateY(20px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//       `}</style>
//     </div>
//   )
// }

// export default Dashboard
















import { useState } from "react"
import 'remixicon/fonts/remixicon.css'

const Dashboard = ({ onLogout, user, onStartInterview }) => {
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    technicalSkills: "",
    questionType: "",
    jobDescription: "",
  })
  const [formError, setFormError] = useState("")

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setFormError("")
  }

  const handleStartInterview = (e) => {
    e.preventDefault()
    const { name, technicalSkills, questionType, jobDescription } = formData
    if (!name || !technicalSkills || !questionType || !jobDescription) {
      setFormError("Please fill in all fields before starting.")
      return
    }
    onStartInterview(formData)
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Ambient glow */}
      <div className="fixed top-[10%] right-[-5%] w-[30rem] h-0 shadow-[0_0_700px_30px_#e99b6333] -rotate-[30deg] -z-10 pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-5%] w-[20rem] h-0 shadow-[0_0_500px_20px_#e99b6322] rotate-[20deg] -z-10 pointer-events-none" />

      {/* ── Header ── */}
      <header className="flex justify-between items-center py-4 px-6 lg:px-20 border-b border-gray-800">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-widest">
          INTERVIEW-ACE
        </h1>
        <div className="flex items-center gap-4">
          {/* <span className="hidden sm:block text-sm text-gray-400 tracking-wider">
            {user?.username ? `Hey, ${user.username}` : "Dashboard"}
          </span> */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 py-2 px-5 rounded-full border border-gray-700 text-sm tracking-wider text-gray-300 transition-all duration-300 hover:border-white hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <i className="ri-logout-box-r-line text-base" />
            LOGOUT
          </button>
        </div>
      </header>

      {/* ── Hero greeting ── */}
      <section className="px-6 lg:px-20 pt-12 pb-8 text-center flex flex-col items-center">
        <p className="text-3xl tracking-[0.25em] text-[#e99b63] uppercase mb-2">Welcome back</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-wide">Choose Your Platform</h2>
        <p className="mt-3 text-gray-400 text-base max-w-xl">
          Select a tool below to begin. Your AI-powered career suite is ready.
        </p>
      </section>

      {/* ── Platform Cards ── */}
      <section className="px-6 lg:px-20 pb-10">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Card 1 – AI Interview Platform */}
          <button
            onClick={() => setSelectedPlatform("interview")}
            className={`group text-left p-7 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden
              ${selectedPlatform === "interview"
                ? "border-[#e99b63] bg-[#e99b63]/8 shadow-[0_0_30px_rgba(233,155,99,0.15)]"
                : "border-gray-700 bg-black/40 hover:border-gray-500 hover:bg-white/[0.03]"
              }`}
          >
            {selectedPlatform === "interview" && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#e99b63]/10 to-transparent pointer-events-none" />
            )}
            <div className="flex items-start justify-between mb-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors duration-300
                ${selectedPlatform === "interview" ? "bg-[#e99b63] text-black" : "bg-gray-800 text-[#e99b63] group-hover:bg-gray-700"}`}>
                <i className="ri-mic-2-line" />
              </div>
              <span className={`text-xs tracking-widest px-3 py-1 rounded-full border transition-colors duration-300
                ${selectedPlatform === "interview" ? "border-[#e99b63] text-[#e99b63]" : "border-gray-700 text-gray-500"}`}>
                01
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-wide mb-2">AI Interview Platform</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Voice-powered mock interviews with real-time AI scoring on relevance, depth, and communication.
            </p>
            <div className={`mt-5 flex items-center gap-2 text-sm font-medium tracking-wider transition-colors duration-300
              ${selectedPlatform === "interview" ? "text-[#e99b63]" : "text-gray-600 group-hover:text-gray-400"}`}>
              <span>GET STARTED</span>
              <i className="ri-arrow-right-line text-base" />
            </div>
          </button>

          {/* Card 2 – AI Resume Platform (coming soon) */}
          <div className="relative p-7 rounded-2xl border border-gray-800 bg-black/20 opacity-60 cursor-not-allowed select-none">
            <div className="absolute top-4 right-4 text-xs tracking-widest px-3 py-1 rounded-full border border-gray-700 text-gray-500">
              SOON
            </div>
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-800 text-gray-600">
                <i className="ri-file-text-line" />
              </div>
              <span className="text-xs tracking-widest px-3 py-1 rounded-full border border-gray-800 text-gray-600">02</span>
            </div>
            <h3 className="text-xl font-semibold tracking-wide mb-2 text-gray-500">AI Resume Platform</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Intelligent resume builder that tailors your CV to specific job descriptions using ML insights.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium tracking-wider text-gray-700">
              <span>COMING SOON</span>
              <i className="ri-time-line text-base" />
            </div>
          </div>

        </div>
      </section>

      {/* ── Interview Setup Form ── */}
      {selectedPlatform === "interview" && (
        <section className="px-6 lg:px-20 pb-20" style={{ animation: "fadeSlideIn 0.4s ease forwards" }}>
          <div className="max-w-2xl mx-auto">

            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gray-800" />
              <span className="text-xs tracking-[0.25em] text-[#e99b63] uppercase whitespace-nowrap">Interview Setup</span>
              <div className="h-px flex-1 bg-gray-800" />
            </div>

            <form onSubmit={handleStartInterview} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs tracking-widest text-gray-500 uppercase">Your Name</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g. Aryan Sharma"
                  className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs tracking-widest text-gray-500 uppercase">Technical Skills</label>
                <input
                  type="text" name="technicalSkills" value={formData.technicalSkills} onChange={handleChange}
                  placeholder="e.g. React, Node.js, Python, MongoDB"
                  className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs tracking-widest text-gray-500 uppercase">Question Type</label>
                <div className="relative">
                  <select
                    name="questionType" value={formData.questionType} onChange={handleChange}
                    className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200 cursor-pointer"
                  >
                    <option value="" disabled className="text-gray-600">Select interview type</option>
                    <option value="Technical"  className="bg-[#111]">Technical</option>
                    <option value="Behavioral" className="bg-[#111]">Behavioral</option>
                    <option value="HR"         className="bg-[#111]">HR</option>
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs tracking-widest text-gray-500 uppercase">Job Description</label>
                <textarea
                  name="jobDescription" value={formData.jobDescription} onChange={handleChange}
                  rows={5}
                  placeholder="Paste the job description here. The AI will tailor questions to match the role requirements..."
                  className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#e99b63] focus:border-transparent transition-all duration-200 resize-none leading-relaxed"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-400 tracking-wide flex items-center gap-2">
                  <i className="ri-error-warning-line" />{formError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-widest transition-all duration-300 hover:bg-white hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] cursor-pointer"
              >
                <span className="flex items-center justify-center gap-3">
                  <i className="ri-mic-line text-lg" />
                  Start Interview
                </span>
              </button>
            </form>
          </div>
        </section>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Dashboard