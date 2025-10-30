import React, { useRef, useEffect, useState } from 'react';

interface SpeakerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onTriangleClick?: () => void;
  showDropUp?: boolean;
  isCommentBox?: boolean;
}

const NUM_BARS = 16;
const BASS_END_INDEX = 3;
const MIDS_END_INDEX = 11;

const Speaker: React.FC<SpeakerProps> = ({ analyser, isPlaying, onTriangleClick, showDropUp = false, isCommentBox = false }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number>();
  const [barColor, setBarColor] = useState('var(--color-accent)');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { user: 'User123', text: 'Love this track! 🔥' },
    { user: 'MusicFan', text: 'Amazing vocals!' },
    { user: 'BeccaFan', text: "Can't stop listening! 💕" }
  ]);
  
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
          onClick={onTriangleClick}
          className="w-0 h-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid black'
          }}
          title={isCommentBox ? "Comments" : "Click for options"}
        ></button>

        {/* Drop-up menu */}
        {showDropUp && (
          <div className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[var(--color-bg-primary)] border-2 border-[var(--color-accent)] rounded-lg shadow-2xl p-4 z-20 ${isCommentBox ? 'w-96' : 'w-40'}`}>
            {isCommentBox ? (
              // Comments panel
              <div className="flex flex-col h-96">
                <h3 className="text-[var(--color-accent)] font-bold text-lg mb-3 border-b-2 border-[var(--color-accent)] pb-2">
                  💬 Comments
                </h3>
                <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-2">
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-accent)] text-sm">
                      <div className="text-[var(--color-accent)] font-semibold">{comment.user}</div>
                      <div className="text-[var(--color-text-primary)] text-xs">{comment.text}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentText.trim()) {
                        setComments([...comments, { user: 'You', text: commentText }]);
                        setCommentText('');
                      }
                    }}
                    placeholder="Add comment..."
                    className="flex-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] px-2 py-1 rounded border border-[var(--color-accent)] text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (commentText.trim()) {
                        setComments([...comments, { user: 'You', text: commentText }]);
                        setCommentText('');
                      }
                    }}
                    className="bg-[var(--color-accent)] text-[var(--color-bg-primary)] px-3 py-1 rounded font-bold text-xs hover:opacity-90"
                  >
                    Post
                  </button>
                </div>
              </div>
            ) : (
              // Default options
              <div className="flex flex-col gap-2">
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-2 text-left rounded border border-[var(--color-accent)] text-sm font-semibold">
                  🎵 Audio Settings
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-2 text-left rounded border border-[var(--color-accent)] text-sm font-semibold">
                  🔊 Speaker Test
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-2 text-left rounded border border-[var(--color-accent)] text-sm font-semibold">
                  ⚙️ Settings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Speaker;
