export default function CoreFeaturesGrid() {
  return (
    <div>
      <div className="absolute inset-0 w-full h-full bg-black overflow-hidden mt-[8rem]">
      {/* Vertical lines - irregularly spaced */}
      <div className="absolute top-0 bottom-0 w-px bg-white left-[5%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[11%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[20%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[33%]" /> {/* left of core features */}
      <div className="absolute top-[13%] bottom-0 w-px bg-white left-[36.34%]" /> {/* right of top left gray square */}
      <div className="absolute top-[13%] bottom-0 w-px bg-white left-[40%]" />
      <div className="absolute top-[13%] bottom-0 w-px bg-white left-[60%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[67%]" /> {/* right of core features */}
      <div className="absolute top-0 bottom-0 w-px bg-white left-[74%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[88%]" />

      {/* Horizontal lines - irregularly spaced */}
      <div className="absolute left-0 right-0 h-px bg-white top-[15%]" /> {/* under core features */}
      <div className="absolute left-0 right-0 h-px bg-white top-[20%]" /> {/* above top left gray square */}
      <div className="absolute left-0 right-0 h-px bg-white top-[31.3%]" /> {/* below top right square */}
      <div className="absolute left-0 right-0 h-px bg-white top-[36.4%]" /> 
      <div className="absolute left-0 right-0 h-px bg-white top-[57%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[64%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[82%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[95%]" />
    </div>

    </div>
    
  )
}
