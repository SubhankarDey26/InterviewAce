import { useState } from "react";
import axios from "axios";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await axios.post(`${API_URL}/api/contact`, formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setSubmitMessage("Thank you! Your message has been sent successfully.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: ""
        });
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      if (error.response?.data?.message) {
        setSubmitMessage(error.response.data.message);
      } else {
        setSubmitMessage("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative flex flex-col items-center px-6 lg:px-20 py-20 bg-black text-white">
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide mb-6">Contact Us</h2>
      <p className="text-base sm:text-lg text-gray-400 max-w-3xl mb-10 text-center">
        Have a question or feedback? Send us a message and our team will get back to you quickly.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-3xl grid gap-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Full Name"
          required
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email Address"
          required
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="Phone Number"
          required
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />
        <textarea
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          rows="5"
          placeholder="Your message"
          required
          className="w-full p-4 rounded-xl border border-gray-700 bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-[#e99b63]"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-full bg-[#a7a7a7] text-black font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>

        {submitMessage && (
          <p className={`text-center text-sm ${submitMessage.includes("Thank you") ? "text-green-400" : "text-red-400"}`}>
            {submitMessage}
          </p>
        )}
      </form>
    </section>
  );
};

export default ContactUs;
