import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export default function VintageCursor() {
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth springs for lag effect
  const ringX = useSpring(cursorX, { damping: 30, stiffness: 200, mass: 0.6 });
  const ringY = useSpring(cursorY, { damping: 30, stiffness: 200, mass: 0.6 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isClickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("a") ||
        target.onclick ||
        target.getAttribute("role") === "button" ||
        target.closest(".leaflet-interactive") ||
        target.classList.contains("clickable") ||
        target.closest(".swiper-button") ||
        target.closest(".leaflet-control");

      setIsPointer(!!isClickable);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    document.documentElement.classList.add("vintage-cursor-active");

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.documentElement.classList.remove("vintage-cursor-active");
    };
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      {/* Outer Floating Antique Brass Ring with Astrolabe Crosshairs */}
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-600/50 bg-amber-950/10 backdrop-blur-[0.5px]"
        style={{
          x: ringX,
          y: ringY,
          width: isPointer ? 38 : 24,
          height: isPointer ? 38 : 24,
        }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
      >
        {!isPointer && (
          <>
            <div className="absolute w-[3px] h-[1px] bg-amber-500/40 left-0 top-1/2 -translate-y-1/2" />
            <div className="absolute w-[3px] h-[1px] bg-amber-500/40 right-0 top-1/2 -translate-y-1/2" />
            <div className="absolute h-[3px] w-[1px] bg-amber-500/40 top-0 left-1/2 -translate-x-1/2" />
            <div className="absolute h-[3px] w-[1px] bg-amber-500/40 bottom-0 left-1/2 -translate-x-1/2" />
          </>
        )}
      </motion.div>

      {/* Inner Pinpoint Dot / Vintage pointing finger */}
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
        style={{
          x: cursorX,
          y: cursorY,
        }}
      >
        {isPointer ? (
          <svg
            width="26"
            height="26"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]"
          >
            <path
              d="M10,14 L10,5 C10,3.9 10.9,3 12,3 C13.1,3 14,3.9 14,5 L14,14 M14,14 L14,8 C14,6.9 14.9,6 16,6 C17.1,6 18,6.9 18,8 L18,14 M18,14 L18,10 C18,8.9 18.9,8 20,8 C21.1,8 22,8.9 22,10 L22,14 M22,14 L22,12 C22,10.9 22.9,10 24,10 C25.1,10 26,10.9 26,12 L26,18 C26,23.5 21.5,28 16,28 L14,28 C10.1,28 6.8,25.3 5.9,21.5 L4.2,14.6 C3.9,13.5 4.6,12.4 5.7,12.1 C6.8,11.8 7.9,12.5 8.2,13.6 L10,18"
              fill="#ebd0a7"
              stroke="#5c3818"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Elegant brass highlight on cuff */}
            <rect x="13" y="25" width="6" height="2" rx="1" fill="#d97706" />
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#d97706] border border-amber-950" />
        )}
      </motion.div>
    </div>
  );
}
