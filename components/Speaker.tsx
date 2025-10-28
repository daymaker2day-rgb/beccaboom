import React, { useRef, useEffect, useState } from 'react';
import AsteroidsGame from './AsteroidsGame';

interface SpeakerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  showTriangle?: boolean;
  onTriangleClick?: () => void;
  showDropUp?: boolean;
  isCommentBox?: boolean;
  isWebPanel?: boolean;
  isBrowser?: boolean;
  isAsteroidsGame?: boolean;
}

const NUM_BARS = 16;

// Define frequency band boundaries for nuanced scaling
const BASS_END_INDEX = 3; // First 4 bars for bass
const MIDS_END_INDEX = 11; // Next 8 bars for mids

const Speaker: React.FC<SpeakerProps> = ({ analyser, isPlaying, showTriangle = true, onTriangleClick, showDropUp = false, isCommentBox = false, isWebPanel = false, isBrowser = false, isAsteroidsGame = false }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number>();
  const [barColor, setBarColor] = useState('var(--color-accent)');
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 320, y: window.innerHeight / 2 - 240 });
  const [size, setSize] = useState({ width: 640, height: 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [url, setUrl] = useState('https://www.google.com');
  const [showWatermarkCover, setShowWatermarkCover] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { user: 'User123', text: 'Love this track! 🔥' },
    { user: 'MusicFan', text: 'Amazing vocals!' },
    { user: 'BeccaFan', text: "Can't stop listening! 💕" }
  ]);

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
    <div className="w-full h-full bg-[var(--color-bg-secondary)] flex items-center justify-center p-2 shadow-inner border-4 border-black rounded-2xl relative">
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
        
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-[100]">
          {/* <button
            onClick={onTriangleClick}
            className="w-0 h-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '10px solid black'
            }}
            title={isCommentBox ? "Comments" : isWebPanel ? "Web Links" : "Speaker options"}
          ></button> */}
        </div>
        
        {/* Drop-up menu - DRAGGABLE & RESIZABLE */}
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
                  (e.target as HTMLElement).tagName !== 'IFRAME') {
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
            
            {isBrowser ? (
              <div className="flex flex-col h-full">
                {/* Browser address bar */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[var(--color-accent)]">
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const iframe = document.getElementById('browser-iframe') as HTMLIFrameElement;
                        if (iframe) iframe.src = url;
                      }
                    }}
                    className="flex-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] px-3 py-2 rounded border-2 border-[var(--color-accent)] text-sm focus:outline-none focus:border-[var(--color-accent-light)]"
                    placeholder="Enter URL..."
                  />
                  <button 
                    onClick={() => {
                      const iframe = document.getElementById('browser-iframe') as HTMLIFrameElement;
                      if (iframe) iframe.src = url;
                    }}
                    className="bg-[var(--color-accent)] text-[var(--color-bg-primary)] px-4 py-2 rounded font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Go
                  </button>
                </div>
                {/* Browser iframe */}
                <div className="flex-1 bg-white rounded overflow-hidden relative">
                  <iframe 
                    id="browser-iframe"
                    src={url}
                    className="w-full h-full border-0"
                    title="Browser"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                  
                  {/* Watermark cover toggle - small triangle in bottom right */}
                  <div className="absolute bottom-2 right-2 z-[100001]">
                    <button
                      onClick={() => setShowWatermarkCover(!showWatermarkCover)}
                      className="w-0 h-0 cursor-pointer hover:opacity-70 transition-opacity"
                      style={{
                        borderLeft: '12px solid transparent',
                        borderRight: '12px solid transparent',
                        borderTop: '15px solid rgba(0,0,0,0.7)'
                      }}
                      title="Toggle watermark cover"
                    ></button>
                  </div>
                  
                  {/* Black box to cover watermarks */}
                  {showWatermarkCover && (
                    <div 
                      className="absolute bottom-0 right-0 bg-black z-[100000]"
                      style={{ width: '200px', height: '80px' }}
                    />
                  )}
                </div>
              </div>
            ) : isCommentBox ? (
              <div className="flex flex-col h-full">
                <h3 className="text-[var(--color-accent)] font-bold text-xl mb-3 border-b-2 border-[var(--color-accent)] pb-2">
                  💬 Comments
                </h3>
                <div className="flex-1 overflow-y-auto mb-3 space-y-3 pr-2">
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border-2 border-[var(--color-accent)] shadow-md">
                      <div className="text-[var(--color-accent)] font-semibold text-base mb-2">{comment.user}</div>
                      <div className="text-[var(--color-text-primary)] text-base leading-relaxed">{comment.text}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
                    placeholder="Add a comment..." 
                    className="flex-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] px-4 py-3 rounded border-2 border-[var(--color-accent)] text-base focus:outline-none focus:border-[var(--color-accent-light)]"
                  />
                  <button 
                    onClick={() => {
                      if (commentText.trim()) {
                        setComments([...comments, { user: 'You', text: commentText }]);
                        setCommentText('');
                      }
                    }}
                    className="bg-[var(--color-accent)] text-[var(--color-bg-primary)] px-6 py-3 rounded font-bold text-base hover:opacity-90 transition-opacity"
                  >
                    Post
                  </button>
                </div>
              </div>
            ) : isAsteroidsGame ? (
              <div className="h-full w-full overflow-hidden bg-black">
                <AsteroidsGame />
              </div>
            ) : isWebPanel ? (
              <div className="flex flex-col h-full">
                <h3 className="text-[var(--color-accent)] font-bold text-xl mb-3 border-b-2 border-[var(--color-accent)] pb-2">
                  🌐 Web Links
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  <a 
                    href="https://www.youtube.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-[var(--color-bg-secondary)] p-4 rounded-lg border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all group"
                  >
                    <div className="font-bold text-base mb-1">🎥 YouTube</div>
                    <div className="text-sm opacity-80">Visit YouTube</div>
                  </a>
                  <a 
                    href="https://www.instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-[var(--color-bg-secondary)] p-4 rounded-lg border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all"
                  >
                    <div className="font-bold text-base mb-1">📸 Instagram</div>
                    <div className="text-sm opacity-80">Follow on Instagram</div>
                  </a>
                  <a 
                    href="https://open.spotify.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-[var(--color-bg-secondary)] p-4 rounded-lg border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all"
                  >
                    <div className="font-bold text-base mb-1">🎵 Spotify</div>
                    <div className="text-sm opacity-80">Stream on Spotify</div>
                  </a>
                  <a 
                    href="https://www.tiktok.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-[var(--color-bg-secondary)] p-4 rounded-lg border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all"
                  >
                    <div className="font-bold text-base mb-1">🎬 TikTok</div>
                    <div className="text-sm opacity-80">Watch on TikTok</div>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-[var(--color-accent)] font-bold text-xl mb-4 border-b-2 border-[var(--color-accent)] pb-2">
                    🔧 Speaker Settings
                  </h3>
                  <div className="flex flex-col gap-3">
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