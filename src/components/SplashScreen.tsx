import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, ChevronLeft, Moon, Star } from 'lucide-react';

interface SplashScreenProps {
  babyName?: string;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  babyName,
  onFinish
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress animation over 2.2 seconds
    const intervalTime = 25; // 25ms steps
    const totalSteps = 80;   // 25ms * 80 = 2000ms
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const currentProgress = Math.min(100, Math.round((step / totalSteps) * 100));
      setProgress(currentProgress);

      if (step >= totalSteps) {
        clearInterval(timer);
        setIsFadingOut(true);
        setTimeout(() => {
          onFinish();
        }, 600); // Wait for fade out animation
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 select-none transition-all duration-700 ease-out overflow-hidden ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none filter blur-xs'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 30%, #fff1f2 0%, #ffe4e6 50%, #fdf2f8 100%)'
      }}
    >
      {/* Background Floating Stars & Magic Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Twinkling Stars */}
        <div className="absolute top-[12%] left-[18%] animate-twinkle text-rose-300 text-xl" style={{ animationDelay: '0.2s' }}>
          ✨
        </div>
        <div className="absolute top-[22%] right-[16%] animate-twinkle text-amber-300 text-2xl" style={{ animationDelay: '0.9s' }}>
          ⭐
        </div>
        <div className="absolute top-[55%] left-[12%] animate-twinkle text-pink-400 text-lg" style={{ animationDelay: '1.4s' }}>
          ✨
        </div>
        <div className="absolute top-[48%] right-[14%] animate-twinkle text-rose-300 text-xl" style={{ animationDelay: '0.5s' }}>
          💖
        </div>
        <div className="absolute bottom-[28%] left-[22%] animate-twinkle text-amber-300 text-base" style={{ animationDelay: '1.1s' }}>
          ⭐
        </div>

        {/* Soft Dreamy Floating Clouds */}
        <div className="absolute -top-10 -left-12 w-48 h-28 bg-white/60 rounded-full blur-xl animate-float-slow" />
        <div className="absolute top-1/4 -right-16 w-56 h-32 bg-rose-200/40 rounded-full blur-2xl animate-float-gentle" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-36 bg-pink-100/70 rounded-full blur-2xl animate-float-slow" />
      </div>

      {/* Top Bar with Skip Button */}
      <div className="w-full max-w-md flex justify-between items-center z-10 safe-top pt-2">
        <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-rose-200/60 shadow-xs">
          <Moon className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[11px] font-bold text-rose-700">בייבי יומן</span>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs text-slate-500 hover:text-slate-800 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 font-semibold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
        >
          <span>כניסה</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Main Stage (Animated Icon & Title) */}
      <div className="flex flex-col items-center justify-center my-auto z-10 text-center">
        
        {/* Animated Halo & Icon Container */}
        <div className="relative mb-6 flex items-center justify-center">
          
          {/* Glowing Outer Rings */}
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-rose-300/40 via-pink-200/30 to-amber-200/40 blur-xl animate-pulse-halo" />
          <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-rose-300/60 animate-spin" style={{ animationDuration: '24s' }} />

          {/* Main Icon Orb */}
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-rose-400 via-rose-500 to-pink-500 p-1 shadow-2xl shadow-rose-300/80 animate-breathe">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center relative overflow-hidden shadow-inner">
              
              {/* Soft interior shine */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-rose-100/60 rounded-full blur-md" />
              
              {/* Cute 3D Baby Bottle & Heart Emoji */}
              <div className="relative flex flex-col items-center justify-center">
                <span className="text-5xl transform hover:scale-110 transition-transform filter drop-shadow-sm">
                  🍼
                </span>
                <span className="absolute -top-1 -right-2 text-xl animate-bounce" style={{ animationDuration: '2s' }}>
                  👶
                </span>
              </div>
            </div>
          </div>

          {/* Orbiting Satellite Badges */}
          <div className="absolute -top-2 -left-2 w-9 h-9 rounded-full bg-white shadow-md border border-rose-100 flex items-center justify-center text-sm animate-float-slow">
            💖
          </div>
          <div className="absolute -bottom-2 -right-1 w-9 h-9 rounded-full bg-white shadow-md border border-amber-100 flex items-center justify-center text-sm animate-float-gentle">
            💤
          </div>
        </div>

        {/* Title & App Branding */}
        <div className="space-y-1.5 px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100/80 text-rose-700 text-xs font-bold border border-rose-200/50">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>האפליקציה שלכם</span>
          </div>

          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <span>בייבי</span>
            <span className="bg-gradient-to-l from-rose-600 to-pink-500 bg-clip-text text-transparent">
              יומן
            </span>
          </h1>

          <p className="text-sm font-medium text-slate-600 max-w-xs leading-relaxed">
            מעקב האכלות, שינה, חיתולים והתפתחות
          </p>

          {babyName && (
            <p className="text-xs text-rose-600 font-bold pt-1 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>עבור {babyName} באהבה</span>
            </p>
          )}
        </div>

      </div>

      {/* Bottom Progress Bar & Sweet Note */}
      <div className="w-full max-w-xs z-10 pb-6 safe-bottom space-y-2 text-center">
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 px-1">
          <span className="text-rose-600">מכין את היומן באהבה...</span>
          <span className="font-mono text-rose-500">{progress}%</span>
        </div>

        {/* Progress Track */}
        <div className="h-2 w-full bg-rose-200/50 rounded-full overflow-hidden p-0.5 backdrop-blur-xs border border-rose-200">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 rounded-full transition-all duration-150 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] text-slate-400">
          כל הנתונים מסונכרנים אוטומטית בין המכשירים 📲
        </p>
      </div>

    </div>
  );
};
