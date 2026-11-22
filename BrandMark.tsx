import React from 'react';

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 34, showWordmark = true, compact = false }) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="avnBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0E213B" />
            <stop offset="100%" stopColor="#050B16" />
          </linearGradient>
          <linearGradient id="avnGold" x1="12" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5DF98" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#A6821E" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#avnBg)" />
        <polygon points="32,6 55,19 55,45 32,58 9,45 9,19" stroke="url(#avnGold)" strokeWidth="2" fill="none" />
        <path d="M17 44L27 18L32 30L37 18L47 44" stroke="url(#avnGold)" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M23.5 32L32 46L40.5 32" stroke="#F8FAFC" strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
      {showWordmark && (
        <span
          className={`font-display font-extrabold tracking-[0.12em] whitespace-nowrap shrink-0 ${
            compact ? 'text-sm' : 'text-base'
          } text-slate-900 dark:text-white`}
        >
          AAK<span className="text-[#B89223] dark:text-[#D4AF37]">NOVA</span>
        </span>
      )}
    </div>
  );
};
