import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RestModeScreenProps {
  cue: string;
  spotTitle: string;
  onClose: () => void;
}

export function RestModeScreen({ cue, spotTitle, onClose }: RestModeScreenProps) {
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [showCue, setShowCue] = useState(true);

  useEffect(() => {
    if (!isRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] rest-mode-bg flex flex-col items-center justify-center px-8"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-12 right-6 text-muted-foreground text-sm focus-calm"
      >
        閉じる
      </button>

      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Spot title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-muted-foreground mb-8"
        >
          {spotTitle}
        </motion.p>

        {/* Rest cue */}
        <AnimatePresence>
          {showCue && (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl font-medium text-foreground leading-relaxed tracking-wide"
            >
              {cue}
            </motion.h1>
          )}
        </AnimatePresence>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16"
        >
          <p className="text-4xl font-light text-foreground/70 tabular-nums">
            {formatTime(timerSeconds)}
          </p>

          <div className="flex gap-4 mt-8">
            {!isRunning && timerSeconds > 0 && (
              <button
                onClick={() => setIsRunning(true)}
                className="px-6 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-medium transition-colors hover:bg-primary/20 focus-calm"
              >
                タイマー開始
              </button>
            )}
            {isRunning && (
              <button
                onClick={() => setIsRunning(false)}
                className="px-6 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium focus-calm"
              >
                一時停止
              </button>
            )}
            {timerSeconds === 0 && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium focus-calm"
              >
                休憩おわり
              </button>
            )}
          </div>
        </motion.div>

        {/* Breathing indicator */}
        <motion.div
          className="mt-16 w-3 h-3 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  );
}
