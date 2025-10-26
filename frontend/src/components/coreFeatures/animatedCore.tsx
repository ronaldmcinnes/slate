"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedCoreText({
  className = "",
  duration = 1500,
  strokeWidth = 2,
}: {
  className?: string
  duration?: number
  strokeWidth?: number
}) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsAnimating(true)
            setHasAnimated(true)
          }
        })
      },
      { threshold: 0.3 },
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [hasAnimated])

  useEffect(() => {
    if (!svgRef.current || !isAnimating) return

    const paths = svgRef.current.querySelectorAll("path")
    const delayBetweenPaths = 300 // ms between each letter starting

    paths.forEach((path, index) => {
      const length = path.getTotalLength()

      path.style.strokeDasharray = length.toString()
      path.style.strokeDashoffset = length.toString()
      path.style.fillOpacity = "0"

      setTimeout(() => {
        path.style.transition = `stroke-dashoffset ${duration}ms ease-in-out, fill-opacity ${duration}ms ease-in-out`
        path.style.strokeDashoffset = "0"
        path.style.fillOpacity = "1"
      }, delayBetweenPaths * index)
    })

    const timer = setTimeout(
      () => {
        setIsAnimating(false)
      },
      delayBetweenPaths * paths.length + duration,
    )

    return () => clearTimeout(timer)
  }, [isAnimating, duration])

  return (
    <div ref={containerRef} className="inline-block">
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 836 447" className={className}>
        <defs>
          <style>{`
            .logo-path {
              fill: #fff;
              stroke: #fff;
              stroke-width: ${strokeWidth};
              stroke-linecap: round;
              stroke-linejoin: round;
            }
          `}</style>
        </defs>
        <path
          className="logo-path"
          d="M219.094,138.089l3.952-1.754c.797-12.707-5.184-45.466-20.521-47.356-30.58-3.769-68.627,41.947-82.046,66-25.8,46.246-42.651,131.341-32.183,183.226,3.386,16.786,12.995,40.454,33.257,40.827,32.782.602,86.144-48.075,110.461-69.518,14.02-12.363,28.743-28.82,42.974-40.026,6.861-5.403,14.034-7.35,21.505-1.481,2.086,1.639,2.632,3.782,4.497,4.988,1.272-28.904,7.367-56.483,27.037-78.468,6.845-7.65,27.446-24.572,37.469-25.529,10.861-1.037,11.362,3.44,18.8,7.206,15.995,8.099,19.437,7.886,29.222,24.778,25.97,44.829,17.292,117.721-7.348,161.69-26.598,47.463-72.869,46.544-92.654-5.688-7.861-20.754-9.519-41.616-11.64-63.359-.132-1.35-.542-6.104-1.864-6.616-3.733,5.42-9.286,11.602-13.986,16.519-38.548,40.323-115.13,121.19-174.513,117.461-90.572-5.687-74.57-153.86-59.644-212.618,15.379-60.541,60.781-141.078,130.646-147.354,40.766-3.662,64.725,29.839,53.986,67.986-2.185,7.76-8.637,18.083-17.385,12.371l-.023-3.284ZM383.5,201.017c-35.449,26.275-38.142,68.699-32.358,109.341,1.751,12.304,4.436,25.621,10.357,36.622,9.174-11.019,15.112-24.428,20.25-37.73,12.625-32.688,24.154-77.467,1.751-108.233Z"
        />
        <path
          className="logo-path"
          d="M480.651,165.348c4.546,4.638,3.379,17.345,4.359,23.652,44.162-52.686,97.001,1.715,106.525,51.965,2.526,13.326,1.705,41.068-14.72,45.351-31.4,8.189-30.565-43.159-38.635-62.996-6.603-16.233-9.928-18.496-18.037-1.676-19.517,40.485-15.906,99.438-19.154,143.846-.729,9.964-.506,22.784-7.548,30.452-10.156,11.06-30.597,9.192-37.647-4.241-4.504-8.582-6.023-31.709-6.784-42.211-2.808-38.726-2.304-80.317.998-118.981,1.396-16.344,4.414-53.1,16.504-64.496,3.875-3.653,10.268-4.614,14.139-.664Z"
        />
        <path
          className="logo-path"
          d="M590.994,344.006c-8.714.857-18.673-3.575-15.325-13.843,1.89-5.798,4.225-1.63,7.288-2.657.969-.325,6.275-4.203,6.847-5.203,3.07-25.593,9.017-51.368,22.391-73.609,15.837-26.337,49.98-54.072,78.448-65.552,40.351-16.273,50.472,19.397,38.381,51.381-14.997,39.673-56.542,68.628-91.538,89.462-1.794,11.585.351,36.843,15.102,38.928,20.721,2.93,44.421-11.491,60.728-23.098,6.616-4.709,21.385-19.083,28.162-19.836,15.49-1.722,22.815,12.187,15.345,25.343-10.075,17.744-33.066,40.071-50.803,50.197-52.972,30.241-108.559,12.751-115.025-51.512ZM699,209.01c-1.152-.953-7.743,4.416-9.012,5.478-19.364,16.217-34.934,41.125-43.978,64.512,21.253-20.125,44.169-41.051,52.99-69.99Z"
        />

      </svg>
    </div>
  )
}
