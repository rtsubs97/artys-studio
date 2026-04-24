import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface PreloaderProps {
  ready: boolean;
  phase: "loading" | "fading";
  onReadyToClose: () => void;
  onClosed: () => void;
}

export function Preloader({ ready, phase, onReadyToClose, onClosed }: PreloaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const hasTriggeredCloseRef = useRef(false);
  const hasNotifiedClosedRef = useRef(false);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setProgress((current) => {
        const target = ready ? 100 : 88;
        if (current >= target) {
          return current;
        }

        const delta = ready
          ? Math.max(0.9, (target - current) * 0.23)
          : Math.max(0.18, (target - current) * 0.06);

        return Math.min(target, current + delta);
      });
    }, 36);

    return () => window.clearInterval(tick);
  }, [ready]);

  useEffect(() => {
    if (!ready || progress < 99.95) {
      return;
    }

    if (hasTriggeredCloseRef.current) {
      return;
    }
    hasTriggeredCloseRef.current = true;

    if (shouldReduceMotion) {
      onReadyToClose();
      return;
    }

    const timer = window.setTimeout(onReadyToClose, 180);
    return () => window.clearTimeout(timer);
  }, [onReadyToClose, progress, ready, shouldReduceMotion]);

  useEffect(() => {
    if (phase !== "fading" || hasNotifiedClosedRef.current) {
      return;
    }

    hasNotifiedClosedRef.current = true;
    const timer = window.setTimeout(onClosed, shouldReduceMotion ? 0 : 760);
    return () => window.clearTimeout(timer);
  }, [onClosed, phase, shouldReduceMotion]);

  const shownProgress = Math.round(progress);

  return (
    <motion.div
      className="fixed inset-0 z-[120] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={
        phase === "fading"
          ? shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, transition: { duration: 0.75, ease: [0.25, 0.1, 0.25, 1] } }
          : { opacity: 1 }
      }
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,#4f2392_0%,#18072f_36%,#05030d_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_68%,rgba(124,90,255,0.24)_0%,transparent_44%)]" />
      <div className="absolute inset-0 opacity-45 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_40%,transparent_62%)] animate-[pulse_2.8s_ease-in-out_infinite]" />

      <div className="relative h-full w-full flex items-center justify-center px-8">
        <div className="w-full max-w-xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.75 }}
            className="text-xs sm:text-sm tracking-[0.32em] uppercase text-white/70 mb-5"
          >
            ARTY'S STUDIO
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.88, delay: shouldReduceMotion ? 0 : 0.12 }}
            className="text-[clamp(2rem,7vw,4.6rem)] leading-[0.95] tracking-[-0.04em] text-white"
            style={{ fontWeight: 700 }}
          >
            PREPARING YOUR EXPERIENCE
          </motion.h2>

          <div className="mt-10">
            <div className="h-[2px] w-full bg-white/20 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#8f5bff] via-[#c08cff] to-white"
                initial={{ width: "0%" }}
                animate={{ width: `${shownProgress}%` }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            </div>
            <div className="mt-4 text-xs tracking-[0.25em] uppercase text-white/65">{shownProgress}%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
