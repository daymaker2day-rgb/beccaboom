import React, { useRef, useEffect, useState } from 'react';
import AIAssistant from './AIAssistant';

interface SpeakerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onTriangleClick?: () => void;
  showDropUp?: boolean;
  isCommentBox?: boolean;
  isVideoTools?: boolean;
}

const NUM_BARS = 16;
const BASS_END_INDEX = 3;
const MIDS_END_INDEX = 11;

interface Comment {
  user: string;
  text: string;
  id?: string;
}

const Speaker: React.FC<SpeakerProps> = ({ analyser, isPlaying, onTriangleClick, showDropUp = false, isCommentBox = false, isVideoTools = false }) => {
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
  
  // Watermark tracing state with full editing
  const [watermarkTraceMode, setWatermarkTraceMode] = useState(false);
  const [watermarkTraced, setWatermarkTraced] = useState(false);
  const [watermarkHidden, setWatermarkHidden] = useState(false);
  const [watermarkColor, setWatermarkColor] = useState('#FF00FF');
  const [watermarkThickness, setWatermarkThickness] = useState(2);
  const [watermarkOpacity, setWatermarkOpacity] = useState(100);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTraceSettings, setShowTraceSettings] = useState(false);
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

  // Watermark tool handlers with full functionality
  const handleTraceWatermark = () => {
    const newMode = !watermarkTraceMode;
    setWatermarkTraceMode(newMode);
    if (newMode) {
      setShowTraceSettings(true);
      showNotification('🎨 Trace editor opened - Use 5 buttons to customize');
    } else {
      setShowTraceSettings(false);
      showNotification('🔒 Trace editor closed');
    }
  };

  const handleSaveWatermarkTrace = () => {
    setWatermarkTraced(true);
    setWatermarkTraceMode(false);
    setShowTraceSettings(false);
    showNotification(`✅ Watermark saved - Color: ${watermarkColor}, Thickness: ${watermarkThickness}px, Opacity: ${watermarkOpacity}%`);
  };

  const handleEraseWatermark = () => {
    if (watermarkTraced) {
      setWatermarkTraced(false);
      setWatermarkTraceMode(false);
      setShowTraceSettings(false);
      showNotification('🗑️ Watermark trace erased');
    }
  };

  const handlePreviewWatermark = () => {
    showNotification(`👁️ Preview - ${watermarkColor}, ${watermarkThickness}px, ${watermarkOpacity}% opacity`);
  };

  const handleHideWatermark = () => {
    const newHidden = !watermarkHidden;
    setWatermarkHidden(newHidden);
    showNotification(newHidden ? '🔳 Watermark hidden with black box' : '📺 Watermark visible');
  };

  const handleDeleteAllWatermarks = () => {
    setWatermarkTraced(false);
    setWatermarkHidden(false);
    setWatermarkTraceMode(false);
    setShowTraceSettings(false);
    setShowColorPicker(false);
    showNotification('🗑️ All watermark data deleted');
  };

  // Video effects handler
  const handleVideoEffects = () => {
    showNotification('🎬 Video effects applied - Brightness, Contrast, Saturation adjusted');
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
              // Video Tools - Watermark tracing with 5 interactive squares + color picker
              <div className="flex flex-col h-full">
                <h3 className="text-[var(--color-accent)] font-bold text-lg mb-3 border-b-2 border-[var(--color-accent)] pb-2">
                  ⚙️ Watermark Tools
                </h3>
                
                {/* Watermark tracing mode - show 5 tiny squares with settings */}
                {showTraceSettings && (
                  <div className="mb-4 p-3 bg-[var(--color-bg-secondary)] rounded border-2 border-yellow-500">
                    <h4 className="text-[var(--color-accent)] font-semibold text-sm mb-3">Trace Editor - 5 Controls</h4>
                    
                    {/* 5 tiny squares for editing - each with a function */}
                    <div className="flex gap-2 justify-center mb-4">
                      {/* Blue - Color Picker */}
                      <button
                        className="w-7 h-7 bg-blue-500 hover:bg-blue-600 border-2 border-white rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                        title="Color (Click for picker)"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      >
                        <span className="text-white text-xs font-bold">C</span>
                      </button>
                      
                      {/* Green - Save */}
                      <button
                        className="w-7 h-7 bg-green-500 hover:bg-green-600 border-2 border-white rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                        title="Save Trace"
                        onClick={handleSaveWatermarkTrace}
                      >
                        <span className="text-white text-xs font-bold">✓</span>
                      </button>
                      
                      {/* Yellow - Preview */}
                      <button
                        className="w-7 h-7 bg-yellow-500 hover:bg-yellow-600 border-2 border-white rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                        title="Preview"
                        onClick={handlePreviewWatermark}
                      >
                        <span className="text-white text-xs font-bold">👁</span>
                      </button>
                      
                      {/* Purple - Thickness */}
                      <button
                        className="w-7 h-7 bg-purple-500 hover:bg-purple-600 border-2 border-white rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                        title="Thickness"
                        onClick={() => console.log('Show thickness control')}
                      >
                        <span className="text-white text-xs font-bold">━</span>
                      </button>
                      
                      {/* Red - Opacity */}
                      <button
                        className="w-7 h-7 bg-red-500 hover:bg-red-600 border-2 border-white rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                        title="Opacity"
                        onClick={() => console.log('Show opacity control')}
                      >
                        <span className="text-white text-xs font-bold">◐</span>
                      </button>
                    </div>

                    {/* Full Spectrum Color Picker */}
                    {showColorPicker && (
                      <div className="mb-3 p-2 bg-[var(--color-bg-primary)] rounded border border-blue-400">
                        <p className="text-xs text-[var(--color-text-secondary)] mb-2">Full Spectrum Color Picker</p>
                        <input
                          type="color"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value)}
                          className="w-full h-10 cursor-pointer rounded border-2 border-[var(--color-accent)]"
                        />
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#0077FF', '#0000FF', '#FF00FF', '#FFFFFF', '#000000'].map(color => (
                            <button
                              key={color}
                              onClick={() => setWatermarkColor(color)}
                              className="w-5 h-5 rounded border-2 border-white hover:border-yellow-300 transition-all"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-[var(--color-accent)] font-mono mt-2">Current: {watermarkColor}</p>
                      </div>
                    )}

                    {/* Thickness Control */}
                    <div className="mb-2 p-2 bg-[var(--color-bg-primary)] rounded border border-purple-400">
                      <label className="text-xs text-[var(--color-text-secondary)]">Thickness: {watermarkThickness}px</label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={watermarkThickness}
                        onChange={(e) => setWatermarkThickness(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Opacity Control */}
                    <div className="p-2 bg-[var(--color-bg-primary)] rounded border border-red-400">
                      <label className="text-xs text-[var(--color-text-secondary)]">Opacity: {watermarkOpacity}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Watermark status indicators */}
                {watermarkTraced && (
                  <div className="mb-2 p-2 bg-green-900/30 border border-green-500 rounded text-xs text-green-300">
                    ✓ Watermark trace saved with {watermarkColor} color, {watermarkThickness}px thickness, {watermarkOpacity}% opacity
                  </div>
                )}
                {watermarkHidden && (
                  <div className="mb-2 p-2 bg-yellow-900/30 border border-yellow-500 rounded text-xs text-yellow-300">
                    ✓ Watermark hidden with black box
                  </div>
                )}

                <div className="flex-1 space-y-2 overflow-y-auto">
                  <button
                    onClick={handleTraceWatermark}
                    className={`w-full p-3 text-left rounded-lg border-2 font-semibold text-sm transition-all ${
                      watermarkTraceMode
                        ? 'bg-yellow-600 text-white border-yellow-400'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] border-[var(--color-accent)]'
                    }`}
                  >
                    {watermarkTraceMode ? '◉ Editor Active' : '○ Trace Watermark'}
                  </button>
                  <button
                    onClick={handleEraseWatermark}
                    disabled={!watermarkTraced}
                    className="w-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold text-sm"
                  >
                    Erase Watermark Trace
                  </button>
                  <button
                    onClick={handleVideoEffects}
                    className="w-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all p-3 text-left rounded-lg border-2 border-[var(--color-accent)] font-semibold text-sm"
                  >
                    Video Effects
                  </button>
                  <button
                    onClick={handleHideWatermark}
                    className={`w-full p-3 text-left rounded-lg border-2 font-semibold text-sm transition-all ${
                      watermarkHidden
                        ? 'bg-gray-600 text-white border-gray-400'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] border-[var(--color-accent)]'
                    }`}
                  >
                    {watermarkHidden ? '✓ Watermark Hidden' : 'Hide Watermark with Box'}
                  </button>
                  <button
                    onClick={handleDeleteAllWatermarks}
                    className="w-full bg-red-900/50 text-red-200 hover:bg-red-700 hover:text-white transition-all p-3 text-left rounded-lg border-2 border-red-500 font-semibold text-sm"
                  >
                    🗑️ Delete All Watermarks
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
