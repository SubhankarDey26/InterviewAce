const Register = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-black border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        <form className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
          />
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-white"
          >
            Register
          </button>
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