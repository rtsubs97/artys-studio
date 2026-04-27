import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import gsap from "gsap";
import { X } from "lucide-react";
import { Suspense, lazy, useEffect, useRef, useState, type MouseEvent } from "react";
import { smoothScrollToHash } from "../utils/smoothScroll";

const LazyCosmicScene = lazy(async () => {
  const module = await import("./hero-cosmic/CosmicScene");
  return { default: module.CosmicScene };
});

const LazyCosmicTextReveal = lazy(async () => {
  const module = await import("./hero-cosmic/CosmicTextReveal");
  return { default: module.CosmicTextReveal };
});

const HERO_LINES = ["3D VISUALIZATION", "PARTNER FOR", "CREATIVE STUDIOS"];
const HERO_ASSET_ENABLED = import.meta.env.VITE_ENABLE_HERO_ASSET === "true";
const HERO_EARTH_ENABLED = import.meta.env.VITE_ENABLE_HERO_EARTH === "true";
const HERO_SCENE_ENABLED = HERO_ASSET_ENABLED || HERO_EARTH_ENABLED;
const SHOWREEL_EMBED_ID = (import.meta.env.VITE_SHOWREEL_EMBED_ID ?? "").trim();

interface PointerSetters {
  sceneX?: (value: number) => void;
  sceneY?: (value: number) => void;
  wandX?: (value: number) => void;
  wandY?: (value: number) => void;
}

interface HeroProps {
  introReady?: boolean;
}

