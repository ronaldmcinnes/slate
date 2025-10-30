import CoreFeaturesGrid from "@/components/landing/coreFeatures/grid";
import CoreText from "@/assets/core.svg";
import FeaturesText from "@/assets/features.svg";
import { useEffect, useRef, useState } from "react";
import { FeatureCard } from "@/components/features/coreFeatures/FeatureCard";

import { AnimatedCoreText } from "@/components/landing/coreFeatures/animatedCore";
import { AnimatedFeaturesText } from "@/components/landing/coreFeatures/animatedFeatures";

import torquoiseGrid from "@/assets/coloredGrids/torquoiseGrid.png";
import pinkGrid from "@/assets/coloredGrids/pinkGrid.png";
import yellowGrid from "@/assets/coloredGrids/yellowGrid.png";
import purpleGrid from "@/assets/coloredGrids/purpleGrid.png";
import blueGrid from "@/assets/coloredGrids/blueGrid.png";

import feature1 from "@/components/features/coreFeatures/feature1.gif";
import feature2 from "@/components/features/coreFeatures/feature2.gif";
import feature3 from "@/components/features/coreFeatures/feature3.gif";

export function FeaturesSection() {
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
    <section className="relative w-full bg-black py-20 overflow-hidden min-h-screen">
      {/* Grid overlay */}
      <CoreFeaturesGrid />

      <div className="relative z-10 max-w-7xl mx-auto px-4 h-full">
        {/* Main heading */}
        <div className="mb-16 flex gap-2 ml-[4rem]">
          <AnimatedCoreText
            className="w-[100%] mt-11"
            duration={2000}
            strokeWidth={1.5}
          />
          <AnimatedFeaturesText
            className="mt-4 w-[160%] h-auto"
            duration={2500}
            strokeWidth={1.5}
          />
        </div>

        <div ref={containerRef} className="relative w-full h-[600px]">
          {/* Wireframe graphic 1 - top left (cyan) */}
          <div
            className="absolute -left-[16.4%] top-[0%] w-[26.4%] aspect-[8/5] opacity-0 transition-all duration-700 ease-out"
            data-animate
            data-delay="200"
            style={{ opacity: isReady ? undefined : 0 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <img
                src={torquoiseGrid}
                alt="Example Contour Map"
                className="w-full h-full object-cover"
              ></img>
            </div>
          </div>

          <FeatureCard
            title="Visualize the impossible."
            description="Use audio descriptions to generate advanced, undrawable mathematical structures or charts straight from your mind."
            image={feature1}
            className="left-[10%] top-[0%] w-[25%] aspect-[4/4]"
            dataAnimate
            dataDelay="400"
            style={{ opacity: isReady ? undefined : 0 }}
          />

          {/* Wireframe graphic 2 - center (pink/magenta) */}
          <div
            className="absolute left-[40%] -top-[12.9%] w-[25.5%] aspect-[4/3] transition-all duration-700 ease-out opacity-0"
            data-animate
            data-delay="600"
            style={{ opacity: isReady ? undefined : 0 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-fuchsia-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <img
                src={pinkGrid}
                alt="Example Contour Map"
                className="w-full h-full object-cover"
              ></img>
            </div>
          </div>

          <FeatureCard
            title="Collaborate across platforms."
            description="Real-time collaboration features that keep your classroom connected and productive."
            image={feature2}
            className="left-[71%] -top-[25%] w-[25%] aspect-[4/4]"
            dataAnimate
            dataDelay="800"
            style={{ opacity: isReady ? undefined : 0 }}
          />

          {/* Wireframe graphic 3 - right side (orange) */}
          <div
            className="absolute -right-[22%] top-[0.1%] w-[25.8%] aspect-[8/4] transition-all duration-700 ease-out"
            data-animate
            data-delay="1000"
            style={{ opacity: isReady ? undefined : 0 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-600/20 backdrop-blur-sm flex items-center opacity-0 overflow-hidden">
              <img
                src={yellowGrid}
                alt="Example Contour Map"
                className="w-[60%] h-full object-cover object-bottom"
              ></img>
            </div>
          </div>

          {/* Wireframe graphic 4 - bottom left (cyan) */}
          <div
            className="absolute left-[18%] bottom-[12.52%] w-[17%] aspect-square opacity-0 transition-all duration-700 ease-out"
            data-animate
            data-delay="1200"
            style={{ opacity: isReady ? undefined : 0 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <img
                src={blueGrid}
                alt="Example Contour Map"
                className="w-full h-full object-cover object-bottom"
              ></img>
            </div>
          </div>

          <FeatureCard
            title="Education for all."
            description="Easy to learn interface, friendly web integration, perfect for all ages and demographics."
            image={feature3}
            className="left-[50%] bottom-[5%] w-[25%] aspect-[4/4]"
            dataAnimate
            dataDelay="1400"
            style={{ opacity: isReady ? undefined : 0 }}
          />

          {/* Wireframe graphic 5 - bottom right (purple) */}
          <div
            className="absolute right-[7%] bottom-[19.8%] w-[18%] aspect-[4/3] opacity-0 transition-all duration-700 ease-out"
            data-animate
            data-delay="1600"
            style={{ opacity: isReady ? undefined : 0 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-violet-600/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <img
                src={purpleGrid}
                alt="Example Contour Map"
                className="w-full h-full object-cover object-bottom"
              ></img>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
