import 'remixicon/fonts/remixicon.css'
import Spline from '@splinetool/react-spline'
const Hero = () => {
  return (
    <main className="flex lg:mt-20 flex-col lg:flex-row items-center justify-between min-h-[calc(90vh-6rem)]">
        <div className="max-w-xl ml-[5%] z-10 mt-[90%] md:mt-[60%] lg:mt-0  ">
            <div className='relative w-[95%] sm:w-48 h-10 bg-gradient-to-r from-[#656565] to-[#e99b63] shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-full '>
                <div className='absolute inset-[3px] bg-blaack rounded-full flex items-center justify-center gap-1'>
                  <i class="ri-vip-diamond-line"></i>
                  INTRODUCING 
                </div>
            </div>
            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-wider my-8 '>
                VOICE-POWERED
                <br />
                MOCK INTERVIEWS
            </h1>
            <p className='text-base sm:text-lg tracking-wider text-gray-400 max-w-[25rem] lg:max-w-[30rem]  '>
               Practice realistic mock interviews
                powered by advanced AI. Get instant 
                ML-powered scoring on relevance, 
                depth, and communication. 
            </p>

        </div>

        {/* 3D ROBOT */}
         {/* <Spline scene="https://prod.spline.design/azwkNqMDql0dA1Ie/scene.splinecode" /> */}
         <Spline  className='absolute lg:top-0 top-[-20%] bottom-0 lg:left-[25%] sm:left-[-2%] h-full' 
         scene="https://prod.spline.design/azwkNqMDql0dA1Ie/scene.splinecode" />

               
    </main>
  )
}

export default Hero