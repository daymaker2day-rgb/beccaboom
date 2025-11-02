import React from 'react';

interface ThemeMenuProps {
  onSelectTheme: (theme: string) => void;
}

const ThemeMenu: React.FC<ThemeMenuProps> = ({ onSelectTheme }) => {
  const themes = [
    { id: 'theme-pink', name: 'Pink Future' },
    { id: 'theme-neon', name: 'Neon Nights' },
    { id: 'theme-rainbow', name: 'Rainbow Pop' },
    { id: 'theme-classic', name: 'Classic Gray' },
  ];
  
  return (
    <div className="absolute bottom-full mb-2 w-40 bg-[var(--color-bg-primary)] border-2 border-[var(--color-surface)] rounded-lg shadow-2xl p-2 z-[60] flex flex-col gap-2">
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

export default ThemeMenu;