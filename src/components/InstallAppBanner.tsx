"use client";

import { useEffect, useState } from "react";
import { Download, X, Share2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // 1. Check if already installed & running standalone
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user dismissed it recently (in the last 48 hours)
    const dismissedTime = localStorage.getItem("majesty_pwa_dismissed_at");
    if (dismissedTime) {
      const hoursPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60);
      if (hoursPassed < 48) {
        return;
      }
    }

    setDismissed(false);

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    if (isIosDevice && isSafari) {
      setIsIos(true);
      setIsInstallable(true);
    }

    // 4. Capture native beforeinstallprompt (Chrome / Android / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("majesty_pwa_dismissed_at", Date.now().toString());
  };

  if (isStandalone || dismissed || !isInstallable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative z-50 bg-gradient-to-r from-emerald-depth via-[#152e24] to-emerald-depth text-white border-b border-primary/30 shadow-md"
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Left badge & message */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Colorful M Icon */}
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 p-0.5 bg-gradient-to-tr from-emerald-500 via-cyan-400 to-amber-400 shadow flex items-center justify-center font-black text-white text-base">
              M
            </div>

            <div className="truncate">
              <span className="font-extrabold flex items-center gap-1.5 text-emerald-300">
                <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
                Install Club App
              </span>
              <p className="text-[11px] text-white/80 truncate hidden sm:block">
                Add Majesty Peacock Shop to your home screen for quick offline access & souvenirs!
              </p>
            </div>
          </div>

          {/* Action Button & Dismiss */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isIos ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-white">
                <span>Tap</span>
                <Share2 size={13} className="text-cyan-300" />
                <span>then &ldquo;Add to Home Screen&rdquo;</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md active:scale-95 transition-all"
              >
                <Download size={14} />
                <span>Install Now</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

