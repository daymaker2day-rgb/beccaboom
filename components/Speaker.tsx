import React, { useRef, useEffect, useState } from 'react';
import AIAssistant from './AIAssistant';

interface SpeakerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onTriangleClick?: () => void;
  showDropUp?: boolean;
  isCommentBox?: boolean;
  isVideoTools?: boolean;
  onWatermarkChange?: (watermarkData: {
    color: string;
    thickness: number;
    opacity: number;
    traced: boolean;
    hidden: boolean;
  }) => void;
}

const NUM_BARS = 16;
const BASS_END_INDEX = 3;
const MIDS_END_INDEX = 11;

interface Comment {
  user: string;
  text: string;
  id?: string;
}

const Speaker: React.FC<SpeakerProps> = ({ analyser, isPlaying, onTriangleClick, showDropUp = false, isCommentBox = false, isVideoTools = false, onWatermarkChange }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number>();
  const [barColor, setBarColor] = useState('var(--color-accent)');
  const [commentText, setCommentText] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', user: 'User123', text: 'Love this track! 🔥' },
    { id: '2', user: 'MusicFan', text: 'Amazing vocals!' },
    { id: '3', user: 'BeccaFan', text: "Can't stop listening! 💕" }
  ]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  
  // Watermark state
  const [watermarkTraced, setWatermarkTraced] = useState(false);
  const [watermarkHidden, setWatermarkHidden] = useState(false);
  const [watermarkColor, setWatermarkColor] = useState('#FF00FF');
  const [watermarkThickness, setWatermarkThickness] = useState(2);
  const [watermarkOpacity, setWatermarkOpacity] = useState(100);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Notification helper
  const showNotification = (message: string, duration = 3000) => {
    setNotification(message);
    console.log('✅ Action:', message);
    setTimeout(() => setNotification(null), duration);
  };
  
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
  
  // Comment management functions
  const handleDeleteComment = (id: string | undefined) => {
    if (!id) return;
    setComments(comments.filter(c => c.id !== id));
    showNotification('💬 Comment deleted');
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id || '');
    setEditingText(comment.text);
    showNotification('✏️ Editing comment');
  };

  const handleSaveComment = (id: string | undefined) => {
    if (!id) return;
    setComments(comments.map(c => c.id === id ? { ...c, text: editingText } : c));
    setEditingCommentId(null);
    setEditingText('');
    showNotification('💾 Comment saved');
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        user: 'You',
        text: commentText
      };
      setComments([...comments, newComment]);
      setCommentText('');
      showNotification('📝 Comment posted');
    }
  };

  // Watermark handlers - simplified
  const handleEraseWatermark = () => {
    if (watermarkTraced) {
      setWatermarkTraced(false);
      showNotification('🗑️ Watermark removed');
      
      if (onWatermarkChange) {
        onWatermarkChange({
          color: watermarkColor,
          thickness: watermarkThickness,
          opacity: watermarkOpacity,
          traced: false,
          hidden: watermarkHidden
        });
      }
    }
  };

  const handleHideWatermark = () => {
    const newHidden = !watermarkHidden;
    setWatermarkHidden(newHidden);
    showNotification(newHidden ? '� Watermark hidden' : '�️ Watermark visible');
    
    if (onWatermarkChange) {
      onWatermarkChange({
        color: watermarkColor,
        thickness: watermarkThickness,
        opacity: watermarkOpacity,
        traced: watermarkTraced,
        hidden: newHidden
      });
    }
  };

  const handleDeleteAllWatermarks = () => {
    setWatermarkTraced(false);
    setWatermarkHidden(false);
    showNotification('🗑️ Watermark deleted');
    
    if (onWatermarkChange) {
      onWatermarkChange({
        color: watermarkColor,
        thickness: watermarkThickness,
        opacity: watermarkOpacity,
        traced: false,
        hidden: false
      });
    }
  };

  // Color picker helper
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
  };

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

            {isAIMode ? (
              // AI Assistant Panel
              <AIAssistant onClose={() => setIsAIMode(false)} />
            ) : isCommentBox ? (
              // Comments panel
              <div className="flex flex-col h-full">
                <h3 className="text-[var(--color-accent)] font-bold text-lg mb-3 border-b-2 border-[var(--color-accent)] pb-2">
                  💬 Comments
                </h3>
                <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-accent)]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[var(--color-accent)] font-semibold text-sm">{comment.user}</div>
                        {comment.user === 'You' && (
                          <div className="flex gap-1">
                            {editingCommentId === comment.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveComment(comment.id)}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-2 py-1 rounded border border-[var(--color-accent)] text-sm resize-none"
                          rows={2}
                        />
                      ) : (
                        <div className="text-[var(--color-text-primary)] text-sm">{comment.text}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && commentText.trim()) {
                        handleAddComment();
                      }
                    }}
                    placeholder="Add comment... (Ctrl+Enter to post)"
                    className="flex-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] px-3 py-2 rounded border border-[var(--color-accent)] focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleAddComment}
                    className="bg-[var(--color-accent)] text-[var(--color-bg-primary)] px-4 py-2 rounded font-bold hover:opacity-90"
                  >
                    Post
                  </button>
                </div>
              </div>
            ) : isVideoTools ? (
              // Video Tools - Simple, minimal watermark editor with real-time preview
              <div className="flex flex-col h-full gap-3">
                <h3 className="text-[var(--color-accent)] font-bold text-lg border-b-2 border-[var(--color-accent)] pb-2">
                  🎨 Watermark Editor
                </h3>
                
                {/* Status */}
                <div className={`p-2 rounded text-xs font-semibold text-center ${watermarkTraced ? 'bg-green-900/30 text-green-300 border border-green-500' : 'bg-gray-900/30 text-gray-300 border border-gray-500'}`}>
                  {watermarkTraced ? '✓ WATERMARK ACTIVE' : '○ No watermark yet'}
                </div>

                {/* Color Picker - Always visible for real-time updates */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-blue-400">
                  <label className="text-xs text-[var(--color-text-secondary)] block mb-2">Color</label>
                  <input
                    type="color"
                    value={watermarkColor}
                    onChange={(e) => {
                      setWatermarkColor(e.target.value);
                      // Update parent in real-time if already traced
                      if (watermarkTraced && onWatermarkChange) {
                        onWatermarkChange({
                          color: e.target.value,
                          thickness: watermarkThickness,
                          opacity: watermarkOpacity,
                          traced: true,
                          hidden: watermarkHidden
                        });
                      }
                    }}
                    className="w-full h-8 cursor-pointer rounded border border-[var(--color-accent)]"
                  />
                  <div className="mt-2 flex gap-1 flex-wrap justify-center">
                    {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          setWatermarkColor(color);
                          if (watermarkTraced && onWatermarkChange) {
                            onWatermarkChange({
                              color,
                              thickness: watermarkThickness,
                              opacity: watermarkOpacity,
                              traced: true,
                              hidden: watermarkHidden
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border border-white hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Thickness - Real-time update */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-purple-400">
                  <label className="text-xs text-[var(--color-text-secondary)]">Size: {watermarkThickness}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={watermarkThickness}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWatermarkThickness(val);
                      if (watermarkTraced && onWatermarkChange) {
                        onWatermarkChange({
                          color: watermarkColor,
                          thickness: val,
                          opacity: watermarkOpacity,
                          traced: true,
                          hidden: watermarkHidden
                        });
                      }
                    }}
                    className="w-full"
                  />
                </div>

                {/* Opacity - Real-time update */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-red-400">
                  <label className="text-xs text-[var(--color-text-secondary)]">Opacity: {watermarkOpacity}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={watermarkOpacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWatermarkOpacity(val);
                      if (watermarkTraced && onWatermarkChange) {
                        onWatermarkChange({
                          color: watermarkColor,
                          thickness: watermarkThickness,
                          opacity: val,
                          traced: true,
                          hidden: watermarkHidden
                        });
                      }
                    }}
                    className="w-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex-1 space-y-2 flex flex-col">
                  {/* Apply/Create Watermark */}
                  <button
                    onClick={() => {
                      setWatermarkTraced(true);
                      showNotification('✅ Watermark applied - See it on video!');
                      if (onWatermarkChange) {
                        onWatermarkChange({
                          color: watermarkColor,
                          thickness: watermarkThickness,
                          opacity: watermarkOpacity,
                          traced: true,
                          hidden: watermarkHidden
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg border-2 border-green-400 text-sm transition-all"
                  >
                    ✓ Apply Watermark
                  </button>

                  {/* Remove Watermark */}
                  <button
                    onClick={handleEraseWatermark}
                    disabled={!watermarkTraced}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg border-2 border-red-400 text-sm transition-all"
                  >
                    ✕ Remove Watermark
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    onClick={handleHideWatermark}
                    disabled={!watermarkTraced}
                    className={`font-bold py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                      watermarkHidden
                        ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {watermarkHidden ? '👁️ Show' : '🚫 Hide'}
                  </button>
                </div>
              </div>
            ) : (
              // Default speaker options
              <div className="flex flex-col gap-3">
                <h3 className="text-[var(--color-accent)] font-bold text-lg mb-2 border-b-2 border-[var(--color-accent)] pb-2">
                  Speaker Settings
                </h3>
                <button 
                  onClick={() => setIsAIMode(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 transition-all p-3 text-left rounded-lg border-2 border-purple-400 font-semibold flex items-center gap-2 justify-center"
                >
                  🤖 AI Boombox Assistant
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  Audio Settings
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  Equalizer
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  Speaker Test
                </button>
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold">
                  Volume Boost
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notification display */}
        {notification && (
          <div className="fixed top-4 right-4 bg-[var(--color-bg-secondary)] text-[var(--color-accent)] px-4 py-3 rounded-lg border-2 border-[var(--color-accent)] shadow-2xl z-[100000] max-w-xs animate-pulse">
            {notification}
          </div>
        )}
    </div>
  );
};

export default Speaker;
