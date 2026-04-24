import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
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
  { id: 2, title: "CAR VISION 01", discipline: "Automobile", fileName: "Car1.mp4", layout: "tall" },
  {
    id: 3,
    title: "RING CASE",
    discipline: "Jewelry",
    fileName: "Ring Case.mp4",
    layout: "standard",
    videoScale: 1.48,
    videoPosition: "50% 50%",
  },
  {
    id: 4,
    title: "MASK INTRO",
    discipline: "Product",
    fileName: "Mask Intro.mp4",
    layout: "standard",
    videoScale: 1.52,
    videoPosition: "50% 50%",
  },
  { id: 5, title: "ARCHVIZ OUT", discipline: "Architectural", fileName: "Archviz Out.mp4", layout: "standard" },
  { id: 7, title: "RING CUT 01", discipline: "Jewelry", fileName: "Ring1.mp4", layout: "tall" },
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
    videoScale: 1.45,
    videoPosition: "50% 50%",
  },
];

// Manual edit window:
// - Change videoScale to remove bezel bars per clip.
// - Change tileSizeClass to resize one clip box without touching global grid.
// - Example tileSizeClass values: "sm:col-span-2", "sm:row-span-2", "lg:col-span-2 lg:row-span-1"
const MANUAL_TILE_TUNING: Record<number, ManualTileTuning> = {
  3: { videoScale: 1.85, tileSizeClass: "" },
  4: { videoScale: 2.05, tileSizeClass: "" },
  25: { videoScale: 1.9, tileSizeClass: "" },
};

// Global bezel crop factor (set to 1 for no global zoom).
const GLOBAL_BEZEL_ZOOM = 1.12;

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
  tall: "sm:row-span-2",
  square: "sm:row-span-2",
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
  const tunedItem = applyManualTuning(item);
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInView, setIsInView] = useState(index < 6);
  const [hasLoadedSource, setHasLoadedSource] = useState(index < 6);
  const [isReady, setIsReady] = useState(false);

  const tileRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const baseScale = (tunedItem.videoScale ?? 1) * GLOBAL_BEZEL_ZOOM;
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
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const shouldPlay = !shouldReduceMotion && isInView && (isHovered || isFocused);

    if (shouldPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay can be blocked in some environments.
        });
      }
      return;
    }

    video.pause();
    if (!isHovered && !isFocused) {
      video.currentTime = 0;
    }
  }, [isFocused, isHovered, isInView, shouldReduceMotion]);

  return (
      <article
        ref={tileRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
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
        className="absolute inset-0 h-full w-full transition duration-500 opacity-90 group-hover:opacity-100"
        style={{
          objectFit: "cover",
          objectPosition: resolvedPosition,
          transform: `scale(${liveScale})`,
        }}
        onLoadedData={() => setIsReady(true)}
        aria-label={tunedItem.title}
      />

      {!isReady && <div className="absolute inset-0 bg-[linear-gradient(130deg,#101010,#070707)]" />}

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
