import React, { useEffect, useRef } from 'react';
import { TapeState, MediaQueueItem } from '../types';

interface CassetteDeckProps {
    tapeState: TapeState;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onRewind: () => void;
    onFastForward: () => void;
    onPrevTrack: () => void;
    onNextTrack: () => void;
    isPrevEnabled: boolean;
    isNextEnabled: boolean;
    mediaQueue: MediaQueueItem[];
    currentTrackIndex: number;
    onTrackSelect: (index: number) => void;
}

const ControlButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    isActive?: boolean;
    disabled?: boolean;
    className?: string;
}> = ({ onClick, children, isActive, disabled, className = '' }) => {
    const baseClasses = 'w-full px-2 py-3 rounded-md text-[var(--color-text-primary)] font-mono text-xs transition-all duration-75 transform';
    const activeClasses = isActive ? 'bg-[var(--color-bg-primary)] border-b-0 translate-y-0.5' : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] border-b-4 border-[var(--color-bg-primary)] active:bg-[var(--color-bg-primary)] active:border-b-0 active:translate-y-0.5';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
    
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${activeClasses} ${disabledClasses} ${className}`}
        >
            {children}
        </button>
    );
};


const CassetteDeck: React.FC<CassetteDeckProps> = ({ 
    tapeState, 
    onPlay, 
    onPause, 
    onStop, 
    onRewind, 
    onFastForward,
    onPrevTrack,
    onNextTrack,
    isPrevEnabled,
    isNextEnabled,
    mediaQueue,
    currentTrackIndex,
    onTrackSelect
}) => {
  const activeTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTrackRef.current) {
        activeTrackRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }
  }, [currentTrackIndex]);


  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Playlist View */}
      <div className="flex-grow min-h-0 bg-black/50 border-2 border-[var(--color-bg-secondary)] rounded-lg p-1 shadow-inner overflow-y-auto hide-scrollbar">
        {mediaQueue.length > 0 ? (
            mediaQueue.map((item, index) => (
                <div
                    key={`${item.file.name}-${index}`}
                    ref={index === currentTrackIndex ? activeTrackRef : null}
                    onClick={() => onTrackSelect(index)}
                    className={`
                        w-full p-2 text-left rounded-md cursor-pointer transition-colors duration-150
                        ${index === currentTrackIndex 
                            ? 'bg-[var(--color-accent)] text-[var(--color-text-primary)] font-bold' 
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
                        }
                    `}
                >
                    <p className="text-sm truncate">
                        {index + 1}. {item.file.name}
                    </p>
                </div>
            ))
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-[var(--color-text-secondary)] text-sm">Playlist is empty</p>
            </div>
        )}
      </div>

      {/* Transport Controls */}
      <div className="grid grid-cols-7 gap-1.5 flex-shrink-0">
          <ControlButton onClick={onPrevTrack} disabled={!isPrevEnabled}>|◀</ControlButton>
          <ControlButton onClick={onRewind}>◀◀</ControlButton>
          <ControlButton onClick={onPlay} isActive={tapeState === 'playing'} className="text-lg" disabled={currentTrackIndex === -1}>▶</ControlButton>
          <ControlButton onClick={onPause} isActive={tapeState === 'paused'}>❚❚</ControlButton>
          <ControlButton onClick={onStop} isActive={tapeState === 'stopped'}>■</ControlButton>
          <ControlButton onClick={onFastForward}>▶▶</ControlButton>
          <ControlButton onClick={onNextTrack} disabled={!isNextEnabled}>▶|</ControlButton>
      </div>
    </div>
  );
};

export default CassetteDeck;