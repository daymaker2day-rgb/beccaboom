import React, { useState, useRef, useEffect, useCallback } from 'react';
import Speaker from './Speaker';
import CassetteDeck from './CassetteDeck';
import ErrorBoundary from './ErrorBoundary';
import RadioTuner from './RadioTuner';
import ControlKnob from './ControlKnob';
import ControlSlider from './ControlSlider';
import { useVideos } from '../services/videoService';
import { TapeState, RadioMode, MediaQueueItem } from '../types';
import VideoControls from './VideoControls';
import SettingsModal from './SettingsModal';

const ThemeMenu: React.FC<{ onSelectTheme: (theme: string) => void }> = ({ onSelectTheme }) => {
  const themes = [
    { id: 'theme-pink', name: 'Pink Future' },
    { id: 'theme-neon', name: 'Neon Nights' },
    { id: 'theme-rainbow', name: 'Rainbow Pop' },
    { id: 'theme-classic', name: 'Classic Gray' },
  ];
  return (
    <div className="absolute bottom-full mb-2 w-40 bg-[var(--color-bg-primary)] border-2 border-[var(--color-surface)] rounded-lg shadow-2xl p-2 z-10 flex flex-col gap-2">
      {themes.map(theme => (
        <button 
          key={theme.id}
          onClick={() => onSelectTheme(theme.id)}
          className="px-4 py-2 text-left text-sm text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] rounded-md transition-colors"
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
};

const ModeMenu: React.FC<{ currentMode: RadioMode; onSelectMode: (mode: RadioMode) => void }> = ({ currentMode, onSelectMode }) => {
  const modes: { id: RadioMode; name: string }[] = [
    { id: 'VIDEO', name: 'Video' },
    { id: 'AUDIO', name: 'Audio' }
  ];

  return (
    <div className="absolute bottom-full mb-2 w-40 bg-[var(--color-bg-primary)] border-2 border-[var(--color-surface)] rounded-lg shadow-2xl p-2 z-10 flex flex-col gap-2">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onSelectMode(mode.id)}
          className={`px-4 py-2 text-left text-sm text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] rounded-md transition-colors flex items-center justify-between ${mode.id === currentMode ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface)]' : ''}`}
        >
          <span>{mode.name}</span>
          {mode.id === currentMode && <span className="text-xs text-[var(--color-accent)] font-semibold">Active</span>}
        </button>
      ))}
    </div>
  );
};

