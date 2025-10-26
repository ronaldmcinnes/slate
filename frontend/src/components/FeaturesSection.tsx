import CoreFeaturesGrid from "@/components/coreFeatures/grid"
import CoreText from "@/assets/core.svg"
import FeaturesText from "@/assets/features.svg"

import { AnimatedCoreText } from "@/components/coreFeatures/animatedCore"
import { AnimatedFeaturesText } from "@/components/coreFeatures/animatedFeatures"

export function FeaturesSection() {
  return (
    <section className="relative w-full bg-black py-20 overflow-hidden min-h-screen">
      {/* Grid overlay */}
      <CoreFeaturesGrid />

      <div className="relative z-10 max-w-7xl mx-auto px-4 h-full">
        {/* Main heading */}
        <div className="mb-16 flex gap-2 ml-[8rem]">
          <AnimatedCoreText className="w-[100%] mt-11" duration={2000} strokeWidth={1.5} />
          <AnimatedFeaturesText className="mt-4 w-[160%] h-auto" duration={2500} strokeWidth={1.5} />
        </div>

        <div className="relative w-full h-[600px]">
          {/* Wireframe graphic 1 - top left (cyan) */}
          <div className="absolute left-[1%] top-[5%] w-[8%] aspect-square">
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full p-2">
              </svg>
            </div>
          </div>

          {/* Gray feature card 1 - top center-left */}
          <div className="absolute left-[10%] top-[0%] w-[25%] aspect-[4/4] bg-gray-200/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-2xl hover:shadow-white/20 cursor-pointer group">
            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-black font-semibold">Feature 1</span>
            </div>
          </div>

          {/* Wireframe graphic 2 - center (pink/magenta) */}
          <div className="absolute left-[33%] top-[28%] w-[18%] aspect-[4/3]">
            <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-fuchsia-600/20 rounded-lg backdrop-blur-sm border border-pink-500/30 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full p-2">
              </svg>
            </div>
          </div>

          {/* Gray feature card 2 - top right */}
          <div className="absolute left-[62%] top-[8%] w-[22%] aspect-[4/3] bg-gray-200/90 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-2xl hover:shadow-white/20 cursor-pointer group">
            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-black font-semibold">Feature 2</span>
            </div>
          </div>

          {/* Wireframe graphic 3 - right side (orange) */}
          <div className="absolute right-[2%] top-[22%] w-[10%] aspect-square">
            <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-600/20 rounded-lg backdrop-blur-sm border border-orange-500/30 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                <defs>
                  <linearGradient id="grid3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 12 }).map((_, i) => (
                  <line
                    key={`diag${i}`}
                    x1={i * 8}
                    y1="0"
                    x2="0"
                    y2={i * 8}
                    stroke="url(#grid3)"
                    strokeWidth="0.5"
                    opacity="0.5"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Wireframe graphic 4 - bottom left (cyan) */}
          <div className="absolute left-[16%] bottom-[15%] w-[12%] aspect-square">
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                <defs>
                  <linearGradient id="grid4" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 10 }).map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1="0"
                    y1={i * 10}
                    x2="100"
                    y2={i * 10}
                    stroke="url(#grid4)"
                    strokeWidth="0.5"
                    opacity="0.6"
                  />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * 10}
                    y1="0"
                    x2={i * 10}
                    y2="100"
                    stroke="url(#grid4)"
                    strokeWidth="0.5"
                    opacity="0.6"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Gray feature card 3 - bottom center */}
          <div className="absolute left-[42%] bottom-[8%] w-[20%] aspect-[3/4] bg-gray-200/90 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-2xl hover:shadow-white/20 cursor-pointer group">
            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-black font-semibold">Feature 3</span>
            </div>
          </div>

          {/* Wireframe graphic 5 - bottom right (purple) */}
          <div className="absolute right-[8%] bottom-[18%] w-[15%] aspect-[4/3]">
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-lg backdrop-blur-sm border border-purple-500/30 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                <defs>
                  <linearGradient id="grid5" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 20 }).map((_, i) => (
                  <line
                    key={`wave${i}`}
                    x1="0"
                    y1={5 + i * 5}
                    x2="100"
                    y2={5 + i * 5}
                    stroke="url(#grid5)"
                    strokeWidth="0.5"
                    opacity="0.4"
                  />
                ))}
                <path d="M 0 40 Q 20 20, 40 40 T 80 40" fill="none" stroke="url(#grid5)" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
