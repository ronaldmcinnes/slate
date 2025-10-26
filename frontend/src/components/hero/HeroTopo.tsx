"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// --- GLSL: Ashima 3D simplex noise (compact) for vertex displacement ---
// Note: This is a commonly used GLSL noise implementation; kept here inline.
const SIMPLEX_NOISE = `
// Simplex 3D noise from Ashima Arts (compact)
vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec4 j = p - 49.0 * floor(p * (1.0/49.0));
  vec4 x_ = floor(j * (1.0/7.0));
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = (x_ *2.0 + 0.5)/7.0 - 1.0;
  vec4 y = (y_ *2.0 + 0.5)/7.0 - 1.0;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

// --- VERTEX SHADER ---
// Displace vertices using fractal (fbm) of snoise, pass world position to fragment shader.
const VERT = `
  precision highp float;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uDisplacement;
  uniform float uNoiseScale;
  uniform float uSeed; // Added random seed uniform

  ${SIMPLEX_NOISE}

  // fractal brownian motion (fbm) using snoise
  float fbm(vec3 p){
    float total = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i=0;i<5;i++){
      total += amp * snoise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return total;
  }

  void main(){
    vUv = uv;
    vec3 pos = position;

    vec3 samplePos = vec3(position.x * uNoiseScale + uSeed, position.y * uNoiseScale, position.z * uNoiseScale - uTime * 0.06 + uSeed * 0.5);

    float n = fbm(samplePos);
    float ridge = 1.0 - abs(n);
    float sharp = pow(ridge, 2.0); // smaller exponent = softer
    pos.y += sharp * uDisplacement;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// --- FRAGMENT SHADER ---
// Evan-style grid using fwidth on world-space xz coordinates; with a color ramp by height
const FRAG = `
precision highp float;
varying vec3 vWorldPos;
varying vec2 vUv;

uniform float uContourSpacing;
uniform float uContourThickness;

void main() {
  // Horizontal grid (XZ plane)
  vec2 coordXZ = vWorldPos.xz * uContourSpacing;
  vec2 gridXZ = abs(fract(coordXZ - 0.5) - 0.5) / fwidth(coordXZ);
  float lineXZ = min(gridXZ.x, gridXZ.y);
  
  // Vertical grid (Y axis) - shows elevation
  vec2 coordXY = vec2(vWorldPos.x * uContourSpacing, vWorldPos.y * uContourSpacing);
  vec2 gridXY = abs(fract(coordXY - 0.5) - 0.5) / fwidth(coordXY);
  float lineXY = gridXY.x;
  
  vec2 coordYZ = vec2(vWorldPos.y * uContourSpacing, vWorldPos.z * uContourSpacing);
  vec2 gridYZ = abs(fract(coordYZ - 0.5) - 0.5) / fwidth(coordYZ);
  float lineYZ = gridYZ.y;
  
  // Combine horizontal and vertical lines with thickness control
  float line = min(min(lineXZ, lineXY), lineYZ);
  float color = 1.0 - min(line * uContourThickness, 1.0);
  color = pow(color, 1.0 / 2.2);
  
  // Distance-based fade for horizon effect
  float dist = length(vWorldPos.xz);
  float fade = smoothstep(25.0, 35.0, dist);
  color = mix(color, 0.0, fade);
  
  gl_FragColor = vec4(vec3(color), 1.0);
}
`

// ---- React child which renders the plane and updates uniforms ----
function TerrainPlane({
  segments,
  size,
  paused,
}: {
  segments: number
  size: number
  paused: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  const tRef = useRef(0)

  const randomSeed = useMemo(() => Math.random() * 1000, [])

  // uniforms initial values
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uDisplacement: { value: 5.0 } /* terrain */,
      uNoiseScale: { value: 0.03 },
      uRidgeExp: { value: 0.6 },
      uColorBase: { value: new THREE.Color(0x1f4e79) },
      uContourSpacing: { value: 3 } /* Higher = lines closer together */,
      uContourThickness: { value: 1.5 } /* Higher = thicker lines */,
      uGamma: { value: 2.2 },
      uSeed: { value: randomSeed }, // Added seed uniform
    }),
    [randomSeed],
  )

  // Build geometry once
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    geo.rotateX(-Math.PI / 2)
    return geo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, segments])

  // update time uniform in animation loop
  useFrame((state, delta) => {
    if (!materialRef.current) return
    // clamp delta to avoid huge jumps when tab was inactive or on full reload
    const clampedDelta = Math.min(delta, 0.05) // max frame step 50ms

    /* debuggin!! */
    /*     console.log({
      delta,
      clampedDelta,
      elapsed: state.clock.getElapsedTime(),
    }); */

    /*     const elapsed = state.clock.getElapsedTime();
    console.log("TerrainPlane BEFORE set uTime:", materialRef.current.uniforms?.uTime?.value);
  materialRef.current.uniforms.uTime.value = elapsed;
  console.log("TerrainPlane AFTER set uTime:", materialRef.current.uniforms?.uTime?.value);

    tRef.current += clampedDelta;

    materialRef.current.uniforms.uTime.value = tRef.current; */

    // small subtle motion of whole mesh for extra organic feel
    if (ref.current) {
      ref.current.rotation.y = Math.sin(materialRef.current.uniforms.uTime.value * 0.02) * 0.02
    }
  })
  return (
    <mesh ref={ref} geometry={geometry}>
      <shaderMaterial
        ref={(m: any) => (materialRef.current = m)}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ---- Camera idle flight component ----
function IdleCamera({ paused }: { paused: boolean }) {
  const { camera } = useThree()
  const tRef = useRef(0)

  useFrame((state, delta) => {
    if (paused) return

    // accumulate clamped time (stable across reloads)
    const clampedDelta = Math.min(delta, 0.05)

    /*     console.log({
      delta,
      clampedDelta,
      elapsed: state.clock.getElapsedTime(),
    }); */

    tRef.current += clampedDelta
    const t = tRef.current

    const radius = 22.0
    const speed = 0.06 // smaller = slower rotation

    const x = Math.cos(t * speed) * radius
    const z = Math.sin(t * speed) * radius
    const y = 10.0 + Math.sin(t * 0.5) * 1.3

    // debug camera jump
    camera.position.set(x, y, z)
    camera.lookAt(0, 2, 0)
  })

  return null
}

// ---- Main Hero component export ----

export default function HeroTopo() {
  const [paused, setPaused] = useState(false)
  const [segments, setSegments] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 900) return 160
    return 360
  })

  useEffect(() => {
    if ((navigator as any).connection && (navigator as any).connection.saveData) {
      setSegments(120)
    }
  }, [])

  return (
    <div className="w-full h-[60%] relative">
      <Canvas
        className="r3-canvas"
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 8, 20], fov: 50 }}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 20, 40]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <IdleCamera paused={paused} />
        <TerrainPlane segments={segments} size={70} paused={paused} />
      </Canvas>
    </div>
  )
}
