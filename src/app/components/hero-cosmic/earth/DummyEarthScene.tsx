import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EARTH_DEVELOPER_CONFIG } from "./earthDevConfig";
import { EARTH_LOCATION_POINTS } from "./earthLocations";

interface DummyEarthSceneProps {
  interactive: boolean;
  active?: boolean;
  onInteractionChange?: (next: boolean) => void;
}

type MarkerSprite = THREE.Sprite & {
  userData: {
    name: string;
    clientsServed: number;
    stagger: number;
    baseScale: number;
  };
};

const DAY_TEXTURE_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg";
const NIGHT_TEXTURE_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png";

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(96, 96, 0, 96, 96, 96);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.12, "rgba(255, 245, 214, 0.98)");
  gradient.addColorStop(0.3, "rgba(255, 120, 200, 0.9)");
  gradient.addColorStop(0.58, "rgba(136, 70, 255, 0.5)");
  gradient.addColorStop(1, "rgba(136, 70, 255, 0.0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 192, 192);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(128, 128, 16, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,0.0)");
  gradient.addColorStop(0.28, "rgba(180,130,255,0.0)");
  gradient.addColorStop(0.55, "rgba(176, 115, 255, 0.28)");
  gradient.addColorStop(0.75, "rgba(120, 90, 255, 0.2)");
  gradient.addColorStop(1, "rgba(120, 90, 255, 0.0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function DummyEarthScene({ interactive, active = true, onInteractionChange }: DummyEarthSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const interactiveRef = useRef(interactive);
  const activeRef = useRef(active);
  const onInteractionChangeRef = useRef(onInteractionChange);
  const pageVisibleRef = useRef(typeof document === "undefined" ? true : !document.hidden);

  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onInteractionChangeRef.current = onInteractionChange;
  }, [onInteractionChange]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip) {
      return;
    }

    const scene = new THREE.Scene();
    const clock = new THREE.Clock();

    const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isTouchLike = isMobileViewport || isCoarsePointer;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 1000);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isTouchLike,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchLike ? 1.2 : 1.75));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = isTouchLike ? 0.08 : 0.05;
    controls.rotateSpeed = isTouchLike ? 0.72 : 0.9;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;

    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load(DAY_TEXTURE_URL);
    const nightTexture = textureLoader.load(NIGHT_TEXTURE_URL);

    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: new THREE.Vector3(1, 0.2, 0).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec3 dayColor = texture2D(dayTexture, vUv).rgb;
          vec3 lightMap = texture2D(nightTexture, vUv).rgb;

          vec3 ambientNight = dayColor * vec3(0.02, 0.04, 0.12);
          vec3 sharpLights = pow(lightMap, vec3(3.0));
          vec3 cityLights = sharpLights * vec3(1.0, 0.85, 0.5) * 8.0;
          vec3 nightColor = ambientNight + cityLights;

          float intensity = dot(normalize(vNormal), sunDirection);
          float mixFactor = smoothstep(-0.2, 0.2, intensity);

          vec3 finalColor = mix(nightColor, dayColor, mixFactor);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const radius = 1;
    const geometry = new THREE.SphereGeometry(radius, isTouchLike ? 44 : 64, isTouchLike ? 44 : 64);
    const earth = new THREE.Mesh(geometry, earthMaterial);
    earth.rotation.z = (EARTH_DEVELOPER_CONFIG.axialTiltDeg * Math.PI) / 180;
    scene.add(earth);

    earthMaterial.uniforms.sunDirection.value.set(-EARTH_DEVELOPER_CONFIG.sunPosition, 0.2, 0).normalize();

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
    atmosphere.scale.set(1.15, 1.15, 1.15);
    scene.add(atmosphere);

    const glowTexture = createGlowTexture();
    const haloTexture = createHaloTexture();
    const markerSprites: MarkerSprite[] = [];
    const markerHalos: THREE.Sprite[] = [];

    EARTH_LOCATION_POINTS.forEach((client) => {
      const surfacePosition = latLonToVector3(client.lat, client.lon, radius + (isTouchLike ? 0.055 : 0.05));
      const normal = surfacePosition.clone().normalize();
      const corePosition = surfacePosition.clone();
      const haloPosition = surfacePosition.clone().addScaledVector(normal, 0.012);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: "#fff6dc",
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMaterial) as MarkerSprite;
  const baseScale = isTouchLike ? 0.13 : 0.115;
  sprite.position.copy(corePosition);
      sprite.scale.set(baseScale, baseScale, baseScale);
      sprite.renderOrder = 12;
      sprite.userData = {
        name: client.name,
        clientsServed: client.clientsServed,
        stagger: Math.random() * Math.PI * 2,
        baseScale,
      };

      const haloMaterial = new THREE.SpriteMaterial({
        map: haloTexture,
        color: "#9f84ff",
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const halo = new THREE.Sprite(haloMaterial);
      halo.position.copy(haloPosition);
      halo.scale.set(baseScale * 1.9, baseScale * 1.9, baseScale * 1.9);
      halo.renderOrder = 11;

      earth.add(sprite);
      earth.add(halo);
      markerSprites.push(sprite);
      markerHalos.push(halo);
    });

    if (!EARTH_DEVELOPER_CONFIG.markersEnabled) {
      markerSprites.forEach((sprite) => {
        sprite.visible = false;
      });
      markerHalos.forEach((halo) => {
        halo.visible = false;
      });
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredSprite: MarkerSprite | null = null;
    let selectedSprite: MarkerSprite | null = null;
    let frameCount = 0;
    let elapsed = 0;
    let animationFrame = 0;
    let lastClientX = window.innerWidth * 0.5;
    let lastClientY = window.innerHeight * 0.5;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const showTooltipForSprite = (sprite: MarkerSprite, clientX: number, clientY: number) => {
      const data = sprite.userData;
      tooltip.innerHTML = `<h3>${data.name}</h3><p>${data.clientsServed} Clients Served</p>`;
      tooltip.style.left = `${clientX}px`;
      tooltip.style.top = `${clientY}px`;
      tooltip.style.transform = "translate(-50%, -120%)";
      tooltip.style.opacity = "1";
    };

    const hideTooltip = () => {
      tooltip.style.opacity = "0";
    };

    const onMouseMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY);
      lastClientX = event.clientX;
      lastClientY = event.clientY;
      if (!isTouchLike) {
        tooltip.style.left = `${event.clientX}px`;
        tooltip.style.top = `${event.clientY}px`;
        tooltip.style.transform = "translate(-50%, -120%)";
      }
    };

    const onPointerDown = () => {
      if (!interactiveRef.current) {
        onInteractionChangeRef.current?.(true);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!isTouchLike || !EARTH_DEVELOPER_CONFIG.markersEnabled) {
        return;
      }

      updatePointer(event.clientX, event.clientY);
      raycaster.setFromCamera(mouse, camera);
      const intersections = raycaster.intersectObjects(markerSprites);

      if (intersections.length > 0 && intersections[0]?.object.visible) {
        selectedSprite = intersections[0].object as MarkerSprite;
        showTooltipForSprite(selectedSprite, event.clientX, event.clientY);
      } else {
        selectedSprite = null;
        hideTooltip();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (interactiveRef.current) {
          onInteractionChangeRef.current?.(false);
        }
        selectedSprite = null;
        hideTooltip();
      }
    };

    const onWheel = () => {
      if (interactiveRef.current) {
        onInteractionChangeRef.current?.(false);
      }
      selectedSprite = null;
      hideTooltip();
    };

    const onMouseLeave = () => {
      if (!isTouchLike) {
        hoveredSprite = null;
        hideTooltip();
      }
    };

    const onVisibilityChange = () => {
      pageVisibleRef.current = !document.hidden;
    };

    const updateCameraDistanceForViewport = () => {
      const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect);
      const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
      const sphereRadiusWithAtmosphere = 1.16;
      const fitDistance = sphereRadiusWithAtmosphere / Math.tan(limitingHalfFov);
      camera.position.z = Math.max(3.8, fitDistance + 0.22);
    };

    const onResize = () => {
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      updateCameraDistanceForViewport();
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: true });
    container.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", onResize);

    updateCameraDistanceForViewport();

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);

      if (!activeRef.current || !pageVisibleRef.current) {
        return;
      }

      frameCount += 1;
      const shouldRaycast = !isTouchLike && frameCount % 2 === 0;

      if (EARTH_DEVELOPER_CONFIG.markersEnabled && shouldRaycast) {
        raycaster.setFromCamera(mouse, camera);
        const intersections = raycaster.intersectObjects(markerSprites);

        if (intersections.length > 0 && intersections[0]?.object.visible) {
          const currentHover = intersections[0].object as MarkerSprite;
          document.body.style.cursor = "pointer";

          if (hoveredSprite !== currentHover) {
            hoveredSprite = currentHover;
            showTooltipForSprite(currentHover, lastClientX, lastClientY);
          }
        } else {
          document.body.style.cursor = "default";
          if (hoveredSprite) {
            hoveredSprite = null;
            hideTooltip();
          }
        }
      }

      const delta = Math.min(clock.getDelta(), 0.05);
      elapsed += delta;
      const isPausedByMarker = hoveredSprite !== null || selectedSprite !== null;

      if (!isPausedByMarker) {
        earth.rotation.y += EARTH_DEVELOPER_CONFIG.autoRotationSpeed * delta * 0.3;
      }

      markerSprites.forEach((sprite) => {
        const t = elapsed * 1.5 + sprite.userData.stagger;
        const scale = sprite.userData.baseScale + Math.sin(t) * 0.03;
        sprite.scale.set(scale, scale, scale);
        const material = sprite.material as THREE.SpriteMaterial;
        material.opacity = 0.76 + Math.sin(t) * 0.22;
      });

      markerHalos.forEach((halo, index) => {
        const linkedMarker = markerSprites[index];
        const t = elapsed * 1.5 + linkedMarker.userData.stagger;
        const haloScale = linkedMarker.userData.baseScale * 1.9 + Math.sin(t) * 0.06;
        halo.scale.set(haloScale, haloScale, haloScale);
        const material = halo.material as THREE.SpriteMaterial;
        material.opacity = 0.22 + Math.sin(t) * 0.14;
      });

      controls.enabled = interactiveRef.current;
      if (interactiveRef.current) {
        controls.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);

      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);

      controls.dispose();
      geometry.dispose();
      atmosphereMaterial.dispose();
      earthMaterial.dispose();
      dayTexture.dispose();
      nightTexture.dispose();
      glowTexture.dispose();
      haloTexture.dispose();
      markerSprites.forEach((sprite) => {
        const material = sprite.material as THREE.SpriteMaterial;
        material.dispose();
      });
      markerHalos.forEach((halo) => {
        const material = halo.material as THREE.SpriteMaterial;
        material.dispose();
      });

      renderer.dispose();
      renderer.domElement.remove();
      tooltip.style.opacity = "0";
      document.body.style.cursor = "default";
    };
  }, []);

  const tooltip =
    typeof document === "undefined"
      ? null
      : createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              background: "rgba(10, 5, 15, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              color: "white",
              padding: "16px 24px",
              borderRadius: "6px",
              pointerEvents: "none",
              opacity: 0,
              transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 2147483647,
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(143, 19, 65, 0.15)",
              transform: "translate(-50%, -120%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              overflow: "hidden",
            }}
          />,
          document.body,
        );

  return (
    <div ref={hostRef} className="absolute inset-0" style={{ pointerEvents: active ? "auto" : "none" }}>
      <div ref={canvasContainerRef} className="absolute top-0 right-[-6%] h-full w-[94%] sm:right-[-10%] sm:w-[65%]" />
      {tooltip}
    </div>
  );
}
