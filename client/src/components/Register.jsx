import { useState } from "react"
import axios from "axios"

const Register = ({ isOpen, onClose, onRegisterSuccess }) => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  if (!isOpen) return null

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { username, email, password },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      )

      if (response.status === 201) {
        setSuccess("Registered successfully. You can now login.")
        setUsername("")
        setEmail("")
        setPassword("")
        if (onRegisterSuccess) {
          onRegisterSuccess(response.data.user)
        }
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Registration failed. Please try again.")
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-black border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
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
            Register
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}
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

export default Register