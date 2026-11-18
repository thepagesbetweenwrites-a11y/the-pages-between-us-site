import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { now } from "../lib/motion";

// A textured plane that "bleeds" in like ink soaking into paper as the camera
// approaches: noise-thresholded reveal + a blur that tightens into crisp text.
const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uReveal;
  uniform float uTime;
  uniform vec3 uInk;
  uniform vec3 uGlow;
  uniform float uOpacity;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    float spread = (1.0 - uReveal) * 0.018;
    vec2 wob = vec2(fbm(vUv * 9.0 + uTime * 0.15), fbm(vUv * 9.0 - uTime * 0.12)) - 0.5;
    vec2 uv = vUv + wob * spread * 2.0;
    // Soft blur that collapses as the ink settles.
    float a = 0.0;
    a += texture2D(uMap, uv).a * 0.28;
    a += texture2D(uMap, uv + vec2(spread, 0.0)).a * 0.12;
    a += texture2D(uMap, uv - vec2(spread, 0.0)).a * 0.12;
    a += texture2D(uMap, uv + vec2(0.0, spread)).a * 0.12;
    a += texture2D(uMap, uv - vec2(0.0, spread)).a * 0.12;
    a += texture2D(uMap, uv + vec2(spread, spread) * 2.0).a * 0.08;
    a += texture2D(uMap, uv - vec2(spread, spread) * 2.0).a * 0.08;
    a += texture2D(uMap, uv + vec2(-spread, spread) * 2.0).a * 0.08;
    a = min(a * (1.0 + (1.0 - uReveal) * 0.8), 1.0);

    // Noise-front reveal: ink arrives in blotches, not as a uniform fade.
    float n = fbm(vUv * vec2(6.0, 3.0) + 2.0);
    float front = smoothstep(uReveal - 0.18, uReveal + 0.02, n * 0.85 + 0.1);
    float mask = (1.0 - front);
    float rim = smoothstep(0.0, 0.25, mask) * (1.0 - smoothstep(0.25, 0.9, mask));

    vec3 col = mix(uInk, uGlow, rim * 0.8);
    float alpha = a * mask * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col * (1.0 + rim * 0.9), alpha);
  }
`;

interface Props {
  texture: THREE.Texture;
  aspect: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Distances (camera→object, along z) at which the reveal starts and completes. */
  revealFrom?: number;
  revealTo?: number;
  ink?: string;
  glow?: string;
  opacity?: number;
}

export function InkText({
  texture,
  aspect,
  height,
  position,
  rotation = [0, 0, 0],
  revealFrom = 16,
  revealTo = 6,
  ink = "#f1e4cc",
  glow = "#D4A359",
  opacity = 1,
}: Props) {
  const camera = useThree((s) => s.camera);
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uReveal: { value: 0 },
      uTime: { value: 0 },
      uInk: { value: new THREE.Color(ink) },
      uGlow: { value: new THREE.Color(glow) },
      uOpacity: { value: opacity },
    }),
    [texture, ink, glow, opacity],
  );

  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, delta) => {
    const u = mat.current?.uniforms as typeof uniforms | undefined;
    if (!u) return;
    const dz = camera.position.z - position[2];
    const target = THREE.MathUtils.clamp((revealFrom - dz) / (revealFrom - revealTo), 0, 1);
    // Fade back out once the camera has flown past.
    const past = THREE.MathUtils.clamp(1 + dz / 1.5, 0, 1);
    // Time-based easing (~1.2s to settle) so slow devices still finish the bleed.
    const k = 1 - Math.pow(0.03, Math.min(delta, 0.25));
    u.uReveal.value += (target - u.uReveal.value) * k;
    u.uOpacity.value = opacity * past;
    u.uTime.value = now();
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[height * aspect, height]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
