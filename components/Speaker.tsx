import React, { useRef, useEffect, useState } from 'react';

interface SpeakerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const NUM_BARS = 16;
const BASS_END_INDEX = 3;
const MIDS_END_INDEX = 11;

const Speaker: React.FC<SpeakerProps> = ({ analyser, isPlaying }) => {
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
            if (index <= BASS_END_INDEX) {
              // Bass frequencies: enhanced scaling
              scaledHeight = Math.pow(normalizedValue, 2.5) * 100;
            } else if (index <= MIDS_END_INDEX) {
              // Mid frequencies: normal scaling
              scaledHeight = normalizedValue * 100;
            } else {
              // High frequencies: slightly reduced scaling
              scaledHeight = Math.sqrt(normalizedValue) * 100;
            }
            
            const height = Math.max(2, Math.min(100, scaledHeight));
            bar.style.height = `${height}%`;
            bar.style.backgroundColor = barColor;
          }
        });

        animationFrameId.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    } else {
      barRefs.current.forEach(bar => {
        if (bar) {
          bar.style.height = '2%';
        }
      });
    }
  }, [analyser, isPlaying, barColor]);

  return (
    <div className="w-48 h-48 bg-[var(--color-surface)] rounded-lg border-2 border-black/50 shadow-inner flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-40 h-40 bg-black rounded-lg border-4 border-[var(--color-accent)] shadow-lg flex items-center justify-center overflow-hidden">
          <div className="flex justify-center items-end h-full w-full gap-1 p-2">
            {Array(NUM_BARS).fill(null).map((_, i) => (
              <div
                key={i}
                ref={el => barRefs.current[i] = el}
                className="w-1.5 bg-[var(--color-accent)] rounded-t transition-all duration-[50ms]"
                style={{ height: '2%' }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Small black triangle at bottom center */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-[100]">
        <button
          className="w-0 h-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid black'
          }}
          title="Speaker options"
        ></button>
      </div>
    </div>
  );
};

export default Speaker;
