export default function CoreFeaturesGrid() {
  return (
    <div>
      <div className="absolute inset-0 w-full h-full bg-black overflow-hidden mt-[8rem]">
      {/* Vertical lines - irregularly spaced */}
      <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[9%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[11.3%]" />
      <div className="absolute top-[15%] bottom-0 w-px bg-white left-[16.7%]" />
      <div className="absolute top-[15%] bottom-0 w-px bg-white left-[34%]" /> {/* left of core features */}
      <div className="absolute top-[15%] bottom-0 w-px bg-white/50 left-[37.5%]" /> {/* right of top left gray square */}
      <div className="absolute top-[15%] bottom-0 w-px bg-white left-[41.6%]" />
      <div className="absolute top-[15%] bottom-0 w-px bg-white left-[49.96%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[67.45%]" /> {/* right of core features */}
      <div className="absolute top-0 bottom-0 w-px bg-white left-[74%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[85.73%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[88.25%]" />

      {/* Horizontal lines - irregularly spaced */}
      <div className="absolute left-0 right-0 h-px bg-white top-[15%]" /> {/* under core features */}
      <div className="absolute left-0 right-0 h-px bg-white top-[22.5%]" /> {/* above top left gray square */}
      <div className="absolute left-0 right-0 h-px bg-white/50 top-[38%]" /> {/* below top right square */}
      <div className="absolute left-0 right-0 h-px bg-white top-[42.25%]" /> 
      <div className="absolute left-0 right-0 h-px bg-white/50 top-[52.4%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[64%]" />
      <div className="absolute left-0 right-0 h-px bg-white/50 top-[68.6%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[72.85%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[95%]" />
    </div>

    </div>
    
  )
}
