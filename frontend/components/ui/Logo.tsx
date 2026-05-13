"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number | string;
  withText?: boolean;
}

export function Logo({ className, size = 40, withText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div 
        className="relative flex items-center justify-center transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-110"
        style={{ width: size, height: size }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-brand/30 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full drop-shadow-2xl"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1D9E75" />
              <stop offset="100%" stopColor="#085041" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2" />
            </filter>
          </defs>
          
          {/* Main Shield Shape */}
          <path
            d="M50 5 L10 25 V55 C10 75 50 95 50 95 C50 95 90 75 90 55 V25 L50 5Z"
            fill="url(#logoGradient)"
          />
          
          {/* Stylized Ghost/Check Silhouette */}
          <path
            d="M35 50 C35 35 45 25 50 25 C55 25 65 35 65 50 C65 65 55 75 50 75 C45 75 35 65 35 50ZM35 50 C35 65 25 75 25 75 M65 50 C65 65 75 75 75 75"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeOpacity="0.15"
          />
          
          {/* Inner Shield / Checkmark */}
          <path
            d="M35 52 L45 62 L65 38"
            stroke="white"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {withText && (
        <span className="text-2xl font-black tracking-tight text-ink dark:text-white select-none">
          Ghost<span className="text-brand">Guard</span>
        </span>
      )}
    </div>
  );
}
