import React from 'react';

export default function CuteDoodle({ state = 'idle', size = 70 }) {
  // state can be: 'idle', 'searching', 'happy'
  return (
    <div 
      className={`cute-doodle-container ${state}`}
      style={{ width: size, height: size, position: 'relative', display: 'inline-block' }}
    >
      <svg 
        viewBox="0 0 100 100" 
        width="100%" 
        height="100%" 
        className="doodle-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Body gradient */}
          <linearGradient id="doodleBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="doodleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#818cf8" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Ambient Halo Ring when searching */}
        {state === 'searching' && (
          <circle 
            cx="50" 
            cy="52" 
            r="42" 
            fill="none" 
            stroke="url(#doodleBodyGrad)" 
            strokeWidth="2.5" 
            strokeDasharray="8 6" 
            className="doodle-rotating-halo" 
          />
        )}

        {/* Floating Shadow */}
        <ellipse cx="50" cy="90" rx="24" ry="4" fill="rgba(0, 0, 0, 0.25)" className="doodle-ground-shadow" />

        {/* Main Body (Cute bean/blob shape) */}
        <g className="doodle-bob-group">
          {/* Antenna / Sparkle */}
          <path 
            d="M 50 24 Q 50 14 55 10" 
            fill="none" 
            stroke="#a855f7" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          <circle cx="56" cy="9" r="4.5" fill="#38bdf8" className="doodle-antenna-spark" />

          {/* Cute Body */}
          <path 
            d="M 28 42 C 28 26, 72 26, 72 42 C 75 62, 70 78, 50 78 C 30 78, 25 62, 28 42 Z" 
            fill="url(#doodleBodyGrad)" 
            filter="url(#doodleGlow)" 
          />

          {/* White Belly highlight */}
          <ellipse cx="50" cy="58" rx="14" ry="12" fill="rgba(255, 255, 255, 0.18)" />

          {/* Blushing Cheeks */}
          <circle cx="34" cy="54" r="3.5" fill="#f472b6" opacity="0.75" />
          <circle cx="66" cy="54" r="3.5" fill="#f472b6" opacity="0.75" />

          {/* Eyes */}
          {state === 'searching' ? (
            /* Curious searching eyes looking around */
            <g className="doodle-searching-eyes">
              <ellipse cx="40" cy="46" rx="3.5" ry="4.5" fill="#0f172a" />
              <circle cx="39" cy="44" r="1.5" fill="#ffffff" />
              <ellipse cx="60" cy="46" rx="3.5" ry="4.5" fill="#0f172a" />
              <circle cx="59" cy="44" r="1.5" fill="#ffffff" />
            </g>
          ) : (
            /* Happy blinking big eyes */
            <g className="doodle-eyes">
              <circle cx="41" cy="46" r="3.8" fill="#0f172a" />
              <circle cx="42.2" cy="44.8" r="1.4" fill="#ffffff" />
              <circle cx="59" cy="46" r="3.8" fill="#0f172a" />
              <circle cx="60.2" cy="44.8" r="1.4" fill="#ffffff" />
            </g>
          )}

          {/* Cute Smile */}
          {state === 'searching' ? (
            <ellipse cx="50" cy="53" rx="2.5" ry="3.2" fill="#0f172a" />
          ) : (
            <path 
              d="M 46 52 Q 50 56 54 52" 
              fill="none" 
              stroke="#0f172a" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
            />
          )}

          {/* Cute little hands */}
          <ellipse cx="24" cy="52" rx="3.5" ry="5" fill="#6366f1" transform="rotate(-15 24 52)" />
          <ellipse cx="76" cy="52" rx="3.5" ry="5" fill="#6366f1" transform="rotate(15 76 52)" />

          {/* Sparkle stars floating when searching */}
          {state === 'searching' && (
            <g className="doodle-sparkle-stars">
              <path d="M 80 28 Q 80 32 84 32 Q 80 32 80 36 Q 80 32 76 32 Q 80 32 80 28" fill="#38bdf8" />
              <path d="M 20 32 Q 20 35 23 35 Q 20 35 20 38 Q 20 35 17 35 Q 20 35 20 32" fill="#f472b6" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
