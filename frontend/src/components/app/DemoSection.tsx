import DemoGrid from "@/components/demo/demoGrid";
import { AnimatedDemoText } from "@/components/demo/animatedDemo";
import VideoEmbed from "@/components/demo/VideoEmbed";
import Footer from "@/components/layout/Footer";
import { useEffect, useRef, useState } from "react";
import torquoiseGrid from "@/assets/coloredGrids/torquoiseGrid.png";
import purpleGrid from "@/assets/coloredGrids/purpleGrid.png";
import pinkGrid from "@/assets/coloredGrids/pinkGrid.png";
import blueGrid from "@/assets/coloredGrids/blueGrid.png";
import yellowGrid from "@/assets/coloredGrids/yellowGrid.png";
export function DemoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll("[data-animate]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const delay = element.dataset.delay || "0";

            setTimeout(() => {
              element.classList.remove("opacity-0");
              element.classList.add("!opacity-100");
            }, Number.parseInt(delay));

            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      clearTimeout(readyTimer);
      observer.disconnect();
    };
  }, []);
  return (
    <>
      <section className="relative w-full bg-black overflow-hidden min-h-screen">
        <DemoGrid />

        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full">
          {/* Main heading */}
          <div className="mb-8 flex flex-col gap-2.5 justify-center items-center">
            <div className="flex justify-end">
              <AnimatedDemoText
                className="w-[110%] mt-11 ml-[96%]"
                duration={2000}
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div ref={containerRef} className="relative w-full h-[600px]">
            {/* Video Embed Overlay */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-center z-20">
              <div className="w-[60rem] h-[400px]">
                <VideoEmbed
                  src=""
                  poster=""
                  className="w-full h-full shadow-2xl"
                  autoplay={false}
                  muted={true}
                  loop={true}
                  controls={true}
                />
              </div>
            </div>
            {/* Wireframe graphic 1 - top left (cyan) */}
            <div
              className="absolute -right-[20%] -top-[84.2%] w-[27%] aspect-[8/5] transition-all duration-700 ease-out opacity-0"
              data-animate
              data-delay="200"
              style={{ opacity: isReady ? 1 : 0 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img
                  src={torquoiseGrid}
                  alt="Example Contour Map"
                  className="w-full h-full object-cover"
                ></img>
              </div>
            </div>

            {/* Wireframe graphic 2 - center (pink/magenta) */}
            <div
              className="absolute -left-[14%] -top-[14.5%] w-[25.5%] aspect-[4/3] transition-all duration-700 ease-out opacity-0"
              data-animate
              data-delay="600"
              style={{ opacity: isReady ? 1 : 0 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-violet-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img
                  src={pinkGrid}
                  alt="Example Contour Map"
                  className="w-full h-full object-cover"
                ></img>
              </div>
            </div>

            {/* Wireframe graphic 3 - center (purple) */}
            <div
              className="absolute left-[0.9%] -top-[140.8%] w-[21.6%] aspect-[4/3] transition-all duration-700 ease-out opacity-0"
              data-animate
              data-delay="600"
              style={{ opacity: isReady ? 1 : 0 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-violet-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img
                  src={purpleGrid}
                  alt="Example Contour Map"
                  className="w-full h-full object-cover"
                ></img>
              </div>
            </div>

            {/* Wireframe graphic 4 - bottom right (blue) */}
            <div
              className="absolute right-[1%] top-[30%] w-[20%] aspect-[3/2] transition-all duration-700 ease-out opacity-0"
              data-animate
              data-delay="1000"
              style={{ opacity: isReady ? 1 : 0 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img
                  src={blueGrid}
                  alt="Example Contour Map"
                  className="w-full h-full object-cover"
                ></img>
              </div>
            </div>

            {/* Wireframe graphic 5 - bottom left (yellow) */}
            <div
              className="absolute left-[8%] top-[55%] w-[20%] aspect-[5/4] transition-all duration-700 ease-out opacity-0"
              data-animate
              data-delay="1400"
              style={{ opacity: isReady ? 1 : 0 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img
                  src={yellowGrid}
                  alt="Example Contour Map"
                  className="w-full h-full object-cover"
                ></img>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
