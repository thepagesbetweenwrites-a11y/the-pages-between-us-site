import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { motion, now } from "../lib/motion";

// "The Midnight Desk": a volumetric desk-lamp beam (#D4A359) cutting across deep
// charcoal (#0A0A0C), haze drifting inside it, and ink-dust that only catches
// light where the beam passes and drifts away from the cursor.

// Shared beam geometry (screen space, aspect-corrected): lamp position and aim.
const BEAM_GLSL = /* glsl */ `
  uniform vec2 uLamp;
  uniform vec2 uAim;
  uniform float uSpread;
  float beamMask(vec2 p, out float along) {
    vec2 d = p - uLamp;
    vec2 dir = normalize(uAim - uLamp);
    along = dot(d, dir);
    float across = abs(d.x * dir.y - d.y * dir.x);
    float width = 0.04 + along * uSpread;
    float m = 1.0 - smoothstep(width * 0.55, width, across);
    m *= smoothstep(0.0, 0.18, along);
    m *= exp(-along * 0.42);
    return m;
  }
`;

const bgVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;

const bgFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uPointer;
  uniform float uScroll;
  uniform vec3 uBase;
  uniform vec3 uAmber;
  ${BEAM_GLSL}

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    float t = uTime * 0.04;

    vec3 col = uBase;
    // Faint room smoke everywhere.
    float smoke = fbm(p * 1.3 + vec2(t, -t * 0.6));
    col += vec3(0.03, 0.026, 0.024) * smoke;

    // Volumetric beam: haze is brighter where the smoke is thicker.
    float along;
    float m = beamMask(p, along);
    float haze = fbm(p * 3.2 + vec2(-t * 2.0, t * 1.2) + along * 0.6);
    float shafts = 0.65 + 0.35 * sin(along * 9.0 - uTime * 0.25 + haze * 4.0);
    float beam = m * (0.35 + 0.9 * haze) * shafts;
    col += uAmber * beam * 0.55 * (1.0 - uScroll * 0.5);

    // Hot core near the lamp head and a pool of light on the desk.
    float core = exp(-length(p - uLamp) * 4.5);
    col += uAmber * core * 0.5;
    vec2 pool = (p - uAim) * vec2(0.8, 2.2);
    col += uAmber * exp(-dot(pool, pool) * 3.0) * 0.16 * (1.0 - uScroll * 0.6);

    // A softer pool where the cursor is: the reader's own lamp.
    vec2 ptr = uPointer * 0.5 * vec2(aspect, 1.0);
    float d = length(p - ptr);
    col += uAmber * exp(-d * d * 9.0) * 0.06;

    col *= 1.0 - 0.38 * dot(p, p);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Beam() {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
      uScroll: { value: 0 },
      uBase: { value: new THREE.Color("#0A0A0C") },
      uAmber: { value: new THREE.Color("#D4A359") },
      uLamp: { value: new THREE.Vector2(-0.95, 0.62) },
      uAim: { value: new THREE.Vector2(0.35, -0.42) },
      uSpread: { value: 0.32 },
    }),
    [],
  );
  useFrame(() => {
    const u = ref.current?.uniforms as typeof uniforms | undefined;
    if (!u) return;
    const aspect = size.width / size.height;
    u.uTime.value = now();
    u.uRes.value.set(size.width, size.height);
    u.uPointer.value.lerp(new THREE.Vector2(motion.pointer.x, motion.pointer.y), 0.08);
    u.uScroll.value += (Math.min(motion.scroll * 2.5, 1) - u.uScroll.value) * 0.08;
    // Lamp hangs off the upper-left corner; the aim leans a little toward the cursor.
    u.uLamp.value.set(-0.5 * aspect - 0.12, 0.62);
    u.uAim.value.set(0.12 * aspect + motion.pointer.x * 0.12, -0.42 + motion.pointer.y * 0.06);
    u.uSpread.value = aspect < 0.8 ? 0.5 : 0.32;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={ref} vertexShader={bgVertex} fragmentShader={bgFragment} uniforms={uniforms} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

const dustVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform float uAspect;
  varying float vAlpha;
  varying float vLit;
  ${BEAM_GLSL}
  void main() {
    vec3 p = position;
    float t = uTime * (0.05 + aSeed * 0.08);
    p.x += sin(t + aSeed * 40.0) * 0.5 + uTime * 0.02 * (aSeed - 0.3);
    p.y += cos(t * 0.8 + aSeed * 17.0) * 0.4 - uTime * 0.01 * aSeed;
    p.x = mod(p.x + 11.0, 22.0) - 11.0;
    p.y = mod(p.y + 6.5, 13.0) - 6.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    // Drift away from the cursor (in screen space).
    vec2 ndc = clip.xy / clip.w;
    vec2 away = ndc - uPointer;
    float push = exp(-dot(away, away) * 18.0) * 0.09;
    ndc += normalize(away + 1e-4) * push;
    clip.xy = ndc * clip.w;
    gl_Position = clip;
    // Lit only inside the beam.
    float along;
    vec2 sp = ndc * 0.5 * vec2(uAspect, 1.0);
    vLit = beamMask(sp, along);
    float size = (1.6 + aSeed * 4.0);
    gl_PointSize = size * uPixelRatio * (10.0 / -mv.z);
    float twinkle = 0.6 + 0.4 * sin(uTime * (0.5 + aSeed) + aSeed * 50.0);
    vAlpha = twinkle * smoothstep(0.3, 2.5, -mv.z) * (1.0 - smoothstep(16.0, 26.0, -mv.z));
  }
`;

const dustFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vLit;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    a *= a;
    // Ink specks barely visible in the dark; motes glow where the lamp catches them.
    float lit = 0.06 + vLit * 1.6;
    gl_FragColor = vec4(uColor * (0.6 + vLit * 1.4), a * vAlpha * lit);
  }
`;

function InkDust({ count }: { count: number }) {
  const size = useThree((s) => s.size);
  const { geometry, uniforms } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 13;
      pos[i * 3 + 2] = -Math.random() * 20 + 3;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return {
      geometry: g,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uPointer: { value: new THREE.Vector2() },
        uAspect: { value: 1 },
        uColor: { value: new THREE.Color("#E8BE78") },
        uLamp: { value: new THREE.Vector2(-0.95, 0.62) },
        uAim: { value: new THREE.Vector2(0.35, -0.42) },
        uSpread: { value: 0.32 },
      },
    };
  }, [count]);
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    const u = mat.current?.uniforms as typeof uniforms | undefined;
    if (!u) return;
    const aspect = size.width / size.height;
    u.uTime.value = now();
    u.uAspect.value = aspect;
    u.uPointer.value.lerp(new THREE.Vector2(motion.pointer.x, motion.pointer.y), 0.15);
    u.uLamp.value.set(-0.5 * aspect - 0.12, 0.62);
    u.uAim.value.set(0.12 * aspect + motion.pointer.x * 0.12, -0.42 + motion.pointer.y * 0.06);
    u.uSpread.value = aspect < 0.8 ? 0.5 : 0.32;
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={dustVertex} fragmentShader={dustFragment} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function DeskStage() {
  const reduced = motion.reducedMotion;
  return (
    <Canvas className="webgl" dpr={[1, 1.5]} gl={{ antialias: false, alpha: false, powerPreference: "default" }} camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 6] }}>
      <color attach="background" args={["#0A0A0C"]} />
      <Beam />
      <InkDust count={reduced ? 500 : 1600} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.42} luminanceSmoothing={0.25} radius={0.8} />
        <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.34} />
        <Vignette offset={0.28} darkness={0.88} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
