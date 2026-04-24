import { Canvas, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

const REVEAL_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const REVEAL_FRAGMENT_SHADER = `
  varying vec2 vUv;

  uniform sampler2D uTextMask;
  uniform sampler2D uTrail;
  uniform float uTime;
  uniform float uReveal;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
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
    float sum = 0.0;
    float amp = 0.55;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      sum += amp * noise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  vec3 nebulaColor(vec2 uv) {
    float cloudA = fbm(uv * 3.1 + vec2(-uTime * 0.05, uTime * 0.03));
    float cloudB = fbm(uv * 6.8 + vec2(uTime * 0.08, -uTime * 0.02));
    float spark = pow(max(0.0, fbm(uv * 16.0 + vec2(uTime * 0.18, uTime * 0.06)) - 0.72), 7.0);

    vec3 deep = vec3(0.05, 0.01, 0.11);
    vec3 violet = vec3(0.68, 0.24, 0.96);
    vec3 cyan = vec3(0.23, 0.56, 1.0);

    vec3 cloud = mix(deep, violet, cloudA);
    cloud += cyan * cloudB * 0.2;
    cloud += spark * vec3(1.4, 1.2, 2.0);
    return cloud;
  }

  void main() {
    float textMask = texture2D(uTextMask, vUv).a;
    float trailMask = texture2D(uTrail, vUv).r;

    float reveal = smoothstep(0.09, 0.88, trailMask * (0.35 + uReveal * 0.9));
    float alpha = textMask * reveal;

    vec3 cosmic = nebulaColor(vUv * 1.9 + vec2(-0.15, 0.08));
    gl_FragColor = vec4(cosmic, alpha);
  }
`;

interface CosmicTextRevealProps {
  active: boolean;
  lines: string[];
  wandRef: MutableRefObject<{ x: number; y: number }>;
  className?: string;
}

interface RevealPlaneProps {
  active: boolean;
  lines: string[];
  size: { width: number; height: number };
  wandRef: MutableRefObject<{ x: number; y: number }>;
}

function RevealPlane({ active, lines, size, wandRef }: RevealPlaneProps) {
  const [textTexture, trailTexture, uniforms] = useMemo(() => {
    const textCanvas = document.createElement("canvas");
    const trailCanvas = document.createElement("canvas");

    const nextTextTexture = new THREE.CanvasTexture(textCanvas);
    const nextTrailTexture = new THREE.CanvasTexture(trailCanvas);
    nextTextTexture.minFilter = THREE.LinearFilter;
    nextTextTexture.magFilter = THREE.LinearFilter;
    nextTrailTexture.minFilter = THREE.LinearFilter;
    nextTrailTexture.magFilter = THREE.LinearFilter;

    const nextUniforms = {
      uTextMask: { value: nextTextTexture },
      uTrail: { value: nextTrailTexture },
      uTime: { value: 0 },
      uReveal: { value: 0 },
    };

    return [nextTextTexture, nextTrailTexture, nextUniforms] as const;
  }, []);

  const revealAmount = useRef({ value: 0 });

  useEffect(() => {
    const tween = gsap.to(revealAmount.current, {
      value: active ? 1 : 0,
      duration: active ? 0.45 : 1.8,
      ease: active ? "power3.out" : "power2.out",
    });

    return () => {
      tween.kill();
    };
  }, [active]);

  useEffect(() => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(size.width * pixelRatio));
    const height = Math.max(1, Math.floor(size.height * pixelRatio));

    const textCanvas = textTexture.image as HTMLCanvasElement;
    const trailCanvas = trailTexture.image as HTMLCanvasElement;
    textCanvas.width = width;
    textCanvas.height = height;
    trailCanvas.width = width;
    trailCanvas.height = height;

    const textContext = textCanvas.getContext("2d");
    const trailContext = trailCanvas.getContext("2d");
    if (!textContext || !trailContext) {
      return;
    }

    textContext.clearRect(0, 0, width, height);
    textContext.save();
    textContext.scale(pixelRatio, pixelRatio);
    textContext.fillStyle = "#ffffff";
    textContext.textAlign = "center";
    textContext.textBaseline = "middle";

    let fontSize = Math.max(42, Math.floor(size.height * 0.28));
    textContext.font = `700 ${fontSize}px "Space Grotesk", sans-serif`;

    while (fontSize > 28) {
      const maxLineWidth = Math.max(...lines.map((line) => textContext.measureText(line).width));
      if (maxLineWidth <= size.width * 0.96) {
        break;
      }
      fontSize -= 4;
      textContext.font = `700 ${fontSize}px "Space Grotesk", sans-serif`;
    }

    const lineHeight = fontSize * 0.92;
    const totalHeight = lineHeight * lines.length;
    let y = (size.height - totalHeight) * 0.5 + lineHeight * 0.5;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      textContext.fillText(line, size.width * 0.5, y);
      y += lineHeight;
    }

    textContext.restore();
    trailContext.fillStyle = "rgba(0, 0, 0, 1)";
    trailContext.fillRect(0, 0, width, height);

    textTexture.needsUpdate = true;
    trailTexture.needsUpdate = true;
  }, [lines, size.height, size.width, textTexture, trailTexture]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uReveal.value = revealAmount.current.value;

    const trailCanvas = trailTexture.image as HTMLCanvasElement;
    const trailContext = trailCanvas.getContext("2d");
    if (!trailContext || trailCanvas.width === 0 || trailCanvas.height === 0) {
      return;
    }

    trailContext.fillStyle = "rgba(0, 0, 0, 0.035)";
    trailContext.fillRect(0, 0, trailCanvas.width, trailCanvas.height);

    const x = THREE.MathUtils.clamp(wandRef.current.x, 0, 1) * trailCanvas.width;
    const y = THREE.MathUtils.clamp(wandRef.current.y, 0, 1) * trailCanvas.height;
    const radius = Math.max(30, Math.min(trailCanvas.width, trailCanvas.height) * 0.16);
    const core = trailContext.createRadialGradient(x, y, 0, x, y, radius);
    core.addColorStop(0, `rgba(255, 255, 255, ${active ? 0.72 : 0.2})`);
    core.addColorStop(0.45, `rgba(214, 154, 255, ${active ? 0.35 : 0.12})`);
    core.addColorStop(1, "rgba(0, 0, 0, 0)");

    trailContext.globalCompositeOperation = "lighter";
    trailContext.fillStyle = core;
    trailContext.beginPath();
    trailContext.arc(x, y, radius, 0, Math.PI * 2);
    trailContext.fill();
    trailContext.globalCompositeOperation = "source-over";

    trailTexture.needsUpdate = true;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={REVEAL_VERTEX_SHADER}
        fragmentShader={REVEAL_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function CosmicTextReveal({ active, lines, wandRef, className = "" }: CosmicTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const bounds = element.getBoundingClientRect();
      setSize({
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      {size.width > 0 && size.height > 0 && (
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 1], zoom: 1 }}
        >
          <RevealPlane active={active} lines={lines} size={size} wandRef={wandRef} />
        </Canvas>
      )}
    </div>
  );
}
