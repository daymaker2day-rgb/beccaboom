import React from 'react';

interface VideoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  isMuted: boolean;
  onFullscreen: () => void;
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const PlayIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm8 6l-4 3V7l4 3z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2h2v8H7V6zm5 0h2v8h-2V6z" />
  </svg>
);

const VolumeHighIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3.25a.75.75 0 00-1.5 0v13.5a.75.75 0 001.5 0V3.25zM3.75 7.5a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5zM13.75 7.5a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z"></path></svg>
);

const VolumeOffIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3.25a.75.75 0 00-1.5 0v13.5a.75.75 0 001.5 0V3.25zM3.75 7.5a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5zm10.628 3.128a.75.75 0 00-1.06-1.06L12.25 10.62l-1.069-1.06a.75.75 0 00-1.061 1.06L11.19 11.68l-1.06 1.06a.75.75 0 101.06 1.061l1.06-1.06 1.06 1.06a.75.75 0 101.06-1.06l-1.06-1.061 1.06-1.06z" clipRule="evenodd"></path></svg>
);

const FullscreenEnterIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2.5 5.5a.75.75 0 00-.75.75v8a.75.75 0 00.75.75h8a.75.75 0 000-1.5h-7.25V6.25a.75.75 0 00-.75-.75zM14.5 2.5a.75.75 0 00-.75.75v7.25h-7.25a.75.75 0 000 1.5h8a.75.75 0 00.75-.75v-8a.75.75 0 00-.75-.75z"></path></svg>
);


const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying, onPlayPause, currentTime, duration, onSeek,
  volume, onVolumeChange, isMuted, onMuteToggle, onFullscreen
}) => {
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };
  
  const handleVolumeChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  const handleTouch = (e: React.TouchEvent<HTMLInputElement>) => {
    // Prevent default touch behavior to ensure volume controls work on mobile
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    const rect = input.getBoundingClientRect();
    const touch = e.touches[0];
    const percentage = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const newVolume = Math.round(percentage * 100);
    onVolumeChange(newVolume);
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-end p-2 sm:p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
      <div className="w-full mb-8">
        {/* Progress Bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeekChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[var(--color-accent)] [&::-moz-range-thumb]:rounded-full"
        />

        {/* Bottom Controls */}
        <div className="flex items-center justify-between text-white mt-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onPlayPause} className="hover:text-[var(--color-accent)] transition-colors">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="flex items-center gap-2 group">
                <button onClick={onMuteToggle} className="hover:text-[var(--color-accent)] transition-colors">
                    {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeHighIcon />}
                </button>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChangeLocal}
                    onTouchStart={handleTouch}
                    onTouchMove={handleTouch}
                    className="w-0 group-hover:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>

            <div className="text-xs font-mono">
              <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* CC Button Placeholder */}
            {/* <button className="hover:text-[var(--color-accent)] transition-colors text-xs font-bold border border-white rounded px-1">CC</button> */}
            <button onClick={onFullscreen} className="hover:text-[var(--color-accent)] transition-colors">
              <FullscreenEnterIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;