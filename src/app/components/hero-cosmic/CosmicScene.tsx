import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import starSpriteUrl from "../../../../MEDIA/Star2.png";

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
  uniform float uFocus;

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
    vec2 drift = uPointer * 0.18;

    float t = uTime * 0.05;
    float cloudA = fbm(uv * 1.9 + drift + vec2(-t, t * 0.7));
    float cloudB = fbm(uv * 3.8 - drift * 0.7 + vec2(t * 0.8, -t * 0.4));
    float field = smoothstep(0.12, 0.95, cloudA + cloudB * 0.45);

    float stars = pow(max(0.0, fbm(uv * 10.0 + vec2(t * 2.2, -t * 1.3)) - 0.74), 7.0);
    float bloom = pow(stars, 0.65) * (0.75 + uFocus * 0.6);

    vec3 space = vec3(0.015, 0.01, 0.05);
    vec3 violet = vec3(0.28, 0.08, 0.52);
    vec3 magenta = vec3(0.65, 0.22, 0.86);
    vec3 cyan = vec3(0.18, 0.52, 0.96);

    vec3 color = mix(space, violet, field);
    color = mix(color, magenta, cloudB * 0.35);
    color += cyan * cloudA * (0.12 + uFocus * 0.1);
    color += vec3(1.1, 0.95, 1.55) * bloom;

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface CosmicSceneProps {
  interactive: boolean;
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  mode?: "full" | "asset";
  active?: boolean;
}

interface SharedPointerProps {
  pointerRef: MutableRefObject<{ x: number; y: number }>;
}

function NebulaPlane({ pointerRef, interactive }: SharedPointerProps & { interactive: boolean }) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uFocus: { value: 0 },
    }),
    [],
  );
  const pointerVector = useMemo(() => new THREE.Vector2(0, 0), []);

  useEffect(() => {
    const tween = gsap.to(uniforms.uFocus, {
      value: interactive ? 1 : 0,
      duration: 1.1,
      ease: "power3.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [interactive, uniforms.uFocus]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    pointerVector.set(pointerRef.current.x, pointerRef.current.y);
    uniforms.uPointer.value.lerp(pointerVector, 0.08);
  });

  return (
    <mesh position={[0, 0.6, -4]} scale={[24, 13, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={NEBULA_VERTEX_SHADER}
        fragmentShader={NEBULA_FRAGMENT_SHADER}
      />
    </mesh>
  );
}

function StardustField({ pointerRef }: SharedPointerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positionAttributeRef = useRef<THREE.BufferAttribute>(null);
  const starTexture = useMemo(() => new THREE.TextureLoader().load(starSpriteUrl), []);

  const { positions, basePositions, seeds } = useMemo(() => {
    const count = 1400;
    const nextPositions = new Float32Array(count * 3);
    const nextBasePositions = new Float32Array(count * 3);
    const nextSeeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const stride = index * 3;
      const radius = 2.2 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * 0.5 * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      nextPositions[stride] = x;
      nextPositions[stride + 1] = y;
      nextPositions[stride + 2] = z;
      nextBasePositions[stride] = x;
      nextBasePositions[stride + 1] = y;
      nextBasePositions[stride + 2] = z;
      nextSeeds[index] = Math.random() * Math.PI * 2;
    }

    return {
      positions: nextPositions,
      basePositions: nextBasePositions,
      seeds: nextSeeds,
    };
  }, []);

  useFrame((state, delta) => {
    const attribute = positionAttributeRef.current;
    if (!attribute) {
      return;
    }

    const time = state.clock.getElapsedTime();
    const pointerX = pointerRef.current.x * 4;
    const pointerY = pointerRef.current.y * 2.2;

    for (let index = 0; index < seeds.length; index += 1) {
      const stride = index * 3;
      const seed = seeds[index];

      const baseX = basePositions[stride];
      const baseY = basePositions[stride + 1];
      const baseZ = basePositions[stride + 2];

      const orbit = Math.sin(time * 0.45 + seed) * 0.18;
      let targetX = baseX + orbit;
      let targetY = baseY + Math.cos(time * 0.35 + seed * 0.8) * 0.12;
      const targetZ = baseZ + Math.sin(time * 0.3 + seed * 1.7) * 0.16;

      const dx = pointerX - positions[stride];
      const dy = pointerY - positions[stride + 1];
      const distance = dx * dx + dy * dy + 0.1;
      const pull = Math.min(0.16, 0.45 / distance);
      targetX += dx * pull;
      targetY += dy * pull;

      positions[stride] += (targetX - positions[stride]) * (0.05 + delta * 2);
      positions[stride + 1] += (targetY - positions[stride + 1]) * (0.05 + delta * 2);
      positions[stride + 2] += (targetZ - positions[stride + 2]) * (0.045 + delta * 1.8);
    }

    attribute.needsUpdate = true;

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute ref={positionAttributeRef} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d8c4ff"
        map={starTexture}
        alphaMap={starTexture}
        size={0.072}
        sizeAttenuation
        transparent
        alphaTest={0.08}
        depthWrite={false}
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function VehicleModel({ interactive }: { interactive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const focus = useRef({ value: 0 });

  useEffect(() => {
    const tween = gsap.to(focus.current, {
      value: interactive ? 1 : 0,
      duration: 1.1,
      ease: "power3.inOut",
    });

    return () => {
      tween.kill();
    };
  }, [interactive]);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      "/models/cosmic-car.glb",
      (gltf) => {
        if (cancelled) {
          return;
        }

        const prepared = gltf.scene.clone(true);
        prepared.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.envMapIntensity = 1.45;
              child.material.metalness = Math.max(child.material.metalness, 0.35);
              child.material.roughness = Math.min(child.material.roughness, 0.42);
            }
          }
        });

        setModel(prepared);
      },
      undefined,
      () => {
        if (!cancelled) {
          setModel(null);
        }
      },
    );

    return () => {
      cancelled = true;
      dracoLoader.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const t = focus.current.value;
    const time = performance.now() * 0.0011;
    const idleY = Math.sin(time) * 0.03 - 0.25;
    const activeY = -0.16;
    const targetY = THREE.MathUtils.lerp(idleY, activeY, t);
    const targetZ = THREE.MathUtils.lerp(0, 0.32, t);
    const targetScale = THREE.MathUtils.lerp(1.15, 1.34, t);
    const rotationSpeed = THREE.MathUtils.lerp(0.25, 0.06, t);

    groupRef.current.rotation.y += delta * rotationSpeed;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.08;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.08;
    groupRef.current.scale.setScalar(targetScale);
  });

  return (
    <group ref={groupRef} position={[0, -0.22, 0]}>
      {model ? (
        <primitive object={model} />
      ) : (
        <group>
          <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.85, 0.45, 0.88]} />
            <meshPhysicalMaterial
              color="#4d1f6e"
              roughness={0.22}
              metalness={0.9}
              clearcoat={1}
              clearcoatRoughness={0.12}
            />
          </mesh>
          <mesh position={[0, 0.45, -0.02]} castShadow receiveShadow>
            <boxGeometry args={[1.05, 0.34, 0.78]} />
            <meshPhysicalMaterial color="#2e0f44" roughness={0.16} metalness={0.88} clearcoat={1} />
          </mesh>
          {[-0.66, 0.66].map((x) =>
            [-0.43, 0.43].map((z) => (
              <mesh key={`${x}-${z}`} position={[x, -0.17, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.18, 0.22, 24]} />
                <meshStandardMaterial color="#111111" roughness={0.72} metalness={0.2} />
              </mesh>
            )),
          )}
        </group>
      )}
    </group>
  );
}

