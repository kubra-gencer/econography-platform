import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 1150);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.75,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[var(--bg)]"
        >
          <div className="absolute inset-0 hero-atmosphere" />

          <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(139,163,255,0.07)] blur-[120px]" />

          <div className="relative z-10 flex flex-col items-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.65,
                ease: [0.76, 0, 0.24, 1],
              }}
              className="label mb-6"
            >
              Initializing Financial Memory
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.18,
                duration: 0.85,
                ease: [0.76, 0, 0.24, 1],
              }}
              className="hero-title text-center text-[clamp(3.6rem,8vw,7.8rem)]"
            >
              ECONOGRAPHY
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: 0.4,
                duration: 0.75,
                ease: [0.76, 0, 0.24, 1],
              }}
              className="mt-8 h-px w-[200px] origin-center bg-white/18"
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.62, duration: 0.65 }}
              className="mono-font mt-7 text-[0.58rem] uppercase tracking-[0.22em] text-dim"
            >
              Money remembers. Data becomes atmosphere.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}