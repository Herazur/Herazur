import React from 'react';
import { motion } from 'framer-motion';

const GiftLevelIndicator = ({ level = 1, xp = 0 }) => {
  const xpForNextLevel = level * 1000;
  const progress = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-10 h-10 group" title={`Level ${level} | XP: ${xp} / ${xpForNextLevel}`}>
      <svg className="w-full h-full" viewBox="0 0 44 44">
        <circle
          className="text-muted/30"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="22"
          cy="22"
        />
        <motion.circle
          className="text-pink-500 drop-shadow-[0_0_3px_rgba(236,72,153,0.8)]"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="22"
          cy="22"
          transform="rotate(-90 22 22)"
          style={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{level}</span>
      </div>
    </div>
  );
};

export default GiftLevelIndicator;