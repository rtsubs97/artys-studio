import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR =
  'a,button,[role="button"],input,textarea,select,label,[tabindex]:not([tabindex="-1"]),[data-cursor="interactive"]';

export function Cursor() {
  const shouldReduceMotion = useReducedMotion();
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const interactiveRef = useRef(false);
  const isVisibleRef = useRef(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const lensX = useSpring(cursorX, {
    stiffness: 920,
    damping: 68,
    mass: 0.26,
  });
  const lensY = useSpring(cursorY, {
    stiffness: 920,
    damping: 68,
    mass: 0.26,
  });

  const coreX = useSpring(cursorX, {
    stiffness: 1500,
    damping: 82,
    mass: 0.2,
  });
  const coreY = useSpring(cursorY, {
    stiffness: 1500,
    damping: 82,
    mass: 0.2,
  });

  const trailOneX = useSpring(cursorX, {
    stiffness: 520,
    damping: 64,
    mass: 0.34,
  });
  const trailOneY = useSpring(cursorY, {
    stiffness: 520,
    damping: 64,
    mass: 0.34,
  });

  const trailTwoX = useSpring(cursorX, {
    stiffness: 440,
    damping: 58,
    mass: 0.4,
  });
  const trailTwoY = useSpring(cursorY, {
    stiffness: 440,
    damping: 58,
    mass: 0.4,
  });

  const trailThreeX = useSpring(cursorX, {
    stiffness: 360,
    damping: 54,
    mass: 0.46,
  });
  const trailThreeY = useSpring(cursorY, {
    stiffness: 360,
    damping: 54,
    mass: 0.46,
  });

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const handlePointerChange = () => {
      setIsFinePointer(pointerQuery.matches);
    };

    handlePointerChange();
    pointerQuery.addEventListener("change", handlePointerChange);

    return () => {
      pointerQuery.removeEventListener("change", handlePointerChange);
    };
  }, []);

  const isCursorEnabled = !shouldReduceMotion && isFinePointer;

  useEffect(() => {
    if (!isCursorEnabled) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      if (e.target instanceof Element) {
        const nextInteractive = Boolean(e.target.closest(INTERACTIVE_SELECTOR));
        if (interactiveRef.current !== nextInteractive) {
          interactiveRef.current = nextInteractive;
          setIsInteractive(nextInteractive);
        }
      }
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeaveWindow = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
      setIsPressed(false);
    };
    const handleMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        handleMouseLeaveWindow();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, [cursorX, cursorY, isCursorEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    if (isCursorEnabled) {
      root.classList.add("cosmic-cursor-active");
    } else {
      root.classList.remove("cosmic-cursor-active");
    }

    return () => {
      root.classList.remove("cosmic-cursor-active");
    };
  }, [isCursorEnabled]);

  if (!isCursorEnabled) {
    return null;
  }

  const lensScale = isPressed ? 0.94 : isInteractive ? 1.26 : 1;
  const coreScale = isPressed ? 0.78 : isInteractive ? 1.14 : 1;

  return (
    <>
      <style>{`
        .cosmic-cursor-active, .cosmic-cursor-active * {
          cursor: none !important;
        }
      `}</style>

      <motion.div
        className="fixed pointer-events-none z-[140] rounded-full blur-xl mix-blend-screen"
        style={{
          width: 82,
          height: 82,
          x: trailThreeX,
          y: trailThreeY,
          translateX: "-50%",
          translateY: "-50%",
          background:
            "radial-gradient(circle, rgba(178,120,255,0.26) 0%, rgba(118,71,224,0.12) 45%, rgba(0,0,0,0) 75%)",
        }}
        animate={{ opacity: isVisible ? 0.95 : 0 }}
        transition={{ duration: 0.18 }}
      />

      <motion.div
        className="fixed pointer-events-none z-[141] rounded-full blur-md mix-blend-screen"
        style={{
          width: 38,
          height: 38,
          x: trailOneX,
          y: trailOneY,
          translateX: "-50%",
          translateY: "-50%",
          background:
            "radial-gradient(circle, rgba(255,174,108,0.22) 0%, rgba(188,111,255,0.12) 52%, rgba(0,0,0,0) 100%)",
        }}
        animate={{ opacity: isVisible ? 0.95 : 0 }}
        transition={{ duration: 0.16 }}
      />

      <motion.div
        className="fixed w-11 h-11 rounded-full border pointer-events-none z-[142] mix-blend-screen"
        style={{
          x: lensX,
          y: lensY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: lensScale,
          borderColor: isInteractive ? "rgba(255,161,93,0.92)" : "rgba(201,162,255,0.9)",
          boxShadow: isInteractive
            ? "0 0 0 1px rgba(255,173,117,0.42) inset, 0 0 26px rgba(248,138,76,0.42)"
            : "0 0 0 1px rgba(186,122,255,0.38) inset, 0 0 26px rgba(135,90,255,0.32)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />

      <motion.div
        className="fixed w-3 h-3 rounded-full pointer-events-none z-[143] mix-blend-screen"
        style={{
          x: coreX,
          y: coreY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(195,153,255,0.9) 48%, rgba(0,0,0,0) 100%)",
        }}
        animate={{ opacity: isVisible ? 1 : 0, scale: coreScale }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      />

      <motion.div
        className="fixed w-1.5 h-1.5 rounded-full pointer-events-none z-[141] mix-blend-screen"
        style={{
          x: trailTwoX,
          y: trailTwoY,
          translateX: "-50%",
          translateY: "-50%",
          background: "rgba(184,132,255,0.9)",
          boxShadow: "0 0 10px rgba(184,132,255,0.7)",
        }}
        animate={{ opacity: isVisible ? 0.72 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
