import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { DummyEarthScene } from "./earth/DummyEarthScene";

interface CosmicSceneProps {
  interactive: boolean;
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  mode?: "full" | "asset" | "earth";
  active?: boolean;
  onInteractionChange?: (next: boolean) => void;
}

export function CosmicScene({ interactive, active = true, pointerRef: _pointerRef, mode: _mode, onInteractionChange }: CosmicSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);
  const shouldAnimate = active && isInView;

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.02, rootMargin: "220px 0px" },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ pointerEvents: shouldAnimate ? "auto" : "none" }}>
      <DummyEarthScene interactive={interactive} active={shouldAnimate} onInteractionChange={onInteractionChange} />
    </div>
  );
}
