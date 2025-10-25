import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

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
`;

// --- VERTEX SHADER ---
// Displace vertices using fractal (fbm) of snoise, pass world position to fragment shader.
const VERT = `
  precision highp float;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uDisplacement;
  uniform float uNoiseScale;

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

    // sample noise in world-space (or plane local space)
    vec3 samplePos = vec3(position.x * uNoiseScale, position.y * uNoiseScale, position.z * uNoiseScale - uTime * 0.06);

    float n = fbm(samplePos);
    pos.y += n * uDisplacement;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// --- FRAGMENT SHADER ---
// Evan-style grid using fwidth on world-space xz coordinates; with a color ramp by height
const FRAG = `
/*   precision highp float;

  varying vec3 vWorldPos;
  varying vec2 vUv;

  uniform vec3 uColorBase;
  uniform float uContourSpacing;
  uniform float uContourThickness;
  uniform float uGamma;

  float gridAA(vec2 coord, float spacing, float thickness){
    // anti-aliased grid using fwidth; available in WebGL2 or via OES_standard_derivatives in WebGL1
    vec2 grid = abs(fract(coord/spacing - 0.5) - 0.5) / fwidth(coord/spacing);
    float line = min(grid.x, grid.y);
    float col = 1.0 - min(line, 1.0);
    float t = smoothstep(1.0 - thickness, 1.0, col);
    return t;
  }

  void main(){
    vec2 coord = vWorldPos.xz;

    float h = clamp((vWorldPos.y + 2.0) / 6.0, 0.0, 1.0);
    vec3 base = mix(uColorBase * 0.5, uColorBase, h);

    float g = gridAA(coord, uContourSpacing, uContourThickness);
    vec3 lineColor = vec3(0.95, 0.98, 1.0);
    vec3 color = mix(base, lineColor, g);

    float vign = smoothstep(0.0, 1.0, 1.0 - length(vUv - 0.5) * 1.2);
    color *= mix(0.95, 1.0, vign);

    color = pow(color, vec3(1.0 / uGamma));

    gl_FragColor = vec4(color, 1.0);
  } */

    precision highp float;
varying vec3 vWorldPos;
void main() {
  vec2 coord = vWorldPos.xz;
  vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
  float line = min(grid.x, grid.y);
  float color = 1.0 - min(line, 1.0);
  color = pow(color, 1.0 / 2.2);
  gl_FragColor = vec4(vec3(color), 1.0);
}
`;

// ---- React child which renders the plane and updates uniforms ----
function TerrainPlane({
  segments,
  size,
  paused,
}: {
  segments: number;
  size: number;
  paused: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // uniforms initial values
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uDisplacement: { value: 3.0 } /* terrain */,
      uNoiseScale: { value: 0.03 },
      uColorBase: { value: new THREE.Color(0x1f4e79) },
      uContourSpacing: { value: 0.6 } /* spacing of the lines */,
      uContourThickness: { value: 0.5 } /* thickness of lines here!! */,
      uGamma: { value: 2.2 },
    }),
    []
  );

  // Build geometry once
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, segments]);

  // update time uniform in animation loop
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    // Use the renderer clock elapsed time (stable across reloads)
    const elapsed = state.clock.getElapsedTime(); // seconds
    materialRef.current.uniforms.uTime.value = elapsed; // optionally * speed factor
    // small subtle motion of whole mesh for extra organic feel
    if (ref.current) {
      ref.current.rotation.y =
        Math.sin(materialRef.current.uniforms.uTime.value * 0.02) * 0.02;
    }
  });
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
  );
}

// ---- Camera idle flight component ----
function IdleCamera({ paused }: { paused: boolean }) {
  const { camera } = useThree();
  const tRef = useRef(0);

  useFrame((state) => {
    if (paused) return;

    // Use the same stable elapsed time for the camera too
    const elapsed = state.clock.getElapsedTime();

    const radius = 22.0;
    const speed = 0.06; // smaller = slower rotation
    const t = elapsed; // already in seconds

    const x = Math.cos(t * speed) * radius;
    const z = Math.sin(t * speed) * radius;
    const y = 5.0 + Math.sin(t * 0.5) * 1.3;

    camera.position.set(x, y, z);
    camera.lookAt(0, 2, 0);
  });

  return null;
}

// ---- Main Hero component export ----

export default function HeroTopo() {
  const [paused, setPaused] = useState(false);
  const [segments, setSegments] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 900) return 160;
    return 360;
  });

  useEffect(() => {
    if (
      (navigator as any).connection &&
      (navigator as any).connection.saveData
    ) {
      setSegments(120);
    }
  }, []);

  return (
    <div className="w-full h-screen relative">
      <Canvas
        className="r3-canvas"
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 8, 20], fov: 50 }}
      >
        <color attach="background" args={["#000000"]} />{" "}
        {/* change color here!!! */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <IdleCamera paused={paused} />
        <TerrainPlane segments={segments} size={70} paused={paused} />
      </Canvas>

      {/* controls */}
      <div className="absolute right-4 bottom-4 z-30 hero-controls rounded-lg p-2 shadow-md bg-white/80">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-3 py-1 bg-slate-900 text-white rounded hover:brightness-95"
          >
            {paused ? "Play" : "Pause"}
          </button>

          <button
            onClick={() =>
              setSegments((s) => Math.max(60, Math.floor(s / 1.5)))
            }
            className="px-3 py-1 bg-white border rounded hover:bg-slate-50 text-sm"
          >
            Lower detail
          </button>

          <button
            onClick={() =>
              setSegments((s) => Math.min(640, Math.floor(s * 1.5)))
            }
            className="px-3 py-1 bg-white border rounded hover:bg-slate-50 text-sm"
          >
            Raise detail
          </button>
        </div>
      </div>
    </div>
  );
}
