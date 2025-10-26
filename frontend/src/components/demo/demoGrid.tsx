export default function DemoGrid() {
  return (
    <div>
      <div className="absolute w-full h-full bg-black overflow-hidden">
      {/* Vertical lines - irregularly spaced */}
      <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[9%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[17.95%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[28.7%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[31%]" /> {/* left of core features */}
      <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[37.5%]" /> {/* right of top left gray square */}
      <div className="absolute top-0 bottom-0 w-px bg-white left-[41.6%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[27.2%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[58.45%]" /> {/* right of core features */}
      <div className="absolute top-[22.5%] bottom-0 w-px bg-white left-[74%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[81.96%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white/50 left-[85.73%]" />
      <div className="absolute top-0 bottom-0 w-px bg-white left-[88.25%]" />

      {/* Horizontal lines - irregularly spaced */}
      <div className="absolute left-0 right-0 h-px bg-white top-[0]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[5%]" /> {/* under core features */}
      <div className="absolute left-0 right-0 h-px bg-white top-[23.5%]" /> {/* above top left gray square */}
      <div className="absolute left-0 right-0 h-px bg-white/50 top-[28.5%]" />
      <div className="absolute left-0 right-0 h-px bg-white/50 top-[38.1%]" /> {/* below top right square */}
      <div className="absolute left-0 right-0 h-px bg-white top-[43.25%]" /> 
      <div className="absolute left-0 right-0 h-px bg-white/50 top-[52.4%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[64%]" />
      <div className="absolute left-0 right-0 h-px bg-white/50 top-[69%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[73.85%]" />
      <div className="absolute left-0 right-0 h-px bg-white top-[92.4%]" />
    </div>

    </div>
    
  )
}
