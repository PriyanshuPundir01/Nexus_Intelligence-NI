import React, { useState, useEffect } from 'react';
import CuteDoodle from './CuteDoodle';

export default function GeminiSearchingLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Scanning multimodal vector embeddings...',
    'Searching across uploaded PDFs, Images & Links...',
    'Matching top semantic passages & verified citations...',
    'Gemini AI synthesizing high-impact response...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="gemini-searching-container">
      
      {/* Top Status Header with Cute Doodle and Rotating Gemini Sparkle */}
      <div className="gemini-searching-header">
        <CuteDoodle state="searching" size={44} />

        {/* Gemini 4-pointed Sparkle SVG */}
        <div className="gemini-sparkle-wrapper">
          <svg viewBox="0 0 24 24" width="22" height="22" className="gemini-sparkle-svg">
            <path 
              d="M12 0 C12 6.6 6.6 12 0 12 C6.6 12 12 17.4 12 24 C12 17.4 17.4 12 24 12 C17.4 12 12 6.6 12 0 Z" 
              fill="url(#geminiGrad)" 
            />
            <defs>
              <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#818cf8" />
                <stop offset="70%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="gemini-status-text">
          <span className="gemini-step-fade" key={stepIndex}>
            {steps[stepIndex]}
          </span>
        </div>
      </div>

      {/* Signature Gemini Iridescent Shimmering Glowing Wave Beam */}
      <div className="gemini-shimmer-beam" />

      {/* Shimmering Skeleton Lines */}
      <div className="gemini-skeleton-group">
        <div className="gemini-skeleton-line" style={{ width: '85%' }} />
        <div className="gemini-skeleton-line" style={{ width: '95%' }} />
        <div className="gemini-skeleton-line" style={{ width: '70%' }} />
      </div>

    </div>
  );
}