const Boombox: React.FC = () => {
  console.log('Boombox component initializing...');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Initialize audio settings from localStorage
  const [powerOn, setPowerOn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.powerOn ?? true;
      }
    } catch (e) {
      console.error('Error loading power setting:', e);
    }
    return true;
  });
  
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.volume ?? 19;
      }
    } catch (e) {
      console.error('Error loading volume:', e);
    }
    return 19;
  });
  
  const [bass, setBass] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.bass ?? 0;
      }
    } catch (e) {
      console.error('Error loading bass:', e);
    }
    return 0;
  });
  
  const [treble, setTreble] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.treble ?? 0;
      }
    } catch (e) {
      console.error('Error loading treble:', e);
    }
    return 0;
  });
  
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.balance ?? 0;
      }
    } catch (e) {
      console.error('Error loading balance:', e);
    }
    return 0;
  });
  
  const [radioMode, setRadioMode] = useState<RadioMode>('AUDIO');
  const [tapeState, setTapeState] = useState<TapeState>('stopped');
  const [mediaQueue, setMediaQueue] = useState<MediaQueueItem[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  
  const [theme, setTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('beccabear@13_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.theme ?? 'theme-pink';
      }
    } catch (e) {
      console.error('Error loading theme:', e);
    }
    return 'theme-pink';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showProfileLogo, setShowProfileLogo] = useState(true); // Toggle between R logo and profile icon
  const [customProfileImage, setCustomProfileImage] = useState<string | null>(null); // Custom profile image URL
  const [comments, setComments] = useState<{[key: string]: string}>({}); // Comments for each track
  const [editingComment, setEditingComment] = useState<boolean>(false); // Whether currently editing comment
  const [showWatermarkCover, setShowWatermarkCover] = useState<boolean>(false); // Manual watermark cover toggle
  const [watermarkData, setWatermarkData] = useState({
    color: '#FF00FF',
    thickness: 2,
    opacity: 100,
    traced: false,
    hidden: false
  }); // Watermark settings from Speaker component
  const [showSpeakerDropUp, setShowSpeakerDropUp] = useState<boolean>(false); // Speaker triangle drop-up menu
  const [showCommentBox, setShowCommentBox] = useState<boolean>(false); // Comment speaker triangle drop-up
  const [showRightSpeaker1, setShowRightSpeaker1] = useState<boolean>(false); // Right speaker 1 drop-up
  const [showRightSpeaker2, setShowRightSpeaker2] = useState<boolean>(false); // Right speaker 2 drop-up
  const { videos: videoList, loading: videosLoading, error: videosError } = useVideos();
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const mediaElementRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldResumePlaybackRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const dragCounter = useRef(0);
  const controlsTimeoutRef = useRef<number | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const currentTrack = mediaQueue[currentTrackIndex];

  // Load saved media queue from localStorage
  useEffect(() => {
    console.log('Loading videos, count:', videoList.length);
    const savedQueue = localStorage.getItem('boombox_mediaQueue');
    const savedIndex = localStorage.getItem('boombox_currentTrackIndex');
    const savedMode = localStorage.getItem('boombox_radioMode') as RadioMode;
    
    // Always load videos from videoList if available (ignoring saved queue for now)
    if (videoList.length > 0) {
      console.log('Loading videos into queue:', videoList);
      // Load videos from service
      const videoQueue: MediaQueueItem[] = videoList.map(video => ({
        file: {
          name: video.title,
          type: 'video/mp4'
        },
        url: video.path
      }));

      setMediaQueue(videoQueue);
      if (videoQueue.length > 0) {
        setCurrentTrackIndex(0);
        setRadioMode('VIDEO');
      }
      console.log('Video queue set with', videoQueue.length, 'videos');
    } else if (savedQueue) {
      // Fallback to saved queue if no videos loaded yet
      const parsedQueue = JSON.parse(savedQueue);
      setMediaQueue(parsedQueue);
      if (savedIndex) {
        setCurrentTrackIndex(parseInt(savedIndex));
      }
      if (savedMode) {
        setRadioMode(savedMode);
      }
    }
    if (videosError) {
      console.error('Videos error:', videosError);
      setMediaError(videosError);
    }
  }, [videoList, videosError]);

  // Save media queue to localStorage when it changes
  useEffect(() => {
    if (mediaQueue.length > 0) {
      try {
        localStorage.setItem('boombox_mediaQueue', JSON.stringify(mediaQueue));
        localStorage.setItem('boombox_currentTrackIndex', currentTrackIndex.toString());
        localStorage.setItem('boombox_radioMode', radioMode);
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          // Clear storage and try again with just the current track
          localStorage.clear();
          try {
            const reducedQueue = [mediaQueue[currentTrackIndex]];
            localStorage.setItem('boombox_mediaQueue', JSON.stringify(reducedQueue));
            localStorage.setItem('boombox_currentTrackIndex', '0');
            localStorage.setItem('boombox_radioMode', radioMode);
          } catch (e) {
            console.error('Unable to save even reduced queue to localStorage');
          }
        }
      }
    }
  }, [mediaQueue, currentTrackIndex, radioMode]);

  // Save all audio settings to localStorage whenever they change
  useEffect(() => {
    try {
      const settings = {
        powerOn,
        volume,
        bass,
        treble,
        balance,
        theme
      };
      localStorage.setItem('beccabear@13_settings', JSON.stringify(settings));
      console.log('💾 All audio settings saved for beccabear@13:', settings);
    } catch (e) {
      console.error('Error saving audio settings:', e);
    }
  }, [powerOn, volume, bass, treble, balance, theme]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    return () => {
        mediaQueue.forEach(item => URL.revokeObjectURL(item.url));
    }
  }, [mediaQueue]);

  const setupAudioContext = useCallback(() => {
    if (!mediaElementRef.current) return;
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        audioContextRef.current = new AudioContext();
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(mediaElementRef.current);
        
        bassFilterRef.current = audioContextRef.current.createBiquadFilter();
        bassFilterRef.current.type = 'lowshelf';
        bassFilterRef.current.frequency.value = 300;
        
        trebleFilterRef.current = audioContextRef.current.createBiquadFilter();
        trebleFilterRef.current.type = 'highshelf';
        trebleFilterRef.current.frequency.value = 3000;
        
        // Create stereo panner for balance control
        pannerRef.current = audioContextRef.current.createStereoPanner();
        pannerRef.current.pan.value = 0; // Center by default
        
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        sourceNodeRef.current
            .connect(bassFilterRef.current)
            .connect(trebleFilterRef.current)
            .connect(pannerRef.current)
            .connect(analyserRef.current)
            .connect(audioContextRef.current.destination);
    }
  }, []);
  
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const processFile = async (file: File): Promise<MediaQueueItem | null> => {
      // Accept any file that has a name and can be read
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            file: {
              name: file.name,
              type: file.type || 'audio/mpeg' // Default to audio/mpeg if type is not detected
            },
            url: reader.result as string
          });
        };
        reader.onerror = () => resolve(null); // Skip files that can't be read
        reader.readAsDataURL(file);
      });
    };

    const newItems = (await Promise.all(
      Array.from(files).map(processFile)
    )).filter((item): item is MediaQueueItem => item !== null);

    if (newItems.length === 0) return;

    const wasQueueEmpty = mediaQueue.length === 0;
    const oldQueueLength = mediaQueue.length;
    setMediaQueue(prevQueue => [...prevQueue, ...newItems]);
    
    if (wasQueueEmpty || tapeState === 'stopped') {
        setCurrentTrackIndex(oldQueueLength);
        handlePlay(); // Auto-play when adding new tracks to empty queue
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
  };

  const handlePlay = useCallback(() => {
    if (!mediaElementRef.current || !currentTrack) return;
    setMediaError(null);
    setupAudioContext();
    mediaElementRef.current.play().then(() => {
        shouldResumePlaybackRef.current = true;
        setTapeState('playing');
    }).catch(e => {
        console.error("Playback failed:", e);
        setMediaError("Could not start playback. File might be unsupported.");
        setTapeState('stopped');
        shouldResumePlaybackRef.current = false;
    });
  }, [currentTrack, setupAudioContext]);
  
  useEffect(() => {
    const mediaElement = mediaElementRef.current;
    if (currentTrack && mediaElement) {
      setMediaError(null);
      mediaElement.src = currentTrack.url;
      mediaElement.load();
      
    const shouldResumeOnLoad = shouldResumePlaybackRef.current;
    const onCanPlay = () => {
      if (shouldResumeOnLoad) {
        handlePlay();
      } else {
        setTapeState(prev => (prev === 'playing' ? 'paused' : prev));
      }
      mediaElement.removeEventListener('canplay', onCanPlay);
    };
      
      mediaElement.addEventListener('canplay', onCanPlay);
      
      setRadioMode(currentTrack.file.type.startsWith('video') ? 'VIDEO' : 'AUDIO');

      return () => {
        mediaElement.removeEventListener('canplay', onCanPlay);
      };
    }
  }, [currentTrackIndex, currentTrack, handlePlay]);

  useEffect(() => {
    if (mediaElementRef.current) mediaElementRef.current.volume = volume / 100;
  }, [volume]);
  
  useEffect(() => {
    if (bassFilterRef.current) bassFilterRef.current.gain.value = bass;
  }, [bass]);

  useEffect(() => {
    if (trebleFilterRef.current) trebleFilterRef.current.gain.value = treble;
  }, [treble]);

  useEffect(() => {
    if (pannerRef.current) {
      // Convert balance (-50 to 50) to stereo pan (-1 to 1)
      pannerRef.current.pan.value = balance / 50;
    }
  }, [balance]);

  // Watermark canvas drawing effect
  useEffect(() => {
    if (!canvasRef.current || !mediaElementRef.current) return;
    
    const canvas = canvasRef.current;
    const video = mediaElementRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawWatermark = () => {
      // Set canvas size to match video container
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw custom user watermark if traced and not hidden
      if (watermarkData.traced && !watermarkData.hidden) {
        // Handle both single watermark and multi-layer watermarks
        const layers = watermarkData.layers || [];
        
        // If layers exist, draw each one
        if (layers.length > 0) {
          layers.forEach((layer: any) => {
            if (!layer.visible) return; // Skip hidden layers
            
            ctx.save();
            
            const xPercent = layer.x ?? 50;
            const yPercent = layer.y ?? 50;
            const x = xPercent * canvas.width / 100;
            const y = yPercent * canvas.height / 100;
            const angle = (layer.angle ?? 0) * Math.PI / 180;
            const size = layer.size ?? 80;
            const shape = layer.type ?? 'text';
            const text = layer.text ?? 'Layer';
            const color = layer.color ?? '#FF00FF';
            const opacity = (layer.opacity ?? 100) / 100;
            const thickness = layer.thickness ?? 2;
            
            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = thickness;
            ctx.globalAlpha = opacity;
            
            ctx.translate(x, y);
            ctx.rotate(angle);

            if (shape === 'text') {
              ctx.font = `bold ${size}px 'Arial Black', sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.strokeText(text, 0, 0);
              ctx.fillText(text, 0, 0);
            } else if (shape === 'square') {
              const half = size / 2;
              ctx.fillRect(-half, -half, size, size);
              ctx.strokeRect(-half, -half, size, size);
            } else if (shape === 'circle') {
              ctx.beginPath();
              ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            ctx.restore();
          });
        } else {
          // Fallback to single watermark (legacy support)
          ctx.save();
          
          const xPercent = watermarkData.x !== undefined ? watermarkData.x : 50;
          const yPercent = watermarkData.y !== undefined ? watermarkData.y : 50;
          const x = xPercent * canvas.width / 100;
          const y = yPercent * canvas.height / 100;
          const angle = (watermarkData.angle ?? 0) * Math.PI / 180;
          const size = watermarkData.size ?? 80;
          const shape = (watermarkData.shape ?? 'text') as string;
          const text = (watermarkData.text ?? 'CLIDEO') as string;
          const color = watermarkData.color ?? '#FF00FF';
          const opacity = (watermarkData.opacity ?? 100) / 100;
          const thickness = watermarkData.thickness ?? 2;
          
          ctx.fillStyle = color;
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = thickness;
          ctx.globalAlpha = opacity;
          
          ctx.translate(x, y);
          ctx.rotate(angle);

          if (shape === 'text') {
            ctx.font = `bold ${size}px 'Arial Black', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(text, 0, 0);
            ctx.fillText(text, 0, 0);
          } else if (shape === 'square') {
            const half = size / 2;
            ctx.fillRect(-half, -half, size, size);
            ctx.strokeRect(-half, -half, size, size);
          } else if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      animationId = requestAnimationFrame(drawWatermark);
    };

    // Always draw watermark when video is loaded/playing
    drawWatermark();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [watermarkData, tapeState]);

  const handlePause = () => {
    mediaElementRef.current?.pause();
    setTapeState('paused');
    shouldResumePlaybackRef.current = false;
  };

  const handleStop = () => {
    if(mediaElementRef.current) {
        mediaElementRef.current.pause();
        mediaElementRef.current.currentTime = 0;
    }
    setTapeState('stopped');
    setMediaError(null);
    shouldResumePlaybackRef.current = false;
  };
  
  const handleSeek = (direction: 'forward' | 'backward') => {
      if(mediaElementRef.current) {
          const newTime = mediaElementRef.current.currentTime + (direction === 'forward' ? 5 : -5);
          mediaElementRef.current.currentTime = Math.max(0, newTime);
      }
  };
  
  const handleNextTrack = () => {
    if (mediaQueue.length > 1) {
        shouldResumePlaybackRef.current = tapeState === 'playing';
        setCurrentTrackIndex(prevIndex => (prevIndex + 1) % mediaQueue.length);
    }
  };

  const handlePrevTrack = () => {
    if (mediaQueue.length > 1) {
        shouldResumePlaybackRef.current = tapeState === 'playing';
        setCurrentTrackIndex(prevIndex => (prevIndex - 1 + mediaQueue.length) % mediaQueue.length);
    }
  };

  const handleTrackSelect = (index: number) => {
    if (index >= 0 && index < mediaQueue.length) {
        shouldResumePlaybackRef.current = tapeState === 'playing';
        setCurrentTrackIndex(index);
    }
  };
  
  const handleTrackEnd = () => {
    if(currentTrackIndex === mediaQueue.length - 1) {
        handleStop();
    } else {
        handleNextTrack();
    }
  };

  const handleMediaError = (_event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // Only stop playback, but don't show error message
    setTapeState('stopped');
    shouldResumePlaybackRef.current = false;
    
    // Try to move to the next track if available
    if (currentTrackIndex < mediaQueue.length - 1) {
      handleNextTrack();
    }
  };

  const handleThemeSelect = (selectedTheme: string) => {
    setTheme(selectedTheme);
    setIsThemeMenuOpen(false);
  };



  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
    }
  };
  
  const handleSpeakerTriangleClick = () => {
    setShowSpeakerDropUp(!showSpeakerDropUp);
  };
  
  const handleCommentBoxClick = () => {
    setShowCommentBox(!showCommentBox);
  };
  
  const handleRightSpeaker1Click = () => {
    setShowRightSpeaker1(!showRightSpeaker1);
  };
  
  const handleRightSpeaker2Click = () => {
    setShowRightSpeaker2(!showRightSpeaker2);
  };
  
  const getDisplayContent = () => {
    if (!currentTrack) {
      return <p className="text-[var(--color-text-primary)] font-mono text-sm truncate text-center">Load or drop media</p>;
    }
    
    const trackKey = currentTrack.file.name;
    const comment = comments[trackKey] || '';
    const queueInfo = mediaQueue.length > 1 ? `(Track ${currentTrackIndex + 1} of ${mediaQueue.length})` : '';
    
    const handleEditComment = () => {
      setEditingComment(true);
    };
    
    const handleDeleteComment = () => {
      const newComments = { ...comments };
      delete newComments[trackKey];
      setComments(newComments);
    };
    
    const handleSaveComment = (newComment: string) => {
      // Add automatic spacing (2 line breaks) and prepare for next input
      let formattedComment = newComment.trim();
      if (formattedComment) {
        if (!formattedComment.endsWith('\n\n')) {
          formattedComment += '\n\n';
        }
        // Add prompt spacing for next entry
        formattedComment += '\n\n';
      }
      setComments({ ...comments, [trackKey]: formattedComment });
      setEditingComment(false);
    };
    
    // Function to format text with underlines for names (until first space)
    const formatTextWithUnderlines = (text: string) => {
      const lines = text.split('\n');
      return lines.map(line => {
        const firstSpaceIndex = line.indexOf(' ');
        if (firstSpaceIndex === -1) {
          // No space found, underline the whole line (it's a name being typed)
          return line;
        } else {
          // Space found, don't underline after the first space
          return line;
        }
      }).join('\n');
    };

    const handleSendMessage = () => {
      const currentSong = currentTrack ? currentTrack.file.name : 'Unknown Song';
      const messageText = `Message from daughter about: ${currentSong}\n\n${comment}\n\nSent from Rebecca's Boombox`;
      
      // Add "Message:" prefix to comment display
      const messageComment = comment ? `Message: ${comment}\n\n` : 'Message: [Click to add message for mom]\n\n';
      setComments({ ...comments, [trackKey]: messageComment });
      
      // Create mailto link to send email
      const subject = encodeURIComponent(`Feedback on: ${currentSong}`);
      const body = encodeURIComponent(messageText);
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // Open email client
      window.open(mailtoLink, '_blank');
    };
    
    return (
      <div className="w-full h-full flex flex-col">
        {/* Comment box with controls */}
        <div className="flex-1 flex relative">
          {editingComment ? (
            <div className="flex-1 relative">
              <textarea
                value={comment}
                onChange={(e) => setComments({ ...comments, [trackKey]: e.target.value })}
                onBlur={() => setEditingComment(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSaveComment(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setEditingComment(false);
                  }
                }}
                className="w-full h-full bg-black/70 text-[var(--color-text-primary)] text-xs p-2 rounded resize-none outline-none border border-[var(--color-accent)]/50 focus:border-[var(--color-accent)]"
                placeholder="Add a comment about this track..."
                autoFocus
                style={{
                  textDecoration: comment && !comment.includes(' ') ? 'underline' : 'none'
                }}
              />
            </div>
          ) : (
            <div className="flex-1 bg-black/30 text-[var(--color-text-primary)] text-xs p-2 rounded overflow-y-auto cursor-pointer"
                 onClick={handleEditComment}
                 title="Click to edit comment">
              <div className="whitespace-pre-wrap">
                {comment || 'Click to add a comment...'}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col ml-1 gap-1 items-center">
            {/* Watermark cover toggle button */}
            <button
              onClick={() => setShowWatermarkCover(!showWatermarkCover)}
              className="bg-black text-black w-3 h-3 p-1 border border-gray-600"
              title="Toggle watermark cover"
            >
            </button>
            
            {/* Delete button (moved up) */}
            <button
              onClick={handleDeleteComment}
              className="text-white hover:text-red-400 transition-colors p-1"
              title="Delete comment"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {/* Save button */}
            <button
              onClick={() => handleSaveComment(comment)}
              className="bg-[var(--color-accent)] text-white w-3 h-3 p-1 rounded hover:bg-[var(--color-accent)]/80 transition-colors flex items-center justify-center text-xs font-bold"
              title="Save comment"
            >
              S
            </button>
            
            {/* Message button for daughter */}
            <button
              onClick={handleSendMessage}
              className="bg-green-600 text-white w-3 h-3 p-1 rounded hover:bg-green-500 transition-colors flex items-center justify-center text-xs font-bold"
              title="Send message to mom"
            >
              M
            </button>
            
            <button
              onClick={handleEditComment}
              className="text-white hover:text-[var(--color-accent)] transition-colors p-1"
              title="Edit comment"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Video Controls Logic ---

  useEffect(() => {
    const media = mediaElementRef.current;
    if (!media) return;
    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    const handleLoadedMetadata = () => setDuration(media.duration);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const handleVideoClick = () => {
    if (!isControlsVisible) {
        showControls();
        return;
    }
    if (tapeState === 'playing') {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const showControls = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setIsControlsVisible(true);
    if (tapeState === 'playing') {
      controlsTimeoutRef.current = window.setTimeout(() => setIsControlsVisible(false), 3000);
    }
  }, [tapeState]);
  
  const hideControls = useCallback(() => {
    if (tapeState === 'playing') {
      setIsControlsVisible(false);
    }
  }, [tapeState]);
  
  useEffect(() => {
    if (tapeState !== 'playing') {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setIsControlsVisible(true);
    } else {
      showControls();
    }
  }, [tapeState, showControls]);

  const handleSeekVideo = (time: number) => {
    if (mediaElementRef.current) mediaElementRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (mediaElementRef.current) {
        mediaElementRef.current.volume = newVolume / 100;
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
            mediaElementRef.current.muted = false;
        }
    }
  };
  
  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (mediaElementRef.current) mediaElementRef.current.muted = newMutedState;
  };
  
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
        videoContainerRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomProfileImage(e.target?.result as string);
        setShowProfileLogo(false); // Switch to show the custom image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('profile-image-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const handleModeSelect = (mode: RadioMode) => {
    setRadioMode(mode);
    setIsModeMenuOpen(false);
    setIsThemeMenuOpen(false);
  };

  return (
    <React.Fragment>
      <div 
        className={`w-full max-w-6xl mx-auto transition-colors duration-500 relative`}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
        onDragOver={handleDragOver} onDrop={handleDrop}
      >
        {/* Handle with Banner */}
        <div className="relative w-[70%] mx-auto">
          <div className="h-32 bg-[var(--color-bg-secondary)] border-x-8 border-t-8 border-[var(--color-bg-primary)] rounded-tl-3xl rounded-tr-3xl shadow-inner relative">
            {/* Banner Image */}
            <div className="absolute inset-0 flex items-center justify-center px-20 mt-1">
              <img 
                src="Icons/banner.png" 
                alt="Banner" 
                className="w-full h-[120px] object-contain drop-shadow-lg"
              />
            </div>
            
            {/* Settings Gear - moved inward */}
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="absolute top-1/2 -translate-y-1/2 right-6 text-[var(--color-text-primary)] hover:opacity-80 transition-opacity transform hover:rotate-90 duration-300 bg-[#800000]/60 rounded-full p-1.5" 
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.962.062 2.18-.948 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Profile Circle - moved inward with R logo option */}
            <button 
              onClick={() => setShowProfileLogo(!showProfileLogo)}
              onContextMenu={handleProfileRightClick}
              className="absolute top-1/2 -translate-y-1/2 left-6 w-10 h-10 bg-[#800000]/60 rounded-full overflow-hidden border-2 border-[var(--color-text-primary)] hover:opacity-80 transition-opacity"
              title={customProfileImage ? "Custom Image (right-click to change)" : showProfileLogo ? "R Logo (click to switch, right-click to upload)" : "Profile (click to switch, right-click to upload)"}
            >
              {customProfileImage ? (
                // Custom Profile Image
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={customProfileImage} 
                    alt="Custom Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              ) : showProfileLogo ? (
                // R Logo
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src="images/120r.png" 
                    alt="R Logo" 
                    className="w-8 h-8 rounded-sm object-contain"
                  />
                </div>
              ) : (
                // Profile Icon
                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-primary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
            
            {/* Hidden file input for profile image upload */}
            <input 
              id="profile-image-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleProfileImageChange}
              className="hidden" 
            />
         
            <div className="h-full bg-gradient-to-b from-[var(--color-surface-light)] to-[var(--color-surface)] rounded-t-2xl w-full mx-auto shadow-md flex justify-center items-center px-8">
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg-secondary)] border-8 border-[var(--color-bg-primary)] rounded-3xl p-4 sm:p-6 shadow-2xl relative">
        <div className="grid grid-cols-12 gap-2 h-full">
          {/* Left pair of speakers */}
          <div className="col-span-1 flex flex-col gap-3 items-center justify-center">
            <Speaker 
              analyser={analyserRef.current} 
              isPlaying={tapeState === 'playing'}
              onTriangleClick={handleSpeakerTriangleClick}
              showDropUp={showSpeakerDropUp}
              isVideoTools={true}
              onWatermarkChange={setWatermarkData}
            />
            <Speaker 
              analyser={analyserRef.current} 
              isPlaying={tapeState === 'playing'}
              onTriangleClick={handleCommentBoxClick}
              showDropUp={showCommentBox}
              isCommentBox={true}
            />
          </div>

          <div className="col-span-10 flex flex-col gap-4">
            <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-2 shadow-inner border border-black/50 flex flex-col gap-3 flex-grow min-h-0">
               <div ref={videoContainerRef} className="relative w-full bg-black rounded-lg shadow-inner overflow-hidden flex-grow group" onMouseMove={showControls} onMouseLeave={hideControls}>
                  <video
                      ref={mediaElementRef}
                      className={`w-full h-full object-contain ${radioMode === 'VIDEO' && currentTrack ? 'block' : 'hidden'}`}
            playsInline
                      onEnded={handleTrackEnd}
                      onPlay={() => setTapeState('playing')}
                      onPause={() => tapeState !== 'stopped' && setTapeState('paused')}
                      onError={handleMediaError}
                      onClick={handleVideoClick}
                  />
                  
                  {/* Watermark canvas - draws watermark on top of video */}
                  {radioMode === 'VIDEO' && currentTrack && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                      style={{ display: 'block' }}
                    />
                  )}
                  
                  {/* Black overlay to cover watermarks when button is pressed */}
                  {radioMode === 'VIDEO' && currentTrack && showWatermarkCover && (
                    <div className="absolute bottom-0 right-0 bg-black w-48 h-24 pointer-events-none z-10"></div>
                  )}
                  
                  <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-opacity ${radioMode === 'VIDEO' && currentTrack ? 'hidden' : 'flex'}`}>
                      {!mediaError && <h2 className="text-6xl font-bold text-[var(--color-text-primary)] opacity-20 tracking-widest">AudioBox</h2>}
                      {(radioMode !== 'VIDEO' || !currentTrack) && !mediaError && <RadioTuner mode={radioMode} />}
                  </div>

                  
                  {/* Video Controls - Progress bar, timer, and fullscreen */}
                  {radioMode === 'VIDEO' && currentTrack && isControlsVisible && (
                    <div className="relative z-20">
                      <VideoControls
                        isPlaying={tapeState === 'playing'}
                        onPlayPause={tapeState === 'playing' ? handlePause : handlePlay}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeekVideo}
                        volume={volume}
                        onVolumeChange={setVolume}
                        onMuteToggle={handleMuteToggle}
                        isMuted={isMuted}
                        onFullscreen={handleFullscreen}
                      />
                    </div>
                  )}
              </div>

              {/* Watermark Layers Section - Under Time Bar */}
              {radioMode === 'VIDEO' && currentTrack && watermarkData?.layers && watermarkData.layers.length > 0 && (
                <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-3 shadow-inner border border-pink-400">
                  <h3 className="text-xs font-bold text-[var(--color-accent)] mb-2">📍 Watermark Layers ({watermarkData.layers.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-20 overflow-y-auto">
                    {watermarkData.layers.map((layer: any, idx: number) => (
                      <div 
                        key={layer.id} 
                        className="p-1.5 bg-[var(--color-bg-secondary)] rounded border border-[var(--color-accent)] text-xs text-[var(--color-text-secondary)] flex items-center gap-1 truncate"
                      >
                        <span>{layer.type === 'text' ? '📝' : layer.type === 'square' ? '□' : '○'}</span>
                        <span className="truncate">{layer.text || `Layer ${idx + 1}`}</span>
                        {!layer.visible && <span className="text-[0.65rem]">🚫</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 shadow-inner border-2 border-black/50 flex flex-col gap-3 h-64">
              <div className="flex-grow flex flex-col min-h-0">
                <CassetteDeck 
                    tapeState={tapeState} onPlay={handlePlay} onPause={handlePause} onStop={handleStop}
                    onRewind={() => handleSeek('backward')} onFastForward={() => handleSeek('forward')}
                    onPrevTrack={handlePrevTrack} onNextTrack={handleNextTrack}
                    isPrevEnabled={mediaQueue.length > 1} isNextEnabled={mediaQueue.length > 1}
                    mediaQueue={mediaQueue} currentTrackIndex={currentTrackIndex} onTrackSelect={handleTrackSelect}
                />
              </div>
               <label htmlFor="file-upload" className="w-full bg-[var(--color-accent-dark)] hover:bg-[var(--color-accent)] text-[var(--color-text-primary)] font-bold py-2 px-4 rounded-md text-sm text-center cursor-pointer transition-colors flex-shrink-0">Load Media</label>
              <input id="file-upload" type="file" accept="audio/*,video/*" onChange={handleFileChange} className="hidden" multiple />
            </div>
          </div>

          {/* Right pair of speakers */}
          <div className="col-span-1 flex flex-col gap-3 items-center justify-center">
            <Speaker 
              analyser={analyserRef.current} 
              isPlaying={tapeState === 'playing'}
              onTriangleClick={handleRightSpeaker1Click}
              showDropUp={showRightSpeaker1}
            />
            <Speaker 
              analyser={analyserRef.current} 
              isPlaying={tapeState === 'playing'}
              onTriangleClick={handleRightSpeaker2Click}
              showDropUp={showRightSpeaker2}
            />
          </div>
        </div>

        <div className="mt-6 bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 shadow-inner border-2 border-black/50">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
            <div className="relative flex flex-col items-center gap-2">
                 <span className="text-[var(--color-text-secondary)] font-bold text-xs uppercase">Mode</span>
                 <div className="flex gap-2 p-1 bg-black rounded-lg">
                    <button
                      onClick={() => {
                        setIsModeMenuOpen(prev => !prev);
                        setIsThemeMenuOpen(false);
                      }}
                      className="px-3 py-1 text-sm rounded transition-colors flex items-center gap-2 bg-[var(--color-accent)] text-[var(--color-text-primary)] shadow-md"
                      aria-haspopup="listbox"
                      aria-expanded={isModeMenuOpen}
                    >
                      {radioMode}
                      <svg className={`w-3 h-3 transition-transform ${isModeMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.23 7.21a.75.75 0 011.06-.02L10 10.67l3.71-3.48a.75.75 0 111.04 1.08l-4.24 3.98a.75.75 0 01-1.04 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setIsThemeMenuOpen(prev => !prev);
                        setIsModeMenuOpen(false);
                      }}
                      className={`px-3 py-1 text-sm rounded transition-colors ${isThemeMenuOpen ? 'bg-[var(--color-accent)] text-[var(--color-text-primary)] shadow-md' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}
                      aria-haspopup="menu"
                      aria-expanded={isThemeMenuOpen}
                    >
                      THEME
                    </button>
                 </div>
                 {isModeMenuOpen && (
                   <ModeMenu currentMode={radioMode} onSelectMode={handleModeSelect} />
                 )}
                 {isThemeMenuOpen && <ThemeMenu onSelectTheme={handleThemeSelect} />}
            </div>
            <ControlKnob label="Volume" value={volume} setValue={handleVolumeChange} />
            <div className="sm:col-span-3 flex justify-around gap-4">
                <ControlSlider label="Bass" value={bass} setValue={setBass} min={-20} max={20} />
                <ControlSlider label="Treble" value={treble} setValue={setTreble} min={-20} max={20} />
                <ControlSlider label="Balance" value={balance} setValue={setBalance} min={-50} max={50} showValue={false} />
            </div>
          </div>
        </div>
      </div>
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[var(--color-bg-primary)] bg-opacity-80 rounded-[28px] flex flex-col items-center justify-center pointer-events-none z-20 border-4 border-dashed border-[var(--color-accent)] backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-4 4m0 0l4-4m-4 4h12" /></svg>
            <p className="text-2xl mt-4 font-bold text-[var(--color-text-primary)]">Drop Media File(s)</p>
        </div>
      )}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
    </React.Fragment>
  );

  // MOBILE LAYOUT FOR SMALL SCREENS (returned early if isMobile is true)
  if (isMobile) {
    return (
      <div className="w-full h-screen flex flex-col bg-gradient-to-br from-[var(--color-bg-deep)] to-[var(--color-bg-secondary)]">
        {/* Top Bar */}
        <div className="bg-[var(--color-surface)] border-b-2 border-[var(--color-bg-primary)] p-2 flex justify-between items-center gap-2 flex-shrink-0">
          <div className="flex gap-1">
            <button onClick={() => { setIsModeMenuOpen(!isModeMenuOpen); setIsThemeMenuOpen(false); }} className="px-2 py-1 text-xs bg-[var(--color-accent)] text-white rounded font-bold">{radioMode}</button>
            <button onClick={() => { setIsThemeMenuOpen(!isThemeMenuOpen); setIsModeMenuOpen(false); }} className="px-2 py-1 text-xs bg-[var(--color-surface-light)] text-[var(--color-text-primary)] rounded font-bold">THEME</button>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="px-2 py-1 text-xs bg-[#800000] text-white rounded">⚙️</button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-surface)] p-3 space-y-3">
          
          {/* Song Title */}
          <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-lg p-2 text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">Now Playing</p>
            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{currentTrack?.file.name || 'No track loaded'}</p>
          </div>

          {/* Video Box */}
          <div ref={videoContainerRef} className="w-full aspect-video bg-black relative rounded-lg overflow-hidden group shadow-lg" onMouseMove={showControls}>
            <video
              ref={mediaElementRef}
              className={`w-full h-full object-contain ${radioMode === 'VIDEO' && currentTrack ? 'block' : 'hidden'}`}
              playsInline
              onEnded={handleTrackEnd}
              onPlay={() => setTapeState('playing')}
              onPause={() => tapeState !== 'stopped' && setTapeState('paused')}
              onTimeUpdate={() => { if (mediaElementRef.current) { setCurrentTime(mediaElementRef.current.currentTime); setDuration(mediaElementRef.current.duration); }}}
            />
            {radioMode === 'VIDEO' && currentTrack && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />}
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${radioMode === 'VIDEO' && currentTrack ? 'hidden' : 'flex'}`}>
              <RadioTuner mode={radioMode} />
            </div>
            {radioMode === 'VIDEO' && currentTrack && isControlsVisible && (
              <div className="absolute bottom-0 left-0 right-0 z-20"><VideoControls isPlaying={tapeState === 'playing'} onPlayPause={tapeState === 'playing' ? handlePause : handlePlay} currentTime={currentTime} duration={duration} onSeek={handleSeekVideo} volume={volume} onVolumeChange={setVolume} onMuteToggle={handleMuteToggle} isMuted={isMuted} onFullscreen={handleFullscreen} /></div>
            )}
          </div>

          {/* Songs Queue */}
          {mediaQueue.length > 0 && (
            <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-lg p-2">
              <p className="text-xs font-bold text-[var(--color-text-secondary)] mb-1">Queue ({mediaQueue.length})</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {mediaQueue.map((track, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTrackSelect(idx)}
                    className={`w-full text-left p-1 rounded text-xs truncate transition-colors ${idx === currentTrackIndex ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)]'}`}
                  >
                    {idx + 1}. {track.file.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cassette Deck / Player Buttons */}
          <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-lg p-2">
            <CassetteDeck tapeState={tapeState} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} onRewind={() => handleSeek('backward')} onFastForward={() => handleSeek('forward')} onPrevTrack={handlePrevTrack} onNextTrack={handleNextTrack} isPrevEnabled={mediaQueue.length > 1} isNextEnabled={mediaQueue.length > 1} mediaQueue={mediaQueue} currentTrackIndex={currentTrackIndex} onTrackSelect={handleTrackSelect} />
          </div>

          {/* 2x2 Speaker Grid */}
          <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-lg p-2">
            <p className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 text-center">SPEAKERS</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-center">
                <Speaker 
                  analyser={analyserRef.current} 
                  isPlaying={tapeState === 'playing'}
                  onTriangleClick={handleSpeakerTriangleClick}
                  showDropUp={showSpeakerDropUp}
                  isVideoTools={true}
                  onWatermarkChange={setWatermarkData}
                />
              </div>
              <div className="flex justify-center">
                <Speaker 
                  analyser={analyserRef.current} 
                  isPlaying={tapeState === 'playing'}
                  onTriangleClick={handleCommentBoxClick}
                  showDropUp={showCommentBox}
                  isCommentBox={true}
                />
              </div>
              <div className="flex justify-center">
                <Speaker 
                  analyser={analyserRef.current} 
                  isPlaying={tapeState === 'playing'}
                  onTriangleClick={handleRightSpeaker1Click}
                  showDropUp={showRightSpeaker1}
                />
              </div>
              <div className="flex justify-center">
                <Speaker 
                  analyser={analyserRef.current} 
                  isPlaying={tapeState === 'playing'}
                  onTriangleClick={handleRightSpeaker2Click}
                  showDropUp={showRightSpeaker2}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Fixed Bottom Controls */}
        <div className="bg-[var(--color-surface)] border-t-2 border-[var(--color-bg-primary)] p-2 space-y-2 flex-shrink-0">
          <div className="grid grid-cols-4 gap-1 text-xs">
            <ControlSlider label="Bass" value={bass} setValue={setBass} min={-20} max={20} />
            <ControlSlider label="Treble" value={treble} setValue={setTreble} min={-20} max={20} />
            <ControlSlider label="Bal" value={balance} setValue={setBalance} min={-50} max={50} showValue={false} />
            <ControlKnob label="Vol" value={volume} setValue={setVolume} />
          </div>
          <label htmlFor="file-upload-mobile" className="w-full bg-[var(--color-accent-dark)] hover:bg-[var(--color-accent)] text-[var(--color-text-primary)] font-bold py-1 px-2 rounded text-xs text-center cursor-pointer transition-colors block">Load Media</label>
          <input id="file-upload-mobile" type="file" accept="audio/*,video/*" onChange={handleFileChange} className="hidden" multiple />
        </div>

        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      </div>
    );
  }
};

export default Boombox;