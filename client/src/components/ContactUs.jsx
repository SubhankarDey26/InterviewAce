const ContactUs = () => {
  return (
    <section id="contact" className="relative flex flex-col items-center px-6 lg:px-20 py-20 bg-black text-white">
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide mb-6">Contact Us</h2>
      <p className="text-base sm:text-lg text-gray-400 max-w-3xl mb-10 text-center">
        Have a question or feedback? Send us a message and our team will get back to you quickly.
      </p>

      <form className="w-full max-w-3xl grid gap-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />
        <textarea
          name="message"
          rows="5"
          placeholder="Your message"
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />

        <button
          type="submit"
          className="w-full py-4 px-6 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-white"
        >
          Send Message
        </button>
      </form>
    </section>
  )
}

export default ContactUs