export function Hero({ introReady = true }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const isEarthMode = HERO_EARTH_ENABLED;
  const [isCompactScreen, setIsCompactScreen] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1024px)").matches : false,
  );
  const [isHeadlineHovered, setIsHeadlineHovered] = useState(false);
  const [isModelInteractive, setIsModelInteractive] = useState(false);
  const [isSceneElevated, setIsSceneElevated] = useState(false);
  const [isHeroSceneActive, setIsHeroSceneActive] = useState(true);
  const [isShowreelOpen, setIsShowreelOpen] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const scenePointerRef = useRef({ x: 0, y: 0 });
  const wandPointerRef = useRef({ x: 0.5, y: 0.5 });
  const pointerSettersRef = useRef<PointerSetters>({});

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const assetOpacity = useTransform(scrollYProgress, [0, 0.36, 0.74], [1, 0.9, 0]);
  const assetY = useTransform(scrollYProgress, [0, 1], [0, 110]);

  useEffect(() => {
    pointerSettersRef.current.sceneX = gsap.quickTo(scenePointerRef.current, "x", {
      duration: 0.42,
      ease: "power3.out",
    });
    pointerSettersRef.current.sceneY = gsap.quickTo(scenePointerRef.current, "y", {
      duration: 0.42,
      ease: "power3.out",
    });
    pointerSettersRef.current.wandX = gsap.quickTo(wandPointerRef.current, "x", {
      duration: 0.24,
      ease: "power3.out",
    });
    pointerSettersRef.current.wandY = gsap.quickTo(wandPointerRef.current, "y", {
      duration: 0.24,
      ease: "power3.out",
    });
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isModelInteractive) {
      setIsSceneElevated(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSceneElevated(false);
    }, 620);

    return () => window.clearTimeout(timer);
  }, [isModelInteractive]);

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    if (HERO_SCENE_ENABLED) {
      void import("./hero-cosmic/CosmicScene");
    }
    void import("./hero-cosmic/CosmicTextReveal");
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      setIsCompactScreen(event.matches);
    };

    setIsCompactScreen(media.matches);
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (!isModelInteractive) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModelInteractive(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModelInteractive]);

  useEffect(() => {
    if (!isShowreelOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShowreelOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isShowreelOpen]);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (value > 0.55) {
      clearHoverTimer();
      setIsHeadlineHovered(false);
      setIsModelInteractive(false);
    }

    if (value > 0.7 && isHeroSceneActive) {
      setIsHeroSceneActive(false);
    } else if (value < 0.45 && !isHeroSceneActive) {
      setIsHeroSceneActive(true);
    }
  });

  useEffect(() => {
    if (!isEarthMode || !isModelInteractive) {
      return;
    }

    const onWheel = () => {
      setIsModelInteractive(false);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, [isEarthMode, isModelInteractive]);

  const updateScenePointer = (clientX: number, clientY: number) => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const bounds = section.getBoundingClientRect();
    const normalizedX = ((clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
    const normalizedY = -(((clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1);

    pointerSettersRef.current.sceneX?.(normalizedX);
    pointerSettersRef.current.sceneY?.(normalizedY);
  };

  const updateWandPointer = (clientX: number, clientY: number) => {
    const target = headlineRef.current;
    if (!target) {
      return;
    }

    const bounds = target.getBoundingClientRect();
    const x = (clientX - bounds.left) / Math.max(bounds.width, 1);
    const y = (clientY - bounds.top) / Math.max(bounds.height, 1);

    pointerSettersRef.current.wandX?.(Math.min(1, Math.max(0, x)));
    pointerSettersRef.current.wandY?.(Math.min(1, Math.max(0, y)));
  };

  const handleHeadlineHoverStart = () => {
    setIsHeadlineHovered(true);
    clearHoverTimer();

    if (shouldReduceMotion || !HERO_ASSET_ENABLED) {
      return;
    }

    hoverTimerRef.current = window.setTimeout(() => {
      setIsModelInteractive(true);
    }, 720);
  };

  const handleHeadlineHoverEnd = () => {
    setIsHeadlineHovered(false);
    clearHoverTimer();
  };

  const actionHover = shouldReduceMotion ? undefined : { scale: 1.05 };
  const actionTap = shouldReduceMotion ? undefined : { scale: 0.95 };
  const revealActive = isHeadlineHovered || isModelInteractive;
  const ctaPrimaryClass =
    "px-8 sm:px-12 py-4 sm:py-5 border border-white/80 bg-white text-black uppercase tracking-widest text-center text-sm sm:text-base transition-colors duration-300 hover:bg-[#d5bcff] hover:border-[#d5bcff] hover:text-black";
  const ctaSecondaryClass =
    "px-8 sm:px-12 py-4 sm:py-5 border border-white/35 bg-white/8 text-white uppercase tracking-widest text-center text-sm sm:text-base transition-colors duration-300 hover:bg-white hover:text-black hover:border-white";
  const showreelEmbedUrl = SHOWREEL_EMBED_ID
    ? `https://www.youtube.com/embed/${encodeURIComponent(SHOWREEL_EMBED_ID)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : "";

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ position: "relative" }}
      onMouseMove={(event) => updateScenePointer(event.clientX, event.clientY)}
    >
      {!shouldReduceMotion && HERO_SCENE_ENABLED && (
        <motion.div className="absolute inset-0" style={{ opacity: assetOpacity, y: assetY, zIndex: isSceneElevated ? 60 : 0 }}>
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : {
                    opacity: isModelInteractive ? 1 : 0.93,
                    scale: isModelInteractive ? (isEarthMode ? 1.08 : 1.02) : 0.985,
                    x: isModelInteractive && isEarthMode ? -42 : 0,
                  }
            }
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={null}>
              <LazyCosmicScene
                interactive={isModelInteractive}
                pointerRef={scenePointerRef}
                mode={HERO_EARTH_ENABLED ? "earth" : "asset"}
                active={isHeroSceneActive}
                onInteractionChange={(next) => setIsModelInteractive(next)}
              />
            </Suspense>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-28 sm:py-32"
        initial={false}
        animate={
          shouldReduceMotion
            ? { opacity: 1, scale: 1, y: 0 }
            : {
                opacity: isModelInteractive && isEarthMode ? 0.38 : 1,
                scale: isModelInteractive && isEarthMode ? 0.97 : 1,
                y: isModelInteractive && isEarthMode ? 12 : 0,
              }
        }
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ zIndex: isModelInteractive && isEarthMode ? 5 : 40, pointerEvents: isModelInteractive && isEarthMode ? "none" : "auto" }}
      >
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.7, delay: 0.2 }}
          className="relative z-40 mb-8 sm:mb-10 text-xs sm:text-sm tracking-[0.22em] uppercase opacity-70"
        >
          {/* Arty's Studio */}
        </motion.div>

        <div
          ref={headlineRef}
          className="relative z-20 inline-block cursor-crosshair select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a566ff]"
          onMouseEnter={handleHeadlineHoverStart}
          onMouseLeave={handleHeadlineHoverEnd}
          onMouseMove={(event) => {
            updateScenePointer(event.clientX, event.clientY);
            updateWandPointer(event.clientX, event.clientY);
          }}
          onClick={() => {
            if (HERO_ASSET_ENABLED) {
              setIsModelInteractive(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (HERO_SCENE_ENABLED) {
                setIsModelInteractive(true);
              }
            }
          }}
          role={HERO_SCENE_ENABLED ? "button" : undefined}
          tabIndex={HERO_SCENE_ENABLED ? 0 : -1}
          aria-label={HERO_SCENE_ENABLED ? "3D VISUALIZATION PARTNER FOR CREATIVE STUDIOS" : undefined}
        >
          <motion.h1
            id="hero-main-title"
            initial={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    y: { duration: 0.9, delay: 0.45, ease: [0.2, 1, 0.3, 1] },
                    opacity: { duration: 0.9, delay: 0.45, ease: [0.2, 1, 0.3, 1] },
                  }
            }
            className="text-[clamp(2.85rem,11vw,9.6rem)] leading-[0.9] tracking-[-0.04em]"
            style={{ fontWeight: 700 }}
          >
            {HERO_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.h1>

          {!shouldReduceMotion && introReady && isHeroSceneActive && (
            <Suspense fallback={null}>
              <LazyCosmicTextReveal active={revealActive} lines={HERO_LINES} wandRef={wandPointerRef} />
            </Suspense>
          )}
        </div>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 1.2, duration: 0.7 }}
          className={`relative z-40 mt-5 sm:mt-7 text-xs sm:text-sm opacity-70 ${
            isEarthMode && isCompactScreen ? "normal-case tracking-[0.02em] sm:tracking-[0.05em]" : "uppercase tracking-[0.18em]"
          }`}
        >
          {HERO_SCENE_ENABLED
            ? isEarthMode
              ? isCompactScreen
                ? "Drag the globe to explore. Scroll or tap Exit Globe to continue browsing."
                : "Click and drag Earth to explore. Press Esc, scroll, or use Exit Globe to continue browsing."
              : "Hover the headline to cast the reveal. Hold or click to open the landing asset."
            : ""}
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.75, delay: 1.35 }}
          className="relative z-40 mt-10 sm:mt-14 flex flex-col sm:flex-row gap-4 sm:gap-7 max-w-sm sm:max-w-none"
        >
          <motion.button
            type="button"
            className={ctaPrimaryClass}
            whileHover={actionHover}
            whileTap={actionTap}
            onClick={() => setIsShowreelOpen(true)}
          >
            View Showreel
          </motion.button>

          <motion.a
            href="#contact"
            className={ctaSecondaryClass}
            whileHover={actionHover}
            whileTap={actionTap}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              event.preventDefault();
              smoothScrollToHash("#contact");
            }}
          >
            Let&apos;s Talk
          </motion.a>

          {HERO_SCENE_ENABLED && isModelInteractive && !isEarthMode && (
            <button
              type="button"
              onClick={() => setIsModelInteractive(false)}
              className="px-8 sm:px-10 py-4 sm:py-5 border border-white/35 bg-white/8 text-white uppercase tracking-widest text-sm sm:text-base hover:bg-white hover:text-black hover:border-white transition-colors duration-300"
            >
              Close Asset View
            </button>
          )}
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 1.5 }}
          className="relative z-40 mt-16 sm:mt-24 lg:mt-28 grid grid-cols-1 sm:grid-cols-3 gap-7 sm:gap-9 lg:gap-14 max-w-4xl"
        >
          {[
            { number: "50+", label: "Projects Delivered" },
            { number: "15+", label: "Global Clients" },
            { number: "5+", label: "Years Experience" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: 1.65 + index * 0.08, duration: 0.55 }}
              className="border-l-2 border-[#a566ff] pl-6"
            >
              <div className="text-4xl sm:text-5xl mb-2" style={{ fontWeight: 700 }}>
                {stat.number}
              </div>
              <div className="text-sm uppercase tracking-wider opacity-65">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {isEarthMode && !isModelInteractive && (
        <motion.button
          type="button"
          onClick={() => setIsModelInteractive(true)}
          className="absolute right-4 top-24 z-40 px-4 py-2.5 sm:px-5 sm:py-3 border border-white/35 bg-black/35 text-white uppercase tracking-[0.18em] text-[10px] sm:text-xs md:text-sm backdrop-blur-sm hover:bg-white hover:text-black hover:border-white transition-colors"
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, delay: 0.4 }}
        >
          Explore Globe
        </motion.button>
      )}

      {isEarthMode && isModelInteractive && (
        <motion.button
          type="button"
          onClick={() => setIsModelInteractive(false)}
          className="absolute right-4 top-24 z-[70] px-4 py-2.5 sm:px-5 sm:py-3 border border-white/45 bg-black/55 text-white uppercase tracking-[0.18em] text-[10px] sm:text-xs md:text-sm backdrop-blur-sm hover:bg-white hover:text-black hover:border-white transition-colors"
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35 }}
        >
          Exit Globe
        </motion.button>
      )}

      {isShowreelOpen && (
        <motion.div
          className="fixed inset-0 z-[45] bg-black/75 backdrop-blur-sm flex items-start justify-center px-3 sm:px-5 lg:px-8 pt-20 sm:pt-24 pb-6 sm:pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsShowreelOpen(false)}
        >
          <motion.div
            className="relative w-[92vw] sm:w-[88vw] lg:w-[80vw] max-w-[1600px] border border-white/20 bg-[#05050a] shadow-[0_24px_90px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close showreel"
              className="absolute top-3 right-3 z-20 h-9 w-9 border border-white/25 bg-black/70 text-white flex items-center justify-center hover:border-white transition-colors"
              onClick={() => setIsShowreelOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mt-12 sm:mt-14 w-full bg-black max-h-[80vh] aspect-video">
              {showreelEmbedUrl ? (
                <iframe
                  src={showreelEmbedUrl}
                  title="Arty Studios Showreel"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-center px-6 text-white/80">
                  Add `VITE_SHOWREEL_EMBED_ID` in your `.env` to load the showreel.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
