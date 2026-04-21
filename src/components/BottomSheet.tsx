import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[2001] bg-card bottom-sheet max-h-[75vh] overflow-y-auto"
        >
          {/* ハンドル + 閉じるボタン */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="w-8" />
            <div className="w-10 h-1 bg-border rounded-full" />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground text-sm"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
          <div className="px-5" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
