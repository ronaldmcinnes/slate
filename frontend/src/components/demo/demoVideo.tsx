import React, { useMemo, useRef, useState } from "react";

/**
 * VideoEmbed
 * A single-file, production-ready React + Tailwind component to embed video from
 * - YouTube
 * - Vimeo
 * - Direct MP4 / HLS (m3u8)
 *
 * Features
 * - Responsive aspect ratio (16:9 default) with safe CSS padding trick
 * - Lazy loading (click-to-play poster) to avoid heavy initial network
 * - Accessible play button + keyboard support
 * - Optional captions (VTT) for direct <video>
 * - Clean API with TypeScript props
 *
 * Usage examples:
 * <VideoEmbed
 *   provider="youtube"
 *   src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   title="Never Gonna Give You Up"
 *   poster="/path/to/poster.jpg"
 *   aspectRatio="16/9"
 *   allowFullScreen
 * />
 *
 * <VideoEmbed provider="mp4" src="https://example.com/video.mp4" captions="/captions.vtt"/>
 */

type Provider = "youtube" | "vimeo" | "mp4" | "hls" | "iframe";

interface Props {
  provider?: Provider; // if not provided, component will try to infer from src
  src: string;
  title?: string;
  poster?: string; // poster image when using <video> or placeholder for iframe
  aspectRatio?: string; // e.g. "16/9" or "4/3"
  className?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  captions?: string | null; // URL to .vtt file (only used for direct <video>)
  preload?: "auto" | "metadata" | "none";
  allowFullScreen?: boolean;
  lazy?: boolean; // if true (default), the iframe/video loads only after user clicks play
}

function inferProvider(src: string): Provider {
  if (/youtube\.com|youtu\.be/.test(src)) return "youtube";
  if (/vimeo\.com/.test(src)) return "vimeo";
  if (/\.m3u8($|\?)/.test(src)) return "hls";
  if (/\.mp4($|\?)/.test(src)) return "mp4";
  return "iframe";
}

function toYouTubeEmbed(src: string) {
  // Extract video id and build embed URL
  const idMatch = src.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[&?#]|$)/) || src.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
  const id = idMatch ? idMatch[1] : null;
  return id ? `https://www.youtube.com/embed/${id}` : src;
}

function toVimeoEmbed(src: string) {
  const idMatch = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const id = idMatch ? idMatch[1] : null;
  return id ? `https://player.vimeo.com/video/${id}` : src;
}

export default function VideoEmbed({
  provider: provProp,
  src,
  title = "Embedded video",
  poster,
  aspectRatio = "16/9",
  className = "",
  controls = true,
  autoplay = false,
  loop = false,
  muted = false,
  captions = null,
  preload = "metadata",
  allowFullScreen = true,
  lazy = true,
}: Props) {
  const inferred = useMemo(() => inferProvider(src), [src]);
  const provider = provProp || inferred;
  const [isPlaying, setIsPlaying] = useState(!lazy); // start unloaded if lazy
  const containerRef = useRef<HTMLDivElement | null>(null);

  // aspect ratio math -> padding-top percent
  const paddingTop = (() => {
    const parts = aspectRatio.split("/").map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      return `${(parts[1] / parts[0]) * 100}%`;
    }
    // fallback to 56.25% for 16:9
    return "56.25%";
  })();

  const iframeSrc = useMemo(() => {
    if (provider === "youtube") return toYouTubeEmbed(src);
    if (provider === "vimeo") return toVimeoEmbed(src);
    return src; // iframe or unknown provider
  }, [provider, src]);

  // Accessible keyboard handler for the play button
  function handleKeyPlay(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsPlaying(true);
      // focus inside iframe/video not possible programmatically for cross-origin iframe
    }
  }

  // Small internal UI: poster + play button
  const Poster = (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm rounded-xl overflow-hidden`}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title}`}
      onClick={() => setIsPlaying(true)}
      onKeyDown={handleKeyPlay}
    >
      {poster ? (
        <img src={poster} alt="Video poster" className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
      <div className="relative z-10 p-3 rounded-full bg-white bg-opacity-90 shadow-lg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M7 6v12l10-6L7 6z" fill="black" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className={`video-embed-wrapper ${className}`} ref={containerRef}>
      <div className="relative w-full" style={{ paddingTop, borderRadius: 12 }}>
        <div className="absolute inset-0 overflow-hidden bg-gray-900">
          {provider === "mp4" || provider === "hls" ? (
            // Direct video element (mp4 or HLS via browser-native support or hls.js on client)
            <>
              {(!isPlaying && lazy) ? (
                Poster
              ) : (
                <video
                  className="w-full h-full object-cover"
                  controls={controls}
                  autoPlay={autoplay}
                  loop={loop}
                  muted={muted}
                  preload={preload}
                >
                  <source src={src} />
                  {captions ? <track kind="captions" srcLang="en" src={captions} default /> : null}
                  Sorry, your browser does not support embedded videos.
                </video>
              )}
            </>
          ) : (
            // iframe-based providers (YouTube, Vimeo, generic)
            <>
              {(!isPlaying && lazy) ? (
                Poster
              ) : (
                <iframe
                  title={title}
                  src={iframeSrc + (provider === "youtube" ? "?rel=0&showinfo=0&iv_load_policy=3&modestbranding=1" : "")}
                  className="w-full h-full border-0"
                  allow={"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" + (allowFullScreen ? "; fullscreen" : "")}
                  allowFullScreen={allowFullScreen}
                  loading="lazy"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
