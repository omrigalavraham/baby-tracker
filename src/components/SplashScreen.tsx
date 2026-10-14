import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  babyName?: string;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  babyName,
  onFinish
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Elegant, crisp 1.1s reveal then smooth fade-out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onFinish, 400);
    }, 1100);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const handleInstantEnter = () => {
    setIsFadingOut(true);
    setTimeout(onFinish, 150);
  };

  return (
    <div
      onClick={handleInstantEnter}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 select-none transition-all duration-400 ease-out cursor-pointer ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'linear-gradient(180deg, #fffafb 0%, #fff0f3 50%, #fde6eb 100%)'
      }}
    >
      {/* Top spacing */}
      <div className="w-full pt-4" />

      {/* Centerpiece: Pure Luxury Brand Emblem */}
      <div className="flex flex-col items-center justify-center my-auto text-center space-y-6">
        
        {/* Logo Container with Soft Ambient Gold Glow */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-rose-300/30 blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-rose-900/15 ring-1 ring-white/60">
            <img 
              src="/icon.svg" 
              alt="בייבי יומן" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Clean, High-End Minimalist Typography */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            בייבי <span className="bg-gradient-to-l from-rose-600 to-pink-500 bg-clip-text text-transparent">יומן</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 tracking-wide">
            מעקב וסדר יום לתינוקת
          </p>
          {babyName && (
            <p className="text-[11px] font-bold text-rose-500/80 pt-1">
              עבור {babyName}
            </p>
          )}
        </div>

      </div>

      {/* Bottom Minimalist Shimmer Indicator */}
      <div className="w-full max-w-[120px] pb-6 flex flex-col items-center space-y-2">
        <div className="w-full h-1 bg-rose-200/40 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 rounded-full animate-pulse" />
        </div>
        <span className="text-[10px] text-slate-400 font-medium">כניסה לאפליקציה...</span>
      </div>

    </div>
  );
};
