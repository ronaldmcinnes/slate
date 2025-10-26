import { Button } from "@/components/ui/button";
import HeroTopo from "@/components/hero/HeroTopo";
import slateHandwrittenLogo from "@/assets/slatehandwritten.svg";
import { AnimatedSlateLogo } from "./hero/animateSlateLogo";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0 flex flex-col">
        <div className="flex-1 bg-black"></div>
        <HeroTopo />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex justify-center min-h-screen pointer-events-none">
        <div className="justify-center text-center px-4 max-w-4xl pt-[5%]">
          <div className="flex justify-center text-6xl md:text-[10rem] font-bold text-white mb-none leading-tight drop-shadow-2xl">
         <AnimatedSlateLogo
            className="w-[200%] -ml-[50%]"
            autoPlay={true}
            duration={3000}
            />
          </div>
          <p className="-mt-[5%] text-xl md:text-2xl text-white/90 mb-24 max-w-2xl mx-auto drop-shadow-lg">
            Draw, graph, and write – all in one beautiful workspace.
          </p>
          <div className="flex items-center justify-center gap-4 pointer-events-auto">
{/*             <Button
              size="lg"
              onClick={() => (window.location.href = "/login")}
              className="bg-[#4b73b3] hover:bg-white text-white px-8 h-14 text-lg font-semibold shadow-2xl"
            >
              Start for Free →
            </Button> */}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-black/0 to-black pointer-events-none z-100" />
    </section>
  );
}
