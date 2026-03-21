

const Header = ({ onLoginClick, onRegisterClick }) => {
  return (
    <header className="flex justify-between items-center py-4 px-4 lg:px-20">

        <h1  className="text-3xl md:text-4xl lg:text-5xl font-light m-0">
            INTERVIEW-ACE
        </h1>
        <nav className="hidden md:flex items-ceter gap-12">
            <a href="#features" className="text-base tracking-wider transition-colors hover:text-gray-300 z-50 ">
                FEATURES
            </a>

            {/* <a href="#" className="text-base tracking-wider transition-colors hover:text-gray-300 z-50 ">
                TEAM
            </a> */}

            <a href="#contact" className="text-base tracking-wider transition-colors hover:text-gray-300 z-50 ">
                CONTACT US
            </a>

            <button onClick={onLoginClick} className="text-base tracking-wider transition-colors hover:text-gray-300 z-50 bg-transparent border-none cursor-pointer">
                LOGIN
            </button>
        </nav>

        <button onClick={onRegisterClick} className="hidden md:block bg-[#a7a7a7] text-black py-3 px-8 rounded-full border-none font-medium transition-all duration-500 hover:bg-white cursor-pointer z-50">
            REGISTER
        </button>



    </header>
  )
}

export default Header