import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Play } from "lucide-react";
import { smoothScrollToHash } from "../utils/smoothScroll";

type LayoutVariant = "feature" | "wide" | "tall" | "square" | "standard";

interface WorkItem {
  id: number;
  title: string;
  discipline: "Product" | "Architectural" | "Jewelry" | "Automobile";
  fileName: string;
  layout: LayoutVariant;
  videoScale?: number;
  videoPosition?: string;
  tileSizeClass?: string;
}

interface ManualTileTuning {
  layout?: LayoutVariant;
  videoScale?: number;
  videoPosition?: string;
  tileSizeClass?: string;
}

const workItems: WorkItem[] = [
  { id: 2, title: "RING CASE", discipline: "Jewelry", fileName: "Ring Case.mp4", layout: "tall" },
  {
    id: 3,
    title: "CAR VISION 01",
    discipline: "Automobile",
    fileName: "Car1.mp4",
    layout: "standard",
  },
  {
    id: 4,
    title: "RING CUT 01",
    discipline: "Jewelry",
    fileName: "Ring1.mp4",
    layout: "standard",
  },
  { id: 5, title: "ARCHVIZ OUT", discipline: "Architectural", fileName: "Archviz Out.mp4", layout: "standard" },
  { id: 7, title: "MASK INTRO", discipline: "Product", fileName: "Mask Intro.mp4", layout: "tall" },
  { id: 10, title: "ARCHVIZ IN 03", discipline: "Architectural", fileName: "Archviz in 3.mp4", layout: "wide" },
  { id: 11, title: "CAR VISION 03", discipline: "Automobile", fileName: "Car3.mp4", layout: "standard" },
  { id: 12, title: "ROUTER 01", discipline: "Product", fileName: "Router.mp4", layout: "tall" },
  { id: 13, title: "ARETTO", discipline: "Product", fileName: "Aretto.mp4", layout: "standard" },
  { id: 14, title: "ARCHVIZ 04", discipline: "Architectural", fileName: "Archviz4.mp4", layout: "wide" },
  { id: 15, title: "PHASE 02", discipline: "Product", fileName: "Ph2.mp4", layout: "standard" },
  { id: 17, title: "PHASE 03", discipline: "Product", fileName: "Ph3.mp4", layout: "standard" },
  {
    id: 18,
    title: "ARCHVIZ OUT 05",
    discipline: "Architectural",
    fileName: "Archvizout5.mp4",
    layout: "tall",
  },
  { id: 19, title: "COSMETICS 02", discipline: "Product", fileName: "Cosmetics2.mp4", layout: "wide" },
  { id: 20, title: "PHASE 04", discipline: "Product", fileName: "Ph4.mp4", layout: "standard" },
  {
    id: 23,
    title: "ARCHVIZ OUT 07",
    discipline: "Architectural",
    fileName: "Archvizout7.mp4",
    layout: "tall",
  },
  { id: 24, title: "ROUTER 02", discipline: "Product", fileName: "Router2.mp4", layout: "standard" },
  {
    id: 25,
    title: "MASK SEQUENCE 02",
    discipline: "Product",
    fileName: "Mask2.mp4",
    layout: "standard",
    videoScale: 1.12,
    videoPosition: "50% 50%",
  },
];

// Manual edit window:
// - Change videoScale to remove bezel bars per clip.
// - Change tileSizeClass to resize one clip box without touching global grid.
// - Example tileSizeClass values: "sm:col-span-2", "sm:row-span-2", "lg:col-span-2 lg:row-span-1"
const MANUAL_TILE_TUNING: Record<number, ManualTileTuning> = {
  2: { videoScale: 1.36, tileSizeClass: "" },
  7: { videoScale: 1.36, videoPosition: "50% 60%", tileSizeClass: "" },
  25: { videoScale: 1.12, tileSizeClass: "" },
};

function applyManualTuning(item: WorkItem): WorkItem {
  const manual = MANUAL_TILE_TUNING[item.id];
  if (!manual) {
    return item;
  }

  return {
    ...item,
    ...manual,
  };
}

const layoutClassNames: Record<LayoutVariant, string> = {
  feature: "sm:col-span-2 sm:row-span-2",
  wide: "sm:col-span-2",
  tall: "row-span-2",
  square: "row-span-2",
  standard: "",
};

function getVideoUrl(fileName: string) {
  return `/Website%20Content/${encodeURIComponent(fileName)}`;
}

interface WorkTileProps {
  item: WorkItem;
  index: number;
}

