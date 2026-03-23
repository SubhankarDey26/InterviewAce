// import Header from "./components/Header"
// import Hero from "./components/Hero"
// import Feature from "./components/Feature"
// import ContactUs from "./components/ContactUs"
// import Login from "./components/Login"
// import Register from "./components/Register"
// import Dashboard from "./components/Dashboard"
// import AOS from 'aos'
// import 'aos/dist/aos.css'
// import { useEffect, useState } from "react"
// import { Routes, Route, useNavigate } from "react-router-dom"

// const App = () => {
//   const [isLoginOpen, setIsLoginOpen] = useState(false)
//   const [isRegisterOpen, setIsRegisterOpen] = useState(false)
//   const navigate = useNavigate()

//   useEffect(() => {
//     AOS.init({
//       duration: 1500,
//       once: true,
//     })
//   }, [])

//   const handleLoginSuccess = () => {
//     setIsLoginOpen(false)
//     navigate("/dashboard")
//   }

//   const homePage = (
//     <main>
//       <img className="absolute top-0 right-0 opacity-60 -z-1" src="/gradient.png" alt="Gradient-img" />
//       <div className="h-0 w-[40rem] absolute top-[20%] right-[-5%] shadow-[0_0_900px_20px_#e99b63] -rotate-[30deg] -z-10"></div>
//       <Header onLoginClick={() => setIsLoginOpen(true)} onRegisterClick={() => setIsRegisterOpen(true)} />
//       <Hero />
//       <Feature />
//       <ContactUs />
//       <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={handleLoginSuccess} />
//       <Register isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
//     </main>
//   )

//   return (
//     <Routes>
//       <Route path="/" element={homePage} />
//       <Route path="/dashboard" element={<Dashboard />} />
//     </Routes>
//   )
// }

// export default App









import Header from "./components/Header"
import Hero from "./components/Hero"
import Feature from "./components/Feature"
import ContactUs from "./components/ContactUs"
import Login from "./components/Login"
import Register from "./components/Register"
import Dashboard from "./components/Dashboard"
import InterviewPage from "./components/Interviewpage"
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useEffect, useState } from "react"
import axios from "axios"

// ── Page constants ──────────────────────────────────────────────────────────
const PAGE = {
  LANDING:   "landing",
  DASHBOARD: "dashboard",
  INTERVIEW: "interview",
}

const App = () => {
  const [page, setPage]             = useState(PAGE.LANDING)
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [interviewConfig, setInterviewConfig] = useState(null)
  const [isLoginOpen, setIsLoginOpen]     = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 1500, once: true })

    // Check for persisted login state
    const storedUser = localStorage.getItem('user')
    const storedPage = localStorage.getItem('page')
    const storedConfig = localStorage.getItem('interviewConfig')
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser))
      setPage(storedPage === PAGE.INTERVIEW ? PAGE.INTERVIEW : PAGE.DASHBOARD)
      if (storedConfig) {
        setInterviewConfig(JSON.parse(storedConfig))
      }
    }
  })

  // ── Auth handlers ──
  const handleLoginSuccess = (user) => {
    setLoggedInUser(user)
    setIsLoginOpen(false)
    setPage(PAGE.DASHBOARD)
    // Persist login state
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('page', PAGE.DASHBOARD)
  }

  const handleRegisterSuccess = (user) => {
    setLoggedInUser(user)
    setIsRegisterOpen(false)
    setPage(PAGE.DASHBOARD)
    // Persist login state
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('page', PAGE.DASHBOARD)
  }

  const handleLogout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true })
    } catch (err) {
      console.error("Logout error:", err)
    }
    setLoggedInUser(null)
    setInterviewConfig(null)
    setPage(PAGE.LANDING)
    // Clear persisted state
    localStorage.removeItem('user')
    localStorage.removeItem('page')
    localStorage.removeItem('interviewConfig')
  }

  // ── Navigation ──
  const handleStartInterview = (config) => {
    setInterviewConfig(config)
    setPage(PAGE.INTERVIEW)
    // Persist page and config
    localStorage.setItem('page', PAGE.INTERVIEW)
    localStorage.setItem('interviewConfig', JSON.stringify(config))
  }

  const handleBackToDashboard = () => {
    setInterviewConfig(null)
    setPage(PAGE.DASHBOARD)
    // Persist page and clear config
    localStorage.setItem('page', PAGE.DASHBOARD)
    localStorage.removeItem('interviewConfig')
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (page === PAGE.INTERVIEW) {
    return (
      <InterviewPage
        user={loggedInUser}
        interviewConfig={interviewConfig}
        onLogout={handleLogout}
        onBack={handleBackToDashboard}
      />
    )
  }

  if (page === PAGE.DASHBOARD) {
    return (
      <Dashboard
        user={loggedInUser}
        onLogout={handleLogout}
        onStartInterview={handleStartInterview}
      />
    )
  }

  // Landing page
  return (
    <main>
      <img className="absolute top-0 right-0 opacity-60 -z-1" src="/gradient.png" alt="Gradient-img" />
      <div className="h-0 w-[40rem] absolute top-[20%] right-[-5%] shadow-[0_0_900px_20px_#e99b63] -rotate-[30deg] -z-10" />

      <Header
        onLoginClick={() => setIsLoginOpen(true)}
        onRegisterClick={() => setIsRegisterOpen(true)}
      />
      <Hero />
      <Feature />
      <ContactUs />

      <Login
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <Register
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </main>
  )
}

export default App



