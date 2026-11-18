import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { setState, useUI } from "../lib/store";
import type { ArtifactId } from "../lib/store";

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const glowFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform vec2 uSize;
  uniform float uPad;
  void main() {
    // Signed distance to the paper's rectangle -> soft halo.
    vec2 p = (vUv - 0.5) * (uSize + uPad * 2.0);
    vec2 q = abs(p) - uSize * 0.5;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    // Feather to exactly zero before the plane's border so no rectangle edge shows.
    float halo = exp(-max(d, 0.0) * 9.0) * step(0.0, d + 0.002) * (1.0 - smoothstep(uPad * 0.55, uPad * 0.95, d));
    float k = min(uIntensity, 0.9);
    gl_FragColor = vec4(uColor * k, halo * k);
  }
`;

interface Props {
  id: ArtifactId;
  texture: THREE.Texture;
  aspect: number;
  width: number;
  position: [number, number, number];
  rotation: [number, number, number];
  /** sRGB paper brightness (0..1). Keeps the brightest paper below the Bloom threshold. */
  brightness?: number;
  /** Camera distance (z) where the artifact starts fading in, and over how many units. */
  fadeStart?: number;
  fadeLen?: number;
}

// Rim glow: amber's linear luminance is ~0.41, so even the hover peak (0.9) stays under
// the 0.6 Bloom threshold: a soft warm rim, never a blown-out halo.
const GLOW = { idle: 0.2, hover: 0.9, inspect: 0.5 };

const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

export function Artifact({ id, texture, aspect, width, position, rotation, brightness = 0.84, fadeStart = 17, fadeLen = 6 }: Props) {
  const group = useRef<THREE.Group>(null);
  const paper = useRef<THREE.MeshBasicMaterial>(null);
  const paperColor = useMemo(() => new THREE.Color().setRGB(brightness, brightness, brightness, THREE.SRGBColorSpace), [brightness]);
  const glow = useRef<THREE.ShaderMaterial>(null);
  const tilt = useRef(new THREE.Vector2());
  const [hovered, setHovered] = useState(false);
  const inspect = useUI((s) => s.inspect);
  const isInspected = inspect === id;
  const camera = useThree((s) => s.camera);
  const height = width / aspect;
  const pad = 0.35;

  const glowUniforms = useMemo(
    () => ({
      uIntensity: { value: GLOW.idle },
      uColor: { value: new THREE.Color("#D4A359") },
      uSize: { value: new THREE.Vector2(width, height) },
      uPad: { value: pad },
    }),
    [width, height],
  );
  const base = useMemo(
    () => ({
      pos: new THREE.Vector3(...position),
      quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    }),
    [position, rotation],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const k = 1 - Math.pow(0.0015, delta);

    if (isInspected) {
      // Bring the artifact in front of the camera, facing it, sized to fit.
      const dist = 2.3;
      camera.getWorldDirection(tmpV);
      const target = tmpV.multiplyScalar(dist).add(camera.position);
      g.position.lerp(target, k);
      tmpQ.copy(camera.quaternion);
      tmpE.set(tilt.current.y * 0.25, tilt.current.x * 0.35, 0);
      tmpQ.multiply(new THREE.Quaternion().setFromEuler(tmpE));
      g.quaternion.slerp(tmpQ, k);
      const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
      const fit = Math.min((vh * 0.72) / height, (vh * (state.size.width / state.size.height) * 0.6) / width);
      g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, fit, k));
    } else {
      // Float in place with a slow bob; tilt toward the cursor when hovered.
      tmpV.copy(base.pos);
      tmpV.y += Math.sin(t * 0.8 + base.pos.z) * 0.12;
      g.position.lerp(tmpV, k);
      tmpE.set(
        Math.sin(t * 0.5 + base.pos.x) * 0.05 + (hovered ? -tilt.current.y * 0.35 : 0),
        Math.cos(t * 0.4 + base.pos.z) * 0.08 + (hovered ? tilt.current.x * 0.45 : 0),
        0,
      );
      tmpQ.copy(base.quat).multiply(new THREE.Quaternion().setFromEuler(tmpE));
      g.quaternion.slerp(tmpQ, k);
      g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, inspect ? 0.85 : hovered ? 1.06 : 1, k));
    }
    // Distance fade (replaces fog): appear out of the dark, vanish once passed.
    const dz = camera.position.z - base.pos.z;
    const vis = isInspected ? 1 : THREE.MathUtils.clamp((fadeStart - dz) / fadeLen, 0, 1) * THREE.MathUtils.clamp(1 + dz / 1.2, 0, 1);
    if (paper.current) {
      paper.current.opacity = vis;
      paper.current.visible = vis > 0.01;
    }
    const glowTarget = (isInspected ? GLOW.inspect : hovered ? GLOW.hover : GLOW.idle) * vis;
    const gu = glow.current?.uniforms as typeof glowUniforms | undefined;
    if (gu) gu.uIntensity.value += (glowTarget - gu.uIntensity.value) * k;
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return;
    tilt.current.set((e.uv.x - 0.5) * 2, (e.uv.y - 0.5) * 2);
  };

  return (
    <group ref={group} position={position} name={`artifact-${id}`}>
      <mesh position={[0, 0, -0.02]} renderOrder={1}>
        <planeGeometry args={[width + pad * 2, height + pad * 2]} />
        <shaderMaterial
          ref={glow}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh
        renderOrder={2}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          tilt.current.set(0, 0);
          document.body.style.cursor = "";
        }}
        onPointerMove={onMove}
        onClick={(e) => {
          e.stopPropagation();
          setState({ inspect: isInspected ? null : id });
        }}
      >
        <planeGeometry args={[width, height]} />
        {/* Unlit: the lantern no longer pushes the paper into Bloom, so ink stays crisp on hover. */}
        <meshBasicMaterial ref={paper} map={texture} color={paperColor} side={THREE.DoubleSide} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
