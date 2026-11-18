import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, MAX_RIPPLES, now } from "../lib/motion";
import type { InkState } from "../components/InkTransition";

// Full-screen charcoal field with domain-warped "lantern smoke", an amber pool
// that follows the cursor, and expanding light ripples left by cursor motion.
const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uPointer;
  uniform vec2 uPointerVel;
  uniform float uScroll;
  uniform float uVelocity;
  uniform float uInk;
  uniform vec2 uInkOrigin;
  uniform vec3 uRipples[${MAX_RIPPLES}];
  uniform vec3 uBase;
  uniform vec3 uAmber;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 ptr = uPointer * 0.5 * vec2(aspect, 1.0);

    float t = uTime * 0.05 + uScroll * 1.8;
    // Domain warp, nudged by cursor velocity so the smoke "follows" the hand.
    vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t)), fbm(p * 1.6 + vec2(5.2, -t)));
    vec2 flow = uPointerVel * 0.02 * exp(-3.0 * length(p - ptr));
    vec2 r = vec2(fbm(p * 2.2 + 3.0 * q + vec2(1.7, 9.2) + t * 0.6 - flow * 4.0),
                  fbm(p * 2.2 + 3.0 * q + vec2(8.3, 2.8) - t * 0.4 + flow * 4.0));
    float smoke = fbm(p * 1.4 + 2.6 * r);

    vec3 col = uBase;
    col += vec3(0.055, 0.045, 0.04) * smoke;
    col += uAmber * 0.10 * pow(smoke, 3.0) * (0.6 + uVelocity * 0.8);

    // Lantern pool at the cursor.
    float d = length(p - ptr);
    float pool = exp(-d * d * 7.0);
    col += uAmber * pool * (0.16 + 0.10 * smoke);

    // Ripples: thin rings expanding from recent cursor positions.
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec3 rp = uRipples[i];
      if (rp.z <= 0.0) continue;
      float age = uTime - rp.z;
      if (age < 0.0 || age > 3.2) continue;
      vec2 c = rp.xy * 0.5 * vec2(aspect, 1.0);
      float dist = length(p - c);
      float radius = age * 0.32;
      float ring = exp(-pow((dist - radius) * 38.0, 2.0));
      float fade = (1.0 - age / 3.2);
      col += uAmber * ring * fade * fade * 0.55 * (0.7 + 0.6 * smoke);
    }

    // Ink flood used by the reader transition: a ragged blot spreading
    // outward from the click point (uInkOrigin) as uInk goes 0 -> 1.3.
    vec2 io = uInkOrigin * 0.5 * vec2(aspect, 1.0);
    float inkEdge = fbm(p * 4.0 + uTime * 0.25) - 0.5;
    float R = uInk * 1.7;
    float inkD = length(p - io) + inkEdge * 0.22 * (0.4 + uInk);
    float ink = 1.0 - smoothstep(R - 0.06, R + 0.03, inkD);
    vec3 inkCol = vec3(0.012, 0.012, 0.016) + uAmber * 0.05 * smoothstep(R - 0.12, R, inkD);
    col = mix(col, inkCol, ink * step(0.001, uInk));

    // Gentle radial falloff toward the edges.
    col *= 1.0 - 0.35 * dot(p, p);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function FluidBackground({ ink }: { ink: InkState }) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const tmp = useMemo(() => new THREE.Vector2(), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
      uPointerVel: { value: new THREE.Vector2() },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
      uInk: { value: 0 },
      uInkOrigin: { value: new THREE.Vector2() },
      uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector3(0, 0, -1)) },
      uBase: { value: new THREE.Color("#0A0A0C") },
      uAmber: { value: new THREE.Color("#D4A359") },
    }),
    [],
  );

  useFrame(() => {
    // R3F copies the `uniforms` prop into the material, so always write to the live one.
    const u = ref.current?.uniforms as typeof uniforms | undefined;
    if (!u) return;
    u.uTime.value = now();
    u.uRes.value.set(size.width, size.height);
    u.uPointer.value.lerp(tmp.set(motion.pointer.x, motion.pointer.y), 0.12);
    u.uPointerVel.value.set(motion.pointerVel.x, motion.pointerVel.y);
    motion.pointerVel.x *= 0.92;
    motion.pointerVel.y *= 0.92;
    u.uScroll.value = motion.scroll;
    u.uVelocity.value += (Math.min(Math.abs(motion.velocity) / 40, 1) - u.uVelocity.value) * 0.08;
    u.uInk.value = ink.current;
    u.uInkOrigin.value.set(ink.x, ink.y);
    const rs = motion.ripples;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const r = rs[i];
      if (r) u.uRipples.value[i].set(r.x, r.y, r.t);
      else u.uRipples.value[i].set(0, 0, -1);
    }
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
