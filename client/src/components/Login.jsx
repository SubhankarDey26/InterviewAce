import { useState } from "react"
import axios from "axios"

const Login = ({ isOpen, onClose, onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  if (!isOpen) return null

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const payload = {
        password,
        ...(usernameOrEmail.includes("@")
          ? { email: usernameOrEmail }
          : { username: usernameOrEmail }),
      }

      const response = await axios.post(`${API_URL}/api/auth/login`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })

      if (response.status === 200) {
        setUsernameOrEmail("")
        setPassword("")
        onClose()
        onLoginSuccess(response.data.user)
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Login failed. Please try again.")
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-black border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Username or Email"
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
          />
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-white"
          >
            Login
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default Login