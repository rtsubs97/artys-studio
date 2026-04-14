import { Canvas, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import starSpriteUrl from "../../../MEDIA/Star2.png";

const NEBULA_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = `
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uPointer;

  float hash(vec2 p) {
    p = fract(p * vec2(123.4, 456.7));
    p += dot(p, p + 78.23);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      total += amp * noise(p * freq);
      amp *= 0.52;
      freq *= 2.0;
    }
    return total;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    vec2 drift = uPointer * 0.12;
    float t = uTime * 0.05;

    float cloudA = fbm(uv * 1.8 + drift + vec2(-t, t * 0.7));
    float cloudB = fbm(uv * 3.9 - drift * 0.5 + vec2(t * 0.8, -t * 0.4));
    float field = smoothstep(0.1, 0.95, cloudA + cloudB * 0.5);

    float stars = pow(max(0.0, fbm(uv * 10.0 + vec2(t * 2.2, -t * 1.3)) - 0.75), 7.0);
    float bloom = pow(stars, 0.62);

    vec3 space = vec3(0.01, 0.008, 0.035);
    vec3 violet = vec3(0.22, 0.08, 0.48);
    vec3 magenta = vec3(0.58, 0.2, 0.82);
    vec3 cyan = vec3(0.16, 0.5, 0.92);

    vec3 color = mix(space, violet, field);
    color = mix(color, magenta, cloudB * 0.38);
    color += cyan * cloudA * 0.13;
    color += vec3(1.1, 1.0, 1.6) * bloom;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function NebulaLayer({ pointerRef }: { pointerRef: MutableRefObject<{ x: number; y: number }> }) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    [],
  );
  const pointerVector = useMemo(() => new THREE.Vector2(0, 0), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    pointerVector.set(pointerRef.current.x, pointerRef.current.y);
    uniforms.uPointer.value.lerp(pointerVector, 0.08);
  });

  return (
    <mesh position={[0, 0, -4]} scale={[24, 14, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={NEBULA_VERTEX_SHADER} fragmentShader={NEBULA_FRAGMENT_SHADER} />
    </mesh>
  );
}

function StardustLayer({ pointerRef }: { pointerRef: MutableRefObject<{ x: number; y: number }> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const attributeRef = useRef<THREE.BufferAttribute>(null);
  const starTexture = useMemo(() => new THREE.TextureLoader().load(starSpriteUrl), []);

  const { positions, basePositions, seeds } = useMemo(() => {
    const count = 1200;
    const nextPositions = new Float32Array(count * 3);
    const nextBase = new Float32Array(count * 3);
    const nextSeeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const stride = i * 3;
      const radius = 2 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * 0.6 * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      nextPositions[stride] = x;
      nextPositions[stride + 1] = y;
      nextPositions[stride + 2] = z;
      nextBase[stride] = x;
      nextBase[stride + 1] = y;
      nextBase[stride + 2] = z;
      nextSeeds[i] = Math.random() * Math.PI * 2;
    }

    return { positions: nextPositions, basePositions: nextBase, seeds: nextSeeds };
  }, []);

  useFrame((state, delta) => {
    const attribute = attributeRef.current;
    if (!attribute) {
      return;
    }

    const time = state.clock.getElapsedTime();
    const pointerX = pointerRef.current.x * 3.6;
    const pointerY = pointerRef.current.y * 2.4;

    for (let i = 0; i < seeds.length; i += 1) {
      const stride = i * 3;
      const seed = seeds[i];

      const baseX = basePositions[stride];
      const baseY = basePositions[stride + 1];
      const baseZ = basePositions[stride + 2];

      let tx = baseX + Math.sin(time * 0.5 + seed) * 0.16;
      let ty = baseY + Math.cos(time * 0.35 + seed * 0.7) * 0.1;
      const tz = baseZ + Math.sin(time * 0.28 + seed * 1.4) * 0.14;

      const dx = pointerX - positions[stride];
      const dy = pointerY - positions[stride + 1];
      const dist = dx * dx + dy * dy + 0.14;
      const pull = Math.min(0.14, 0.36 / dist);
      tx += dx * pull;
      ty += dy * pull;

      positions[stride] += (tx - positions[stride]) * (0.05 + delta * 2.0);
      positions[stride + 1] += (ty - positions[stride + 1]) * (0.05 + delta * 2.0);
      positions[stride + 2] += (tz - positions[stride + 2]) * (0.045 + delta * 1.8);
    }

    attribute.needsUpdate = true;
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute ref={attributeRef} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d8c4ff"
        map={starTexture}
        alphaMap={starTexture}
        size={0.07}
        sizeAttenuation
        transparent
        alphaTest={0.08}
        depthWrite={false}
        opacity={0.88}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CosmicContent({ pointerRef }: { pointerRef: MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <fog attach="fog" args={["#04030a", 4, 20]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[2.5, 3.5, 2.8]} intensity={0.5} color="#d5b8ff" />
      <NebulaLayer pointerRef={pointerRef} />
      <StardustLayer pointerRef={pointerRef} />
    </>
  );
}

export function GlobalCosmicBackdrop() {
  const pointerRef = useRef({ x: 0, y: 0 });
  const settersRef = useRef<{ x?: (value: number) => void; y?: (value: number) => void }>({});

  useEffect(() => {
    settersRef.current.x = gsap.quickTo(pointerRef.current, "x", { duration: 0.48, ease: "power3.out" });
    settersRef.current.y = gsap.quickTo(pointerRef.current, "y", { duration: 0.48, ease: "power3.out" });

    const update = (clientX: number, clientY: number) => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const x = (clientX / width) * 2 - 1;
      const y = -((clientY / height) * 2 - 1);
      settersRef.current.x?.(x);
      settersRef.current.y?.(y);
    };

    const onMouseMove = (event: MouseEvent) => update(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        update(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.55, 6], fov: 42, near: 0.1, far: 50 }}
      >
        <CosmicContent pointerRef={pointerRef} />
      </Canvas>
    </div>
  );
}
