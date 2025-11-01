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
  
  // Load comments from localStorage on mount
  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_comments');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading comments:', e);
    }
    // Default comments if nothing saved
    return [
      { id: '1', user: 'User123', text: 'Love this track! 🔥' },
      { id: '2', user: 'MusicFan', text: 'Amazing vocals!' },
      { id: '3', user: 'BeccaFan', text: "Can't stop listening! 💕" }
    ];
  });
  
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  
  // Save comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('beccabear@13_comments', JSON.stringify(comments));
      console.log('💾 Comments saved for beccabear@13');
    } catch (e) {
      console.error('Error saving comments:', e);
    }
  }, [comments]);
  
  // Advanced Watermark State
  const [watermarkTraced, setWatermarkTraced] = useState(false);
  const [watermarkHidden, setWatermarkHidden] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CLIDEO');
  const [watermarkShape, setWatermarkShape] = useState<'text' | 'square' | 'circle'>('text');
  const [watermarkColor, setWatermarkColor] = useState('#FF00FF');
  const [watermarkThickness, setWatermarkThickness] = useState(2);
  const [watermarkOpacity, setWatermarkOpacity] = useState(100);
  
  // Position and Angle Control - Default to CENTER so users can move anywhere
  const [watermarkX, setWatermarkX] = useState(50);  // 0-100% of width (50 = center)
  const [watermarkY, setWatermarkY] = useState(50);  // 0-100% of height (50 = center)
  const [watermarkAngle, setWatermarkAngle] = useState(0);  // 0-360 degrees
  const [watermarkSize, setWatermarkSize] = useState(80);  // 10-200px
  
  // Multi-layer watermark support
  interface WatermarkLayer {
    id: string;
    type: 'text' | 'square' | 'circle';
    text: string;
    color: string;
    thickness: number;
    opacity: number;
    x: number;
    y: number;
    angle: number;
    size: number;
    visible: boolean;
  }
  
  // Load watermark layers from localStorage on mount
  const [watermarkLayers, setWatermarkLayers] = useState<WatermarkLayer[]>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_watermarks');
      if (saved) {
        const layers = JSON.parse(saved);
        console.log('💾 Loaded', layers.length, 'watermark layers for beccabear@13');
        return layers;
      }
    } catch (e) {
      console.error('Error loading watermark layers:', e);
    }
    return [];
  });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  // Auto-save watermark layers to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('beccabear@13_watermarks', JSON.stringify(watermarkLayers));
      console.log('💾 Watermark layers saved for beccabear@13:', watermarkLayers.length, 'layers');
    } catch (e) {
      console.error('Error saving watermark layers:', e);
    }
  }, [watermarkLayers]);
  
  const [notification, setNotification] = useState<string | null>(null);
  
  // Notification helper
  const showNotification = (message: string, duration = 3000) => {
    setNotification(message);
    console.log('✅ Action:', message);
    setTimeout(() => setNotification(null), duration);
  };
  
  // Draggable and resizable popup state - responsive sizing
  const getInitialSize = () => {
    if (window.innerWidth < 640) {
      return { width: Math.min(window.innerWidth - 20, 380), height: Math.min(window.innerHeight - 60, 420) };
    }
    return { width: 640, height: 480 };
  };

  const getInitialPosition = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const size = getInitialSize();
    return { 
      x: Math.max(10, windowWidth / 2 - size.width / 2),
      y: Math.max(10, windowHeight / 2 - size.height / 2)
    };
  };

  const [position, setPosition] = useState(getInitialPosition());
  const [size, setSize] = useState(getInitialSize());
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

  // Multi-layer Watermark Handlers
  const addWatermarkLayer = (type: 'text' | 'square' | 'circle' = 'text') => {
    const newLayer = {
      id: Date.now().toString(),
      type,
      text: type === 'text' ? 'CLIDEO' : '',
      color: '#FF00FF',
      thickness: 2,
      opacity: 100,
      x: 50,
      y: 50,
      angle: 0,
      size: 80,
      visible: true
    };
    setWatermarkLayers([...watermarkLayers, newLayer]);
    setSelectedLayerId(newLayer.id);
    showNotification(`➕ Added ${type} layer`);
  };

  const deleteWatermarkLayer = (layerId: string) => {
    setWatermarkLayers(watermarkLayers.filter(l => l.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(watermarkLayers.length > 1 ? watermarkLayers[0].id : null);
    }
    showNotification('🗑️ Layer deleted');
  };

  const updateWatermarkLayer = (layerId: string, updates: any) => {
    const updatedLayers = watermarkLayers.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    setWatermarkLayers(updatedLayers);
    
    // Send real-time update to parent immediately
    if (watermarkTraced && onWatermarkChange) {
      onWatermarkChange({
        color: updatedLayers[0]?.color || '#FF00FF',
        thickness: updatedLayers[0]?.thickness || 2,
        opacity: updatedLayers[0]?.opacity || 100,
        traced: true,
        hidden: false,
        layers: updatedLayers
      } as any);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    const layer = watermarkLayers.find(l => l.id === layerId);
    if (layer) {
      updateWatermarkLayer(layerId, { visible: !layer.visible });
    }
  };

  const saveLayerAndAddNew = async () => {
    if (!selectedLayerId || !watermarkLayers.find(l => l.id === selectedLayerId)) {
      showNotification('⚠️ Select a layer first');
      return;
    }
    
    // Save current layer to user account (beccabear@13)
    const layer = watermarkLayers.find(l => l.id === selectedLayerId);
    try {
      // Save to localStorage with user key
      const savedLayers = JSON.parse(localStorage.getItem('beccabear@13_watermarks') || '[]');
      savedLayers.push(layer);
      localStorage.setItem('beccabear@13_watermarks', JSON.stringify(savedLayers));
      showNotification(`✅ Saved layer to beccabear@13`);
    } catch (error) {
      showNotification('❌ Error saving layer');
    }
    
    // Add new empty layer
    addWatermarkLayer('text');
  };

  const handleApplyAllLayers = () => {
    if (watermarkLayers.length === 0) {
      showNotification('⚠️ Add at least one layer');
      return;
    }
    setWatermarkTraced(true);
    
    // Pass all layers to parent for canvas rendering
    if (onWatermarkChange) {
      onWatermarkChange({
        color: watermarkLayers[0]?.color || '#FF00FF',
        thickness: watermarkLayers[0]?.thickness || 2,
        opacity: watermarkLayers[0]?.opacity || 100,
        traced: true,
        hidden: false,
        layers: watermarkLayers
      } as any);
    }
    
    showNotification(`✅ ${watermarkLayers.length} layer(s) applied`);
  };

  const handleEraseAllLayers = () => {
    setWatermarkLayers([]);
    setWatermarkTraced(false);
    setSelectedLayerId(null);
    
    // Clear layers in parent too
    if (onWatermarkChange) {
      onWatermarkChange({
        color: '#FF00FF',
        thickness: 2,
        opacity: 100,
        traced: false,
        hidden: true,
        layers: []
      } as any);
    }
    
    showNotification('🗑️ All layers removed');
    
    if (onWatermarkChange) {
      onWatermarkChange({
        color: watermarkColor,
        thickness: watermarkThickness,
        opacity: watermarkOpacity,
        traced: false,
        hidden: true
      });
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
      } as any);
    }
  };

  const handleApplyWatermark = () => {
    setWatermarkTraced(true);
    showNotification(`✅ Watermark applied - "${watermarkText}"`);
    
    if (onWatermarkChange) {
      onWatermarkChange({
        color: watermarkColor,
        thickness: watermarkThickness,
        opacity: watermarkOpacity,
        traced: true,
        hidden: watermarkHidden,
        text: watermarkText,
        shape: watermarkShape,
        x: watermarkX,
        y: watermarkY,
        angle: watermarkAngle,
        size: watermarkSize
      } as any);
    }
  };

  // Real-time watermark update helper
  const updateWatermarkLive = (updates: Partial<any>) => {
    if (watermarkTraced && onWatermarkChange) {
      onWatermarkChange({
        color: watermarkColor,
        thickness: watermarkThickness,
        opacity: watermarkOpacity,
        traced: watermarkTraced,
        hidden: watermarkHidden,
        text: watermarkText,
        shape: watermarkShape,
        x: watermarkX,
        y: watermarkY,
        angle: watermarkAngle,
        size: watermarkSize,
        ...updates
      } as any);
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
    <div className="w-28 sm:w-48 h-28 sm:h-48 bg-[var(--color-surface)] rounded-lg border-2 border-black/50 shadow-inner flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-24 sm:w-40 h-24 sm:h-40 bg-black rounded-lg border-2 sm:border-4 border-[var(--color-accent)] shadow-lg flex items-center justify-center overflow-hidden">
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
              // Advanced Watermark Editor
              <div className="flex flex-col h-full gap-2 overflow-y-auto">
                <h3 className="text-[var(--color-accent)] font-bold text-lg border-b-2 border-[var(--color-accent)] pb-2">
                  🎨 Advanced Watermark
                </h3>
                
                {/* Status */}
                <div className={`p-2 rounded text-xs font-semibold text-center ${watermarkTraced ? 'bg-green-900/30 text-green-300 border border-green-500' : 'bg-gray-900/30 text-gray-300 border border-gray-500'}`}>
                  {watermarkTraced ? '✓ ACTIVE' : '○ Inactive'}
                </div>

                {/* Watermark Text Input */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-blue-400">
                  <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setWatermarkText(newText);
                      updateWatermarkLive({ text: newText });
                    }}
                    className="w-full bg-[var(--color-bg-primary)] text-[var(--color-accent)] px-2 py-1 rounded border border-[var(--color-accent)] text-sm"
                    placeholder="CLIDEO"
                  />
                </div>

                {/* Shape Selection */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-green-400">
                  <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Shape</label>
                  <div className="flex gap-1">
                    {(['text', 'square', 'circle'] as const).map(shape => (
                      <button
                        key={shape}
                        onClick={() => {
                          setWatermarkShape(shape);
                          updateWatermarkLive({ shape });
                        }}
                        className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all ${
                          watermarkShape === shape
                            ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                            : 'bg-[var(--color-bg-primary)] text-[var(--color-accent)] border border-[var(--color-accent)]'
                        }`}
                      >
                        {shape === 'text' ? 'Txt' : shape === 'square' ? '□' : '○'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-purple-400">
                  <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Color</label>
                  <input
                    type="color"
                    value={watermarkColor}
                    onChange={(e) => {
                      setWatermarkColor(e.target.value);
                      updateWatermarkLive({ color: e.target.value });
                    }}
                    className="w-full h-6 cursor-pointer rounded border border-[var(--color-accent)]"
                  />
                </div>

                {/* Position X */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-cyan-400">
                  <label className="text-xs text-[var(--color-text-secondary)]">X: {watermarkX}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={watermarkX}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWatermarkX(val);
                      updateWatermarkLive({ x: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Position Y */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-cyan-400">
                  <label className="text-xs text-[var(--color-text-secondary)]">Y: {watermarkY}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={watermarkY}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWatermarkY(val);
                      updateWatermarkLive({ y: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Angle */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-yellow-400">
                  <label className="text-xs text-[var(--color-text-secondary)]">Angle: {watermarkAngle}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={watermarkAngle}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWatermarkAngle(val);
                      updateWatermarkLive({ angle: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Size */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-orange-400">
                  <label className="text-xs text-[var(--color-text-secondary)]">Size: {watermarkSize}px</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={watermarkSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWatermarkSize(val);
                      updateWatermarkLive({ size: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Opacity */}
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
                      updateWatermarkLive({ opacity: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Thickness */}
                <div className="p-2 bg-[var(--color-bg-secondary)] rounded border border-pink-400">
                  <label className="text-xs text-[var(--color-text-secondary)]">Thickness: {watermarkThickness}px</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={watermarkThickness}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWatermarkThickness(val);
                      updateWatermarkLive({ thickness: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Multi-Layer Section */}
                <div className="border-t-2 border-[var(--color-accent)] pt-2">
                  <h4 className="text-xs font-bold text-[var(--color-accent)] mb-2">🎯 Add More Layers</h4>
                  <div className="flex gap-1">
                    <button onClick={() => addWatermarkLayer('text')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">
                      ➕ Text
                    </button>
                    <button onClick={() => addWatermarkLayer('square')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                      ➕ □
                    </button>
                    <button onClick={() => addWatermarkLayer('circle')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1 px-2 rounded">
                      ➕ ○
                    </button>
                  </div>

                  {/* Layers List */}
                  {watermarkLayers.length > 0 && (
                    <div className="mt-2 bg-[var(--color-bg-primary)] rounded p-2 max-h-24 overflow-y-auto border border-[var(--color-accent)]">
                      <div className="space-y-1">
                        {watermarkLayers.map((layer, idx) => (
                          <div 
                            key={layer.id} 
                            onClick={() => setSelectedLayerId(layer.id)}
                            className={`p-1 rounded border text-xs cursor-pointer transition-all flex justify-between items-center ${
                              selectedLayerId === layer.id 
                                ? 'border-[var(--color-accent)] bg-[var(--color-bg-secondary)]' 
                                : 'border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <span className="text-[var(--color-accent)] font-semibold">
                              {layer.type === 'text' ? 'Txt' : layer.type === 'square' ? '□' : '○'} {layer.text || `Layer ${idx + 1}`}
                            </span>
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                                className="text-xs px-1 hover:bg-gray-600 rounded"
                              >
                                {layer.visible ? '👁️' : '🚫'}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteWatermarkLayer(layer.id); }}
                                className="text-xs px-1 bg-red-600 hover:bg-red-700 text-white rounded"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Layer Editor - Show if layer selected */}
                  {selectedLayerId && watermarkLayers.find(l => l.id === selectedLayerId) && (() => {
                    const layer = watermarkLayers.find(l => l.id === selectedLayerId)!;
                    return (
                      <div className="mt-2 p-2 bg-[var(--color-bg-secondary)] rounded border border-blue-400 space-y-1">
                        <h5 className="text-xs font-bold text-[var(--color-accent)]">Edit: {layer.text || layer.type}</h5>

                        {layer.type === 'text' && (
                          <div>
                            <label className="text-xs text-gray-300">Text</label>
                            <input 
                              type="text" 
                              value={layer.text} 
                              onChange={(e) => updateWatermarkLayer(layer.id, { text: e.target.value })}
                              className="w-full bg-[var(--color-bg-primary)] text-[var(--color-accent)] px-1 py-0.5 rounded border border-[var(--color-accent)] text-xs"
                              placeholder="Your text"
                            />
                          </div>
                        )}

                        <div>
                          <label className="text-xs text-gray-300">Color</label>
                          <input 
                            type="color" 
                            value={layer.color} 
                            onChange={(e) => updateWatermarkLayer(layer.id, { color: e.target.value })}
                            className="w-full h-4 cursor-pointer rounded"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-300">X: {layer.x}%</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={layer.x}
                            onChange={(e) => updateWatermarkLayer(layer.id, { x: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-300">Y: {layer.y}%</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={layer.y}
                            onChange={(e) => updateWatermarkLayer(layer.id, { y: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-300">Angle: {layer.angle}°</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="360" 
                            value={layer.angle}
                            onChange={(e) => updateWatermarkLayer(layer.id, { angle: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-300">Size: {layer.size}px</label>
                          <input 
                            type="range" 
                            min="10" 
                            max="200" 
                            value={layer.size}
                            onChange={(e) => updateWatermarkLayer(layer.id, { size: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-300">Opacity: {layer.opacity}%</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={layer.opacity}
                            onChange={(e) => updateWatermarkLayer(layer.id, { opacity: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-300">Thickness: {layer.thickness}px</label>
                          <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={layer.thickness}
                            onChange={(e) => updateWatermarkLayer(layer.id, { thickness: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        {/* Save and Add Another Button */}
                        <button
                          onClick={saveLayerAndAddNew}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded text-xs transition-all mt-2"
                        >
                          💾 Save & Add Another
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex-1 space-y-1 flex flex-col justify-end">
                  <button
                    onClick={handleApplyWatermark}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 rounded text-xs transition-all"
                  >
                    ✓ Apply
                  </button>
                  <button
                    onClick={() => {
                      if (watermarkLayers.length > 0) handleApplyAllLayers();
                      else handleEraseWatermark();
                    }}
                    disabled={!watermarkTraced && watermarkLayers.length === 0}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2 px-2 rounded text-xs transition-all"
                  >
                    {watermarkLayers.length > 0 ? '🎯 Apply Layers' : '⚠️ No Layers'}
                  </button>
                  <button
                    onClick={watermarkLayers.length > 0 ? handleEraseAllLayers : handleEraseWatermark}
                    disabled={!watermarkTraced}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-2 rounded text-xs transition-all"
                  >
                    ✕ Remove
                  </button>
                  <button
                    onClick={handleHideWatermark}
                    disabled={!watermarkTraced}
                    className={`font-bold py-2 px-2 rounded text-xs transition-all ${
                      watermarkHidden
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50`}
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
