import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, now } from "../lib/motion";

// Volumetric dust drifting through lantern light along the whole camera path.
const vertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uVelocity;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.08 + aSeed * 0.12);
    p.x += sin(t + aSeed * 40.0) * 0.6;
    p.y += cos(t * 0.8 + aSeed * 17.0) * 0.5 + sin(uTime * 0.05 + aSeed * 6.0) * 0.3;
    p.z += sin(t * 0.6 + aSeed * 3.0) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (2.0 + aSeed * 5.0) * (1.0 + uVelocity * 0.6);
    gl_PointSize = size * uPixelRatio * (12.0 / -mv.z);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0);
    float fadeNear = smoothstep(0.3, 2.5, -mv.z);
    float fadeFar = 1.0 - smoothstep(18.0, 34.0, -mv.z);
    vAlpha = twinkle * fadeNear * fadeFar;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor * 1.6, a * vAlpha * 0.85);
  }
`;

export function DustMotes({ count = 1400, zStart = 8, zEnd = -70 }) {
  const { geometry, uniforms } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 13;
      pos[i * 3 + 2] = zEnd + Math.random() * (zStart - zEnd);
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return {
      geometry: g,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uVelocity: { value: 0 },
        uColor: { value: new THREE.Color("#D4A359") },
      },
    };
  }, [count, zStart, zEnd]);

  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    const u = mat.current?.uniforms as typeof uniforms | undefined;
    if (!u) return;
    u.uTime.value = now();
    u.uVelocity.value += (Math.min(Math.abs(motion.velocity) / 40, 1) - u.uVelocity.value) * 0.06;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
