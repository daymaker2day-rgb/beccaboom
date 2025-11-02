import React, { useState, useRef, useEffect, useCallback } from 'react';
import Speaker from './Speaker';
import Banner from './Banner';
import CassetteDeck from './CassetteDeck';
import ErrorBoundary from './ErrorBoundary';
import RadioTuner from './RadioTuner';
import ControlKnob from './ControlKnob';
import ControlSlider from './ControlSlider';
import { useVideos, Video } from '../services/videoService';
import { TapeState, RadioMode, MediaQueueItem, WatermarkData } from '../types';
import VideoControls from './VideoControls';
import SettingsModal from './SettingsModal';
import { firebaseService, Comment } from '../services/firebaseService';

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
  // REMOVE MOBILE DETECTION - USE DESKTOP LAYOUT ONLY
  const isMobile = false;
  
  // Initialize audio settings from localStorage
  const [powerOn, setPowerOn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rpopgolden_settings');
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
      const saved = localStorage.getItem('rpopgolden_settings');
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
      const saved = localStorage.getItem('rpopgolden_settings');
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
      const saved = localStorage.getItem('rpopgolden_settings');
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
      const saved = localStorage.getItem('rpopgolden_settings');
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
      const saved = localStorage.getItem('rpopgolden_settings');
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
  const [currentSong, setCurrentSong] = useState<Video | null>(null);
  const [showProfileLogo, setShowProfileLogo] = useState(true); // Toggle between R logo and profile icon
  const [customProfileImage, setCustomProfileImage] = useState<string | null>(null); // Custom profile image URL
  const [comments, setComments] = useState<{[key: string]: string}>({}); // Comments for each track
  const [editingComment, setEditingComment] = useState<boolean>(false); // Whether currently editing comment
  const [showWatermarkCover, setShowWatermarkCover] = useState<boolean>(false); // Manual watermark cover toggle
  const [watermarkData, setWatermarkData] = useState<WatermarkData>(() => {
    const saved = localStorage.getItem('beccabear@13_watermark_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading watermark settings:', e);
      }
    }
    return {
      color: '#FF00FF',
      thickness: 2,
      opacity: 100,
      traced: false,
      hidden: false,
      x: 50,
      y: 50,
      angle: 0,
      size: 80,
      shape: 'text',
      text: 'CLIDEO',
      layers: []
    };
  }); // Watermark settings from Speaker component
  const [showSpeakerDropUp, setShowSpeakerDropUp] = useState<boolean>(false); // Speaker triangle drop-up menu
  const [showRightSpeaker1, setShowRightSpeaker1] = useState<boolean>(false); // Right speaker 1 drop-up
  const [showRightSpeaker2, setShowRightSpeaker2] = useState<boolean>(false); // Right speaker 2 drop-up
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false); // Comment modal for songs
  const [selectedSongForComments, setSelectedSongForComments] = useState<string | null>(null); // Selected song title for comments

  // Comment functionality
  const [songComments, setSongComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});

  // Load comments from Firebase
  const loadCommentsForSong = async (songTitle: string) => {
    if (commentsLoading[songTitle]) return;

    setCommentsLoading(prev => ({ ...prev, [songTitle]: true }));
    try {
      const comments = await firebaseService.getCommentsForSong(songTitle);
      setSongComments(prev => ({
        ...prev,
        [songTitle]: comments
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [songTitle]: false }));
    }
  };

  // Save comment to Firebase
  const saveCommentToFirebase = async (songTitle: string, user: string, text: string) => {
    try {
      const commentId = await firebaseService.addComment(songTitle, user, text);
      if (commentId) {
        // Reload comments to get the new one
        await loadCommentsForSong(songTitle);
        return true;
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    }
    return false;
  };

  // Delete comment from Firebase
  const deleteCommentFromFirebase = async (songTitle: string, commentId: string) => {
    try {
      const success = await firebaseService.deleteComment(commentId);
      if (success) {
        setSongComments(prev => ({
          ...prev,
          [songTitle]: (prev[songTitle] || []).filter(c => c.id !== commentId)
        }));
        return true;
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
    return false;
  };

  interface Comment {
    id: string;
    user: string;
    text: string;
    timestamp: number;
  }
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

  // Update currentSong when track changes
  useEffect(() => {
    if (currentTrack && videoList.length > 0) {
      const video = videoList.find(v => v.path === currentTrack.url);
      if (video) {
        setCurrentSong(video);
      }
    }
  }, [currentTrackIndex, videoList]);

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
      localStorage.setItem('rpopgolden_settings', JSON.stringify(settings));
      console.log('💾 All audio settings saved for rpopgolden:', settings);
    } catch (e) {
      console.error('Error saving audio settings:', e);
    }
  }, [powerOn, volume, bass, treble, balance, theme]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Save watermark settings to localStorage with persistence
  useEffect(() => {
    const saveWatermarkSettings = () => {
      try {
        localStorage.setItem('beccabear@13_watermark_settings', JSON.stringify(watermarkData));
        console.log('💾 Watermark settings saved');
      } catch (e) {
        console.error('Error saving watermark settings:', e);
      }
    };

    // Save immediately when settings change
    saveWatermarkSettings();

    // Also save when the window is about to unload
    window.addEventListener('beforeunload', saveWatermarkSettings);
    return () => window.removeEventListener('beforeunload', saveWatermarkSettings);
  }, [watermarkData]);

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
  
  const handleRightSpeaker1Click = () => {
    if (currentTrack) {
      handleOpenSongComments(currentTrack.file.name);
    }
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
      const messageText = `Message from daughter about: ${currentSong}\n\n${comment}\n\nSent from R-Pop Golden Boombox`;
      
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

  // Song comment handlers
  const handleOpenSongComments = (songTitle: string) => {
    setSelectedSongForComments(songTitle);
    setShowCommentModal(true);
    loadCommentsForSong(songTitle);
  };

  const handleCloseSongComments = () => {
    setShowCommentModal(false);
    setSelectedSongForComments(null);
    setCommentText('');
    setEditingCommentId(null);
    setEditingText('');
    setShowRightSpeaker1(false); // Also close the speaker drop-up when closing comments
  };

  const handleAddSongComment = async () => {
    if (!selectedSongForComments || !commentText.trim()) return;

    const success = await saveCommentToFirebase(selectedSongForComments, 'beccabear@13', commentText.trim());
    if (success) {
      setCommentText('');
    }
  };

  const handleEditSongComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleSaveSongComment = (commentId: string) => {
    if (!selectedSongForComments || !editingText.trim()) return;

    setSongComments(prev => ({
      ...prev,
      [selectedSongForComments]: (prev[selectedSongForComments] || []).map(c =>
        c.id === commentId ? { ...c, text: editingText.trim() } : c
      )
    }));

    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDeleteSongComment = async (commentId: string) => {
    if (!selectedSongForComments) return;

    const success = await deleteCommentFromFirebase(selectedSongForComments, commentId);
    if (!success) {
      // If Firebase delete fails, fallback to local delete
      setSongComments(prev => ({
        ...prev,
        [selectedSongForComments]: (prev[selectedSongForComments] || []).filter(c => c.id !== commentId)
      }));
    }
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
        className="w-full max-w-6xl mx-auto transition-colors duration-500"
        style={{ height: 'calc(100vh - 1rem)' }}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
        onDragOver={handleDragOver} onDrop={handleDrop}
      >
        <Banner
          showProfileLogo={showProfileLogo}
          setShowProfileLogo={setShowProfileLogo}
          customProfileImage={customProfileImage}
          handleProfileRightClick={handleProfileRightClick}
          setIsSettingsOpen={setIsSettingsOpen}
        />
        
        {/* Hidden file input for profile image upload */}
        <input
          id="profile-image-upload"
          type="file"
          accept="image/*"
          onChange={handleProfileImageChange}
          className="hidden"
        />

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto pb-16">
        
        {/* 1. VIDEO FEED */}
        <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 mx-4 mt-2 shadow-inner border border-black/50">
          <div ref={videoContainerRef} className="relative w-full bg-black rounded-lg shadow-inner overflow-hidden h-56 sm:h-64 group" onMouseMove={showControls} onMouseLeave={hideControls}>
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
              {!mediaError && <h2 className="text-4xl font-bold text-[var(--color-text-primary)] opacity-20 tracking-widest">AudioBox</h2>}
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

          {/* Watermark Layers Section */}
          {radioMode === 'VIDEO' && currentTrack && watermarkData?.layers && watermarkData.layers.length > 0 && (
            <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-3 shadow-inner border border-pink-400 mt-2">
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

        {/* 2. SONG SELECTIONS BOX */}
        <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 mx-4 mt-4 shadow-inner border-2 border-black/50">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 text-center">SONG SELECTIONS</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto overscroll-contain -mx-1 px-1">
            {mediaQueue.map((track, index) => (
              <div 
                key={index}
                onClick={() => handleTrackSelect(index)}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  index === currentTrackIndex 
                    ? 'bg-[var(--color-accent)] text-[var(--color-text-primary)]' 
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{index + 1}.</span>
                  <span className="text-sm truncate flex-1">{track.file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSongComments(track.file.name);
                    }}
                    className="w-6 h-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded text-xs font-bold hover:opacity-80 flex items-center justify-center"
                    title="Comments"
                  >
                    C
                  </button>
                  {index === currentTrackIndex && tapeState === 'playing' && <span className="text-xs">▶️</span>}
                </div>
              </div>
            ))}
            {mediaQueue.length === 0 && (
              <div className="text-center text-[var(--color-text-secondary)] py-4">
                No songs loaded
              </div>
            )}
          </div>
        </div>

        {/* 3. THE PLAY BUTTONS REWIND ETC. */}
        <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 mx-4 mt-4 shadow-inner border-2 border-black/50">
          <div className="flex justify-center items-center gap-4">
            <button 
              onClick={handlePrevTrack}
              disabled={mediaQueue.length <= 1}
              className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] disabled:opacity-50 disabled:cursor-not-allowed rounded text-[var(--color-text-primary)] font-bold"
            >
              ⏮️
            </button>
            <button 
              onClick={() => handleSeek('backward')}
              className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] rounded text-[var(--color-text-primary)] font-bold"
            >
              ⏪
            </button>
            <button 
              onClick={tapeState === 'playing' ? handlePause : handlePlay}
              className="px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] rounded text-[var(--color-text-primary)] font-bold text-lg"
            >
              {tapeState === 'playing' ? '⏸️' : '▶️'}
            </button>
            <button 
              onClick={() => handleSeek('forward')}
              className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] rounded text-[var(--color-text-primary)] font-bold"
            >
              ⏩
            </button>
            <button 
              onClick={handleNextTrack}
              disabled={mediaQueue.length <= 1}
              className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] disabled:opacity-50 disabled:cursor-not-allowed rounded text-[var(--color-text-primary)] font-bold"
            >
              ⏭️
            </button>
            <button 
              onClick={handleStop}
              className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] rounded text-[var(--color-text-primary)] font-bold"
            >
              ⏹️
            </button>
          </div>
        </div>

        {/* 4. LOAD MEDIA */}
        <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 mx-4 mt-4 shadow-inner border-2 border-black/50 text-center">
          <label htmlFor="file-upload" className="w-full bg-[var(--color-accent-dark)] hover:bg-[var(--color-accent)] text-[var(--color-text-primary)] font-bold py-3 px-6 rounded-md text-lg cursor-pointer transition-colors inline-block">
            📁 LOAD MEDIA
          </label>
          <input id="file-upload" type="file" accept="audio/*,video/*" onChange={handleFileChange} className="hidden" multiple />
        </div>

        {/* 5. SPEAKERS 2 COLUMNS 2 ROWS */}
        <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 mx-4 mt-4 shadow-inner border-2 border-black/50">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 text-center">SPEAKERS</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex justify-center">
              <Speaker 
                analyser={analyserRef.current} 
                isPlaying={tapeState === 'playing'}
              />
            </div>
            <div className="flex justify-center">
              <Speaker 
                analyser={analyserRef.current} 
                isPlaying={tapeState === 'playing'}
                onTriangleClick={handleRightSpeaker1Click}
                showDropUp={showRightSpeaker1}
                isCommentBox={true}
                currentSong={currentSong}
              />
            </div>
            <div className="flex justify-center">
              <Speaker 
                analyser={analyserRef.current} 
                isPlaying={tapeState === 'playing'}
                isCommentBox={true}
                currentSong={currentSong}
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

        {/* 6. VOLUME CONTROLS */}
        <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 mx-4 mt-4 shadow-inner border-2 border-black/50">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 text-center">VOLUME CONTROLS</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-[var(--color-text-secondary)] w-16">VOLUME</span>
              <ControlKnob label="" value={volume} setValue={handleVolumeChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ControlSlider label="Bass" value={bass} setValue={setBass} min={-20} max={20} />
              <ControlSlider label="Treble" value={treble} setValue={setTreble} min={-20} max={20} />
              <ControlSlider label="Balance" value={balance} setValue={setBalance} min={-50} max={50} showValue={false} />
            </div>
          </div>
        </div>

        </div>

        {/* Settings and other overlays */}
        {isDraggingOver && (
          <div className="fixed inset-0 bg-[var(--color-bg-primary)] bg-opacity-80 rounded-[28px] flex flex-col items-center justify-center pointer-events-none z-20 border-4 border-dashed border-[var(--color-accent)] backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-4 4m0 0l4-4m-4 4h12" /></svg>
            <p className="text-2xl mt-4 font-bold text-[var(--color-text-primary)]">Drop Media File(s)</p>
          </div>
        )}
        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

        {/* Song Comments Modal */}
        {showCommentModal && selectedSongForComments && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-primary)] border-4 border-[var(--color-surface)] rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
              {/* Header with close button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[var(--color-accent)]">
                  💬 Comments for "{selectedSongForComments}"
                </h3>
                <button
                  onClick={handleCloseSongComments}
                  className="w-6 h-6 bg-black text-white rounded text-xs font-bold flex items-center justify-center hover:bg-gray-800"
                  title="Close"
                >
                  C
                </button>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-64">
                {(songComments[selectedSongForComments] || []).length === 0 ? (
                  <div className="text-center text-[var(--color-text-secondary)] py-4">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  (songComments[selectedSongForComments] || []).map((comment) => (
                    <div key={comment.id} className="bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-accent)]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[var(--color-accent)] font-semibold text-sm">{comment.user}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </div>
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
                      {editingCommentId === comment.id ? (
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleSaveSongComment(comment.id)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingText('');
                            }}
                            className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      ) : (
                        comment.user === 'beccabear@13' && (
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => handleEditSongComment(comment)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSongComment(comment.id)}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add comment */}
              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey && commentText.trim()) {
                      handleAddSongComment();
                    }
                  }}
                  placeholder="Add a comment... (Ctrl+Enter to post)"
                  className="flex-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] px-3 py-2 rounded border border-[var(--color-accent)] focus:outline-none resize-none"
                  rows={2}
                />
                <button
                  onClick={handleAddSongComment}
                  disabled={!commentText.trim()}
                  className="bg-[var(--color-accent)] text-[var(--color-bg-primary)] px-4 py-2 rounded font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default Boombox;