function WorkTile({ item, index }: WorkTileProps) {
  const PREVIEW_DURATION_MS = 9000;
  const tunedItem = applyManualTuning(item);
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isManualPlaying, setIsManualPlaying] = useState(false);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [isInView, setIsInView] = useState(index < 6);
  const [hasLoadedSource, setHasLoadedSource] = useState(index < 6);
  const [isReady, setIsReady] = useState(false);

  const tileRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const previewConsumedRef = useRef(false);
  const touchInteractionRef = useRef(false);
  const baseScale = tunedItem.videoScale ?? 1;
  const liveScale = shouldReduceMotion || !(isHovered || isFocused) ? baseScale : baseScale * 1.03;
  const resolvedPosition = tunedItem.videoPosition ?? "50% 50%";

  useEffect(() => {
    const target = tileRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasLoadedSource(true);
        }
      },
      {
        threshold: 0.35,
        rootMargin: "260px 0px",
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const shouldAutoPlay = !shouldReduceMotion && isInView && (isHovered || isFocused);
    const shouldPlay = shouldAutoPlay || isManualPlaying;

    if (shouldPlay && !previewConsumedRef.current) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaybackActive(true);
          })
          .catch(() => {
            // Autoplay can be blocked in some environments.
            setIsPlaybackActive(false);
            setIsManualPlaying(false);
          });
      } else {
        setIsPlaybackActive(true);
      }

      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
      }

      previewTimeoutRef.current = window.setTimeout(() => {
        previewConsumedRef.current = true;
        setIsManualPlaying(false);
        setIsPlaybackActive(false);
        video.pause();
      }, PREVIEW_DURATION_MS);

      return;
    }

    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    setIsPlaybackActive(false);
    video.pause();
    if (!isHovered && !isFocused) {
      previewConsumedRef.current = false;
      video.currentTime = 0;
    }
  }, [PREVIEW_DURATION_MS, isFocused, isHovered, isInView, isManualPlaying, shouldReduceMotion]);

  return (
    <article
      ref={tileRef}
      onMouseEnter={() => {
        previewConsumedRef.current = false;
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        previewConsumedRef.current = false;
        setIsManualPlaying(false);
        setIsHovered(false);
      }}
      onFocus={() => {
        previewConsumedRef.current = false;
        setIsFocused(true);
      }}
      onBlur={() => {
        previewConsumedRef.current = false;
        setIsManualPlaying(false);
        setIsFocused(false);
      }}
      onPointerDown={(event) => {
        touchInteractionRef.current = event.pointerType !== "mouse";
      }}
      onClick={() => {
        if (!touchInteractionRef.current) {
          return;
        }
        previewConsumedRef.current = false;
        setIsManualPlaying((prev) => !prev);
      }}
      tabIndex={0}
      aria-label={tunedItem.title}
      className={`group relative h-full min-h-[210px] sm:min-h-0 overflow-hidden border border-white/10 bg-[#0d0d0d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a566ff] ${layoutClassNames[tunedItem.layout]} ${tunedItem.tileSizeClass ?? ""}`}
      style={{ contentVisibility: "auto", contain: "layout paint style" }}
    >
      <video
        ref={videoRef}
        src={hasLoadedSource ? getVideoUrl(tunedItem.fileName) : undefined}
        muted
        loop
        playsInline
        preload={hasLoadedSource ? "metadata" : "none"}
        className="absolute inset-0 z-0 h-full w-full transition duration-500 opacity-90 group-hover:opacity-100"
        style={{
          objectFit: "cover",
          objectPosition: resolvedPosition,
          transform: `scale(${liveScale})`,
        }}
        onLoadedData={() => setIsReady(true)}
        onPlay={() => setIsPlaybackActive(true)}
        onPause={() => setIsPlaybackActive(false)}
        aria-label={tunedItem.title}
      />

      {!isReady && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(130deg,#0f0f12,#07070a,#0f0f12)]" />
          <div className="absolute inset-0 animate-[pulse_1.8s_ease-in-out_infinite] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.10)_42%,transparent_68%)]" />
        </div>
      )}

      {!isPlaybackActive && (
        <div className="absolute inset-0 md:hidden flex items-center justify-center">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              previewConsumedRef.current = false;
              setIsManualPlaying(true);
            }}
            aria-label={`Play ${tunedItem.title}`}
            className="h-12 w-12 rounded-full border border-white/35 bg-black/35 backdrop-blur-[2px] flex items-center justify-center"
          >
            <Play className="h-5 w-5 text-white/85 ml-[2px]" />
          </button>
        </div>
      )}

    </article>
  );
}

export function Works() {
  const shouldReduceMotion = useReducedMotion();
  const ctaPrimaryClass =
    "inline-block px-12 sm:px-16 py-4 sm:py-6 border border-white/80 bg-white text-black text-base sm:text-lg uppercase tracking-widest transition-colors duration-300 hover:bg-[#d5bcff] hover:border-[#d5bcff] hover:text-black";
  const ctaSecondaryClass =
    "text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 border border-white/35 bg-white/8 text-white hover:bg-white hover:text-black hover:border-white transition-colors duration-300 uppercase tracking-widest inline-block";

  return (
    <section id="work" className="relative py-24 px-4 sm:px-6 md:px-12">
      <div className="max-w-[1880px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-14 sm:mb-16"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 sm:gap-8 mb-8 sm:mb-10">
            <div>
              <h2
                className="text-[clamp(3rem,12vw,10rem)] leading-[0.9] tracking-tighter mb-4 sm:mb-6"
                style={{ fontWeight: 700 }}
              >
                GLIMPSE
              </h2>
              <p className="text-base sm:text-lg lg:text-xl opacity-70 max-w-3xl leading-relaxed">
                Product, architectural, jewelry, and automobile visualization reels placed together in a single living board.
              </p>
            </div>

            <motion.a
              href="https://www.behance.net/artystudio3d"
              target="_blank"
              rel="noopener noreferrer"
              className={ctaSecondaryClass}
              whileHover={{ scale: shouldReduceMotion ? 1 : 1.03 }}
              whileTap={{ scale: shouldReduceMotion ? 1 : 0.97 }}
            >
              View All on Behance
            </motion.a>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense auto-rows-[220px] sm:auto-rows-[200px] lg:auto-rows-[210px] gap-4 sm:gap-5">
          {workItems.map((item, index) => (
            <WorkTile key={item.id} item={item} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 sm:mt-24 text-center"
        >
          <div className="inline-block">
            <h3 className="text-3xl sm:text-4xl mb-3 sm:mb-4" style={{ fontWeight: 600 }}>
              Have a project in mind?
            </h3>
            <p className="text-base sm:text-lg opacity-70 mb-6 sm:mb-8">
              Let&apos;s build the next standout visual campaign together.
            </p>
            <motion.a
              href="#contact"
              className={ctaPrimaryClass}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                smoothScrollToHash("#contact");
              }}
            >
              Get in Touch
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
