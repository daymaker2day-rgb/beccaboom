import React, { useState, useRef, useEffect, useCallback } from 'react';
import Speaker from './Speaker';
import CassetteDeck from './CassetteDeck';
import RadioTuner from './RadioTuner';
import ControlKnob from './ControlKnob';
import ControlSlider from './ControlSlider';
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

const Boombox: React.FC = () => {
  const [powerOn, setPowerOn] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(50);
  const [bass, setBass] = useState<number>(0);
  const [treble, setTreble] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [radioMode, setRadioMode] = useState<RadioMode>('AUDIO');
  const [tapeState, setTapeState] = useState<TapeState>('stopped');
  const [mediaQueue, setMediaQueue] = useState<MediaQueueItem[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [theme, setTheme] = useState<string>('theme-pink');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const mediaElementRef = useRef<HTMLVideoElement>(null);
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

        pannerRef.current = audioContextRef.current.createStereoPanner();
        
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
  
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMediaError(null);
    
    const newItems: MediaQueueItem[] = Array.from(files)
        .filter(file => file.type.startsWith('audio/') || file.type.startsWith('video/'))
        .map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));

    if (newItems.length === 0) return;

    const wasQueueEmpty = mediaQueue.length === 0;
    const oldQueueLength = mediaQueue.length;
    setMediaQueue(prevQueue => [...prevQueue, ...newItems]);
    
    if (wasQueueEmpty || tapeState === 'stopped') {
        setCurrentTrackIndex(oldQueueLength);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
  };
  
  useEffect(() => {
    const mediaElement = mediaElementRef.current;
    if (currentTrack && mediaElement) {
      setMediaError(null);
      mediaElement.src = currentTrack.url;
      mediaElement.load();
      
      const onCanPlay = () => {
          handlePlay();
          mediaElement.removeEventListener('canplay', onCanPlay);
      };
      
      mediaElement.addEventListener('canplay', onCanPlay);
      
      setRadioMode(currentTrack.file.type.startsWith('video') ? 'VIDEO' : 'AUDIO');
    }
  }, [currentTrackIndex, currentTrack]);

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
    if (pannerRef.current) pannerRef.current.pan.value = balance / 50;
  }, [balance]);

  const handlePlay = useCallback(() => {
    if (!mediaElementRef.current || !currentTrack) return;
    setMediaError(null);
    setupAudioContext();
    mediaElementRef.current.play().then(() => {
        setTapeState('playing');
    }).catch(e => {
        console.error("Playback failed:", e);
        setMediaError("Could not start playback. File might be unsupported.");
        setTapeState('stopped');
    });
  }, [currentTrack, setupAudioContext]);
  
  const handlePause = () => {
    mediaElementRef.current?.pause();
    setTapeState('paused');
  };

  const handleStop = () => {
    if(mediaElementRef.current) {
        mediaElementRef.current.pause();
        mediaElementRef.current.currentTime = 0;
    }
    setTapeState('stopped');
    setMediaError(null);
  };
  
  const handleSeek = (direction: 'forward' | 'backward') => {
      if(mediaElementRef.current) {
          const newTime = mediaElementRef.current.currentTime + (direction === 'forward' ? 5 : -5);
          mediaElementRef.current.currentTime = Math.max(0, newTime);
      }
  };
  
  const handleNextTrack = () => {
    if (mediaQueue.length > 1) {
        setCurrentTrackIndex(prevIndex => (prevIndex + 1) % mediaQueue.length);
    }
  };

  const handlePrevTrack = () => {
    if (mediaQueue.length > 1) {
        setCurrentTrackIndex(prevIndex => (prevIndex - 1 + mediaQueue.length) % mediaQueue.length);
    }
  };

  const handleTrackSelect = (index: number) => {
    if (index >= 0 && index < mediaQueue.length) {
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

  const handleMediaError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const media = e.currentTarget;
    let message = 'An unknown playback error occurred.';
    if (media.error) {
        switch (media.error.code) {
            case media.error.MEDIA_ERR_ABORTED:
                message = 'Playback was aborted.';
                break;
            case media.error.MEDIA_ERR_NETWORK:
                message = 'A network error caused the media to fail.';
                break;
            case media.error.MEDIA_ERR_DECODE:
                message = 'The file could not be decoded. It may be corrupt or unsupported.';
                break;
            case media.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                message = 'The media format is not supported.';
                break;
            default:
                message = 'An error occurred during playback.';
        }
    }
    setMediaError(message);
    setTapeState('stopped');
  };

  const handleThemeSelect = (selectedTheme: string) => {
    setTheme(selectedTheme);
    setIsThemeMenuOpen(false);
  }

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
    }
  };
  
  const getDisplayContent = () => {
    if (mediaError) {
      return <p className="text-[var(--color-accent)] font-mono text-sm truncate text-center px-2">{mediaError}</p>;
    }
    if (!currentTrack) {
      return <p className="text-[var(--color-text-primary)] font-mono text-sm truncate text-center">Load or drop media</p>;
    }
    const queueInfo = mediaQueue.length > 1 ? `(Track ${currentTrackIndex + 1} of ${mediaQueue.length})` : '';
    return <p className="text-[var(--color-text-primary)] font-mono text-sm truncate text-center">{`${currentTrack.file.name} ${queueInfo}`}</p>;
  }

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

  return (
    <>
    <div 
      className={`w-full max-w-6xl mx-auto transition-colors duration-500 relative`}
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
      onDragOver={handleDragOver} onDrop={handleDrop}
    >
      <div className="h-16 bg-[var(--color-bg-secondary)] border-x-8 border-t-8 border-[var(--color-bg-primary)] rounded-t-3xl w-[70%] mx-auto shadow-inner relative">
         <div className="h-full bg-gradient-to-b from-[var(--color-surface-light)] to-[var(--color-surface)] rounded-t-2xl w-full mx-auto shadow-md flex justify-between items-center px-8">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] drop-shadow-lg tracking-widest">AudioBox</h1>
            <button onClick={() => setIsSettingsOpen(true)} className="text-[var(--color-accent)] hover:opacity-80 transition-opacity" title="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.962.062 2.18-.948 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
         </div>
      </div>

      <div className="bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg-secondary)] border-8 border-[var(--color-bg-primary)] rounded-3xl p-4 sm:p-6 shadow-2xl relative">
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-2 flex flex-col items-center justify-center gap-6">
             <Speaker analyser={analyserRef.current} isPlaying={tapeState === 'playing'} />
             <Speaker analyser={analyserRef.current} isPlaying={tapeState === 'playing'} />
          </div>

          <div className="col-span-8 flex flex-col gap-4">
            <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 shadow-inner border-2 border-black/50 flex flex-col gap-3 flex-grow min-h-0">
               <div ref={videoContainerRef} className="relative w-full bg-black rounded-lg shadow-inner overflow-hidden flex-grow group" onMouseMove={showControls} onMouseLeave={hideControls}>
                  <video
                      ref={mediaElementRef}
                      className={`w-full h-full object-contain ${radioMode === 'VIDEO' && currentTrack ? 'block' : 'hidden'}`}
                      onEnded={handleTrackEnd}
                      onPlay={() => setTapeState('playing')}
                      onPause={() => tapeState !== 'stopped' && setTapeState('paused')}
                      onError={handleMediaError}
                      onClick={handleVideoClick}
                  />
                  <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-opacity ${radioMode === 'VIDEO' && currentTrack ? 'hidden' : 'flex'}`}>
                      {!mediaError && <h2 className="text-6xl font-bold text-[var(--color-text-primary)] opacity-20 tracking-widest">AudioBox</h2>}
                      {(radioMode !== 'VIDEO' || !currentTrack) && !mediaError && <RadioTuner mode={radioMode} />}
                  </div>
                  {radioMode === 'VIDEO' && currentTrack && tapeState !== 'playing' && isControlsVisible && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <button onClick={handlePlay} className="w-20 h-20 rounded-full bg-black/50 text-white flex items-center justify-center pointer-events-auto backdrop-blur-sm">
                           <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm8 6l-4 3V7l4 3z"></path></svg>
                       </button>
                     </div>
                  )}
                  {radioMode === 'VIDEO' && currentTrack && (
                    <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                      <VideoControls
                        isPlaying={tapeState === 'playing'}
                        onPlayPause={handleVideoClick}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeekVideo}
                        volume={volume}
                        onVolumeChange={handleVolumeChange}
                        isMuted={isMuted}
                        onMuteToggle={handleMuteToggle}
                        onFullscreen={handleFullscreen}
                      />
                    </div>
                  )}
              </div>
            </div>

            <div className="bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 shadow-inner border-2 border-black/50 flex flex-col gap-3 h-64">
              <div className="p-2 bg-black/50 rounded-lg w-full flex-shrink-0">{getDisplayContent()}</div>
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

          <div className="col-span-2 flex flex-col items-center justify-center gap-6">
            <Speaker analyser={analyserRef.current} isPlaying={tapeState === 'playing'} />
            <Speaker analyser={analyserRef.current} isPlaying={tapeState === 'playing'} />
          </div>
        </div>

        <div className="mt-6 bg-[var(--color-bg-primary)] bg-opacity-60 rounded-xl p-4 shadow-inner border-2 border-black/50">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
            <div className="relative flex flex-col items-center gap-2">
                 <span className="text-[var(--color-text-secondary)] font-bold text-xs uppercase">Mode</span>
                 <div className="flex gap-2 p-1 bg-black rounded-lg">
                    <button onClick={() => {}} className={`px-3 py-1 text-sm rounded transition-colors ${radioMode === 'VIDEO' ? 'bg-[var(--color-accent)] text-[var(--color-text-primary)] shadow-md' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>VIDEO</button>
                    <button onClick={() => setIsThemeMenuOpen(prev => !prev)} className={`px-3 py-1 text-sm rounded transition-colors ${isThemeMenuOpen ? 'bg-[var(--color-accent)] text-[var(--color-text-primary)] shadow-md' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>THEME</button>
                 </div>
                 {isThemeMenuOpen && <ThemeMenu onSelectTheme={handleThemeSelect} />}
            </div>
            <ControlKnob label="Volume" value={volume} setValue={setVolume} />
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
    </div>
    {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
};

export default Boombox;