function CameraRig({ interactive }: { interactive: boolean }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const target = useRef({ x: 0, y: 0.15, z: 0 });

  useEffect(() => {
    const cameraTween = gsap.to(camera.position, {
      x: interactive ? 0.28 : 0,
      y: interactive ? 0.7 : 1.1,
      z: interactive ? 2.45 : 6.7,
      duration: 1.75,
      ease: "power2.inOut",
    });

    const targetTween = gsap.to(target.current, {
      x: 0,
      y: interactive ? 0.18 : 0.15,
      z: 0,
      duration: 1.75,
      ease: "power2.inOut",
    });

    return () => {
      cameraTween.kill();
      targetTween.kill();
    };
  }, [camera.position, interactive]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    controls.enabled = interactive;
    controls.target.set(target.current.x, target.current.y, target.current.z);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={interactive}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.6}
      maxDistance={4.2}
      maxPolarAngle={Math.PI * 0.62}
      minPolarAngle={Math.PI * 0.28}
    />
  );
}

function CosmicWorld({
  interactive,
  pointerRef,
  mode = "full",
}: {
  interactive: boolean;
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  mode?: "full" | "asset";
}) {
  const showWorldLayers = mode === "full";

  return (
    <>
      {showWorldLayers && <fog attach="fog" args={["#04030a", 5, 22]} />}
      <ambientLight intensity={0.22} />
      <directionalLight position={[2.5, 4, 3]} intensity={0.8} color="#e0d1ff" />
      <directionalLight position={[-3, 1.8, -2]} intensity={0.3} color="#7a4bcf" />

      {showWorldLayers && <NebulaPlane pointerRef={pointerRef} interactive={interactive} />}
      {showWorldLayers && <StardustField pointerRef={pointerRef} />}
      <VehicleModel interactive={interactive} />
      <Environment preset="night" blur={0.82} />
      <CameraRig interactive={interactive} />
    </>
  );
}

export function CosmicScene({ interactive, pointerRef, mode = "full", active = true }: CosmicSceneProps) {
  return (
    <div className="absolute inset-0" style={{ pointerEvents: interactive && active ? "auto" : "none" }}>
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 1.1, 6.7], fov: 42, near: 0.1, far: 60 }}
      >
        <CosmicWorld interactive={interactive} pointerRef={pointerRef} mode={mode} />
      </Canvas>
    </div>
  );
}
