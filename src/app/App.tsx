import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Cursor } from "./components/Cursor";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Works } from "./components/Works";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { Preloader } from "./components/Preloader";

const LazyGlobalCosmicBackdrop = lazy(async () => {
  const module = await import("./components/GlobalCosmicBackdrop");
  return { default: module.GlobalCosmicBackdrop };
});

export default function App() {
  const [preloaderPhase, setPreloaderPhase] = useState<"loading" | "fading" | "done">("loading");
  const [canClosePreloader, setCanClosePreloader] = useState(false);
  const preloadStartRef = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());

  useEffect(() => {
    let cancelled = false;

    const waitForBrowserLoad = () =>
      new Promise<void>((resolve) => {
        if (document.readyState === "complete") {
          resolve();
          return;
        }

        const onLoaded = () => resolve();
        window.addEventListener("load", onLoaded, { once: true });
      });

    const prepare = async () => {
      await Promise.all([
        waitForBrowserLoad(),
        document.fonts ? document.fonts.ready : Promise.resolve(),
      ]);

      const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - preloadStartRef.current;
      const minDuration = 2100;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }

      if (!cancelled) {
        setCanClosePreloader(true);
      }
    };

    void prepare();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (preloaderPhase !== "done") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [preloaderPhase]);

  return (
    <div id="top" className="min-h-screen bg-[#020106] text-white relative">
      <Suspense fallback={null}>
        <LazyGlobalCosmicBackdrop />
      </Suspense>
      <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/35 via-black/55 to-black/70" />
      <Cursor />
      <Navigation />
      <main className="relative z-20">
        <Hero introReady={preloaderPhase !== "loading"} />
        <About />
        <Works />
        <Contact />
      </main>

      {preloaderPhase !== "done" && (
        <Preloader
          ready={canClosePreloader}
          phase={preloaderPhase}
          onReadyToClose={() => {
            setPreloaderPhase("fading");
          }}
          onClosed={() => setPreloaderPhase("done")}
        />
      )}
    </div>
  );
}
