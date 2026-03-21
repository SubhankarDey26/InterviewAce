import Header from "./components/Header"
import Hero from "./components/Hero"
import Feature from "./components/Feature"
import ContactUs from "./components/ContactUs"
import Login from "./components/Login"
import Register from "./components/Register"
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect, useState } from "react";

const App = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  useEffect(()=>{
    AOS.init({
      duration:1500,
      once:true
    });
  })

  return (
    <main>
      <img className="absolute top-0 right-0 opacity-60 -z-1" src="/gradient.png" alt="Gradient-img" />

      <div className="h-0 w-[40rem] absolute top-[20%] right-[-5%] shadow-[0_0_900px_20px_#e99b63] -rotate-[30deg] -z-10"></div>

      <Header onLoginClick={() => setIsLoginOpen(true)} onRegisterClick={() => setIsRegisterOpen(true)} />
      <Hero/>
      <Feature/>
      <ContactUs/>
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <Register isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </main>
  )
}

export default App