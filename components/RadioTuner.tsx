
import React from 'react';
import { RadioMode } from '../types';

interface RadioTunerProps {
  mode: RadioMode;
}

const RadioTuner: React.FC<RadioTunerProps> = ({ mode }) => {
  const isFM = mode === 'FM';
  const min = isFM ? 88 : 540;
  const max = isFM ? 108 : 1700;
  const step = isFM ? 2 : 100;
  const currentFreq = isFM ? 98.7 : 1010;

  const percentage = ((currentFreq - min) / (max - min)) * 100;

  const markers = [];
  for (let i = min; i <= max; i += step) {
    markers.push(i);
  }

  return (
    <div className="bg-black/50 border-2 border-[var(--color-bg-secondary)] rounded-lg p-2 shadow-inner">
        <div className="flex justify-between text-[var(--color-text-display)] text-xs font-mono">
            <span>{min}</span>
            <span>{isFM ? 'FM (MHz)' : 'AM (kHz)'}</span>
            <span>{max}</span>
        </div>
        <div className="h-8 w-full bg-gradient-to-r from-black via-[var(--color-text-display)] to-black rounded-sm mt-1 relative flex items-center justify-between px-2 opacity-70">
            {/* Ticks */}
            {markers.map((m, i) => (
                <div key={i} className="h-4 w-px bg-black opacity-50"></div>
            ))}
            {/* Needle */}
            <div 
                className="absolute top-0 bottom-0 w-1 bg-[var(--color-accent-dark)] shadow-lg"
                style={{ left: `calc(${percentage}% - 2px)` }}
            ></div>
        </div>
    </div>
  );
};

export default RadioTuner;