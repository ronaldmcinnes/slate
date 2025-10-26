import { Button } from "@/components/ui/button";
import HeroTopo from "@/components/landing/hero/HeroTopo";
import slateHandwrittenLogo from "@/assets/slatehandwritten.svg";
import { AnimatedSlateLogo } from "./hero/animateSlateLogo";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0 flex flex-col">
        <div className="flex-1 bg-black"></div>
        <HeroTopo />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex justify-center min-h-screen pointer-events-none">
        <div className="justify-center text-center px-4 max-w-4xl pt-[7%]">
          <div className="flex justify-center text-6xl md:text-[10rem] font-bold text-foreground mb-none leading-tight drop-shadow-2xl">
            <AnimatedSlateLogo
              className="w-[200%] -ml-[50%]"
              autoPlay={true}
              duration={3000}
            />
          </div>
          <p className="text-white -mt-[8%] text-xl md:text-2xl text-foreground/90 mb-4 max-w-2xl mx-auto drop-shadow-lg">
            Reimaginng learning for everyone, using AI.
          </p>
          <div className="flex items-center justify-center gap-4 pointer-events-auto">
            <Button
              size="lg"
              onClick={() => (window.location.href = "/login")}
              className="bg-white hover:bg-gray-100 text-black px-8 h-14 text-lg font-semibold shadow-2xl"
            >
              Fill your blank Slate now
              <span className="ml-2 inline-block animate-[bounceX_1s_ease-in-out_infinite]">
                →
              </span>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-background/0 to-background pointer-events-none z-100" />
    </section>
  );
}
