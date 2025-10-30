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
  
  // Draggable and resizable popup state
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 320, y: window.innerHeight / 2 - 240 });
  const [size, setSize] = useState({ width: 640, height: 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      } else if (isResizing) {
        setSize({
          width: Math.max(400, e.clientX - position.x),
          height: Math.max(300, e.clientY - position.y)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, position]);
  
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

      {/* Small black triangle at bottom center - clickable area */}
      <div 
        className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-[100] cursor-pointer group"
        onClick={onTriangleClick}
        title={isCommentBox ? "Comments" : "Click for options"}
        style={{ width: '32px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Triangle using div */}
        <div
          className="w-0 h-0 group-hover:opacity-80 transition-opacity"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid black'
          }}
        ></div>
      </div>

        {/* Drop-up menu */}
        {showDropUp && (
          <div 
            className="fixed bg-[var(--color-bg-primary)] border-4 border-[var(--color-accent)] rounded-lg shadow-2xl p-6 z-[99999] overflow-hidden select-none"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
              boxShadow: '0 0 50px rgba(0,0,0,0.8), 0 0 100px var(--color-accent)',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).tagName !== 'INPUT' &&
                  (e.target as HTMLElement).tagName !== 'BUTTON' &&
                  (e.target as HTMLElement).tagName !== 'A' &&
                  (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                setIsDragging(true);
                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
              }
            }}
          >
            {/* Subtle resize handle in bottom-right corner */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-20 hover:opacity-60 transition-opacity z-[100000]"
              style={{
                background: 'linear-gradient(135deg, transparent 50%, var(--color-accent) 50%)'
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
              }}
            />

            {isCommentBox ? (
              // Comments panel
              <div className="flex flex-col h-full">
                <h3 className="text-[var(--color-accent)] font-bold text-lg mb-3 border-b-2 border-[var(--color-accent)] pb-2">
                  💬 Comments
                </h3>
                <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-2">
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-accent)]">
                      <div className="text-[var(--color-accent)] font-semibold text-sm">{comment.user}</div>
                      <div className="text-[var(--color-text-primary)] text-sm">{comment.text}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && commentText.trim()) {
                        setComments([...comments, { user: 'You', text: commentText }]);
                        setCommentText('');
                      }
                    }}
                    placeholder="Add comment... (Ctrl+Enter to post)"
                    className="flex-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] px-3 py-2 rounded border border-[var(--color-accent)] focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      if (commentText.trim()) {
                        setComments([...comments, { user: 'You', text: commentText }]);
                        setCommentText('');
                      }
                    }}
                    className="bg-[var(--color-accent)] text-[var(--color-bg-primary)] px-4 py-2 rounded font-bold hover:opacity-90"
                  >
                    Post
                  </button>
                </div>
              </div>
            ) : (
              // Default options
              <div className="flex flex-col gap-3">
                <h3 className="text-[var(--color-accent)] font-bold text-lg mb-2 border-b-2 border-[var(--color-accent)] pb-2">
                  🔧 Speaker Settings
                </h3>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  🎵 Audio Settings
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  🎛️ Equalizer
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  🔊 Speaker Test
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  📢 Volume Boost
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default Speaker;
