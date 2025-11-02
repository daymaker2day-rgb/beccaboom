import React from 'react';
import { RadioMode } from '../types';

interface ModeMenuProps {
  currentMode: RadioMode;
  onSelectMode: (mode: RadioMode) => void;
}

const ModeMenu: React.FC<ModeMenuProps> = ({ currentMode, onSelectMode }) => {
  const modes: { id: RadioMode; name: string }[] = [
    { id: 'VIDEO', name: 'Video' },
    { id: 'AUDIO', name: 'Audio' }
  ];

  return (
    <div className="absolute bottom-full mb-2 w-40 bg-[var(--color-bg-primary)] border-2 border-[var(--color-surface)] rounded-lg shadow-2xl p-2 z-[60] flex flex-col gap-2">
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

export default ModeMenu;