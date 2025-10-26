"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedDemoText({
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
    if (!svgRef.current) return

    const paths = svgRef.current.querySelectorAll("path")
    paths.forEach((path) => {
      const length = path.getTotalLength()
      path.style.strokeDasharray = length.toString()
      path.style.strokeDashoffset = length.toString()
      path.style.fillOpacity = "0"
      path.style.opacity = "0"
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setTimeout(() => {
              setIsAnimating(true)
              setHasAnimated(true)
            }, 100)
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

      path.style.opacity = "1"
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
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 998 568" className={className}>
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
        <path className="logo-path" d="M183.99,161c-8.689,7.712-16.189,16.966-23.386,26.103-12.342,15.668-23.572,36.74-36.092,50.908-4.735,5.358-10.964,12-10.514-.484.642-17.796,17.861-52,26.83-68.201,26.654-48.145,96.968-136.851,159.399-125.054,71.472,13.506,62.374,123.372,51.309,175.762-21.067,99.746-78.347,193.638-151.522,263.478-15.656,14.942-43.716,41.962-66.408,41.383-15.354-.392-27.973-13.767-20.166-28.957,2.808-5.464,12.903-10.81,18.019-14.981,15.432-12.585,30.1-25.781,44.604-39.414,1.802-3.109-.803-11.91-1.053-16.053-1.715-28.439-.439-56.589.032-84.949.996-60.003,2.015-119.851,8.949-179.541ZM218.01,393c43.338-52.531,74.321-117.728,90.497-183.992,12.382-50.723,31.219-171.502-59.822-107.822-5.948,4.161-39.143,31.022-40.477,35.517.861,24.941,5.065,49.867,6.781,74.808,1.863,27.087,1.474,53.887,1.969,81.031.043,2.365,1.045,4.554,1.082,6.918l-.031,93.541Z"/>
        <path className="logo-path" d="M611.01,315.995l30.819-67.666c11.014-21.663,33.588-39.048,56.181-19.839,23.864,20.289,26.287,98.835,31.157,129.843,2.04,12.991,4.002,25.8,9.846,37.664,6.567-5.933,16.645-1.732,17.809,6.762s-15.597,22.309-23.278,24.284c-41.08,10.567-46.407-57.919-47.585-84.502-1.512-34.113,6.036-69.5-3.971-102.539-2.641-1.986-24.668,45.916-26.167,49.319-16.483,37.429-24.596,75.061-39.074,111.926-2.549,6.49-4.61,12.191-11.039,15.961-11.039,6.472-24.104,1.198-29.439-9.978-13.386-28.043,4.616-109.781,6.721-143.739.08-1.291.374-8.478-.49-8.501-17.534,43.073-40.08,84.88-42.541,132.469-.695,13.43,3.258,41.702-8.621,50.379-7.161,5.23-18.401,4.436-24.33-2.344-7.438-8.505-5.824-23.583-6.048-34.034l4.031-50.454-9.829,12.656c-19.511,37.4-51.537,104.418-103.96,91.639-40.476-9.867-49.801-61.305-47.239-96.838,2.438-33.815,29.167-75.943,49.642-102.358,12.249-15.803,32.244-42.146,55.078-30.285,28.911,15.018,5.292,64.436-7.266,84.097-12.884,20.171-32.004,44.45-55.3,52.195-1.104,12.249,2.151,44.853,14.186,51.088,5.293,2.742,10.989,1.563,16.495.098,17.817-4.74,47.522-41.661,59.02-56.98,8.132-10.834,33.137-43.254,37.385-53.615,7.085-17.282,9.17-43.968,15.083-62.917,7.634-24.465,12.438-7.917,14.587,6.843.84,5.77.439,12.404,1.125,17.891.174,1.39.572,2.92,1.989,1.479,3.549-9.969,7.325-20.102,11.838-29.674,5.866-12.444,13.361-30.639,30.45-27.092,11.896,2.469,15.948,26.408,17.561,36.434,3.694,22.961,4.525,47.089,5.176,70.329ZM395.01,327c16.901-22.573,37.141-48.851,38.98-77.999-10.256,9.236-17.017,24.103-22.849,36.641-6.218,13.368-11.632,27.337-16.132,41.358Z"/>
        <path className="logo-path" d="M839.756,227.262c3.262-.432,6.057-.498,9.303.182,4.363.914,9.62,5.958,11.584,6.275,4.386.709,7.425-1.847,14.339.799,25.731,9.847,34.633,66.964,35.059,90.94.72,40.562-17.8,128.308-75.82,109.82-39.243-12.504-55.798-81.723-53.208-117.766,2.081-28.966,25.8-85.889,58.743-90.251ZM861.986,255.003c-2.336-.506-1.6.318-2.227,1.286-1.594,2.462-2.61,5.935-4.339,8.632-8.93,13.936-18.076,22.71-23.453,39.547-8.207,25.695-.694,64.595,16.533,85.514,10.284-13.429,15.486-33.15,18.208-49.773,4.451-27.182,4.149-59.033-4.722-85.206Z"/>
      </svg>
    </div>
  )
}
