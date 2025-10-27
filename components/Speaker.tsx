import React, { useRef, useEffect, useState } from 'react';

interface SpeakerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  showTriangle?: boolean;
  onTriangleClick?: () => void;
  showDropUp?: boolean;
}

const NUM_BARS = 16;

// Define frequency band boundaries for nuanced scaling
const BASS_END_INDEX = 3; // First 4 bars for bass
const MIDS_END_INDEX = 11; // Next 8 bars for mids

const Speaker: React.FC<SpeakerProps> = ({ analyser, isPlaying, showTriangle = false, onTriangleClick, showDropUp = false }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number>();
  const [barColor, setBarColor] = useState('var(--color-accent)');

  useEffect(() => {
    const newColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
    setBarColor(newColor);
  }, [isPlaying]);

  useEffect(() => {
    barRefs.current = barRefs.current.slice(0, NUM_BARS);
  }, []);

  useEffect(() => {
    if (analyser && isPlaying) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        
        const sliceWidth = Math.floor(dataArray.length / NUM_BARS);
        
        barRefs.current.forEach((bar, index) => {
            if (bar) {
                const start = index * sliceWidth;
                const end = start + sliceWidth;
                let sum = 0;
                for(let j = start; j < end; j++) {
                    sum += dataArray[j];
                }
                const average = sum / sliceWidth;
                const normalizedValue = average / 255.0;

                let scaledHeight;

                // Apply different animation scales for different frequency bands
                if (index <= BASS_END_INDEX) {
                    // Bass: Emphasize the "punch". Lower values are squashed, high values are boosted.
                    scaledHeight = Math.pow(normalizedValue, 2.5) * 100;
                } else if (index <= MIDS_END_INDEX) {
                    // Mids: More linear response to represent the body of the sound.
                    scaledHeight = normalizedValue * 100;
                } else {
                    // Treble: Make it more sensitive to capture high-frequency details.
                    scaledHeight = Math.sqrt(normalizedValue) * 100;
                }
                
                const height = Math.max(2, Math.min(100, scaledHeight));
                bar.style.height = `${height}%`;
                
                const opacity = 0.6 + (height / 100) * 0.4;
                bar.style.backgroundColor = barColor;
                bar.style.opacity = `${opacity}`;
            }
        });
        
        animationFrameId.current = requestAnimationFrame(animate);
      };
      
      animate();

    } else {
        barRefs.current.forEach(bar => {
            if(bar) {
                bar.style.height = '2%';
                bar.style.opacity = '0.6';
            }
        })
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, isPlaying, barColor]);


  return (
    <div className="w-full h-full bg-[var(--color-bg-secondary)] flex items-center justify-center p-2 shadow-inner border-4 border-black rounded-2xl">
      <div className="w-full h-full rounded-lg bg-[var(--color-bg-primary)] flex items-center justify-around relative overflow-hidden p-1 sm:p-2 lg:p-3 gap-px sm:gap-1">
        {/* Grille effect */}
        <div className="absolute inset-0 bg-repeat" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.7) 1px, transparent 1px)', backgroundSize: '100% 3%' }}></div>
        
        {/* Visualizer Bars */}
        {Array.from({ length: NUM_BARS }).map((_, index) => (
            <div key={index} className="h-full w-full flex flex-col-reverse">
                <div
                    ref={el => barRefs.current[index] = el}
                    className="w-full bg-[var(--color-accent)] rounded-t-sm"
                    style={{
                        height: '2%',
                        opacity: '0.6',
                        transition: 'height 50ms linear, opacity 50ms linear'
                    }}
                />
            </div>
        ))}
        
        {/* Small black triangle at bottom center */}
        {showTriangle && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
            <button 
              onClick={onTriangleClick}
              className="w-0 h-0 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '8px solid black'
              }}
              title="Click for options"
            ></button>
            
            {/* Drop-up menu */}
            {showDropUp && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[var(--color-bg-primary)] border-2 border-[var(--color-accent)] rounded-lg shadow-2xl p-3 z-20 w-40">
                <div className="flex flex-col gap-2 text-xs">
                  <button className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors p-1 text-left">
                    Audio Settings
                  </button>
                  <button className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors p-1 text-left">
                    Equalizer
                  </button>
                  <button className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors p-1 text-left">
                    Speaker Test
                  </button>
                  <button className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors p-1 text-left">
                    Volume Boost
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Speaker;