"use client"

import type React from "react"

interface FeatureCardProps {
  title: string
  description: string
  className?: string
  dataAnimate?: boolean
  dataDelay?: string
  style?: React.CSSProperties
}

export function FeatureCard({ title, description, className = "", dataAnimate, dataDelay, style }: FeatureCardProps) {
  return (
    <div
      className={`absolute ${className} opacity-0 transition-all duration-700 ease-out group`}
      data-animate={dataAnimate ? "" : undefined}
      data-delay={dataDelay}
      style={style}
    >
      {/* Default state - gray square */}
      <div className="w-full h-full bg-gray-400/80 transition-all duration-300" />

      {/* Hover state - expanded black card with glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black rounded-2xl p-6 z-40 pointer-events-none group-hover:pointer-events-auto shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] h-[140%] group-hover:scale-110 flex flex-col justify-center"
        style={{ transformOrigin: "center" }}
      >
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
