import React from 'react';

interface ControlSliderProps {
  label: string;
  value: number;
  setValue: (value: number) => void;
  min?: number;
  max?: number;
  showValue?: boolean;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, setValue, min = 0, max = 100, showValue = true }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    
    const updateValue = (clientX: number) => {
        const x = clientX - rect.left;
        let p = (x / rect.width) * 100;
        p = Math.max(0, Math.min(100, p));
        let newValue = (p / 100) * (max-min) + min;
        setValue(Math.round(newValue));
    }
    
    updateValue(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
        updateValue(moveEvent.clientX);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleThumbInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent the track's handler from firing, but start a similar drag on the track itself.
    e.stopPropagation();
    handleInteraction(e.currentTarget.parentElement?.parentElement as HTMLDivElement);
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <span className="text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider">{label}</span>
      <div className="w-full h-10 flex items-center" onMouseDown={handleInteraction}>
        <div className="w-full h-2 bg-black rounded-full shadow-inner relative cursor-pointer">
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-[var(--color-text-secondary)] border-2 border-[var(--color-surface)] rounded-sm shadow-md"
            style={{ left: `calc(${percentage}% - 8px)` }}
            onMouseDown={handleThumbInteraction}
          ></div>
        </div>
      </div>
       {showValue && <span className="text-[var(--color-text-primary)] font-mono text-sm">{value}</span>}
       {!showValue && label === 'Balance' && <div className="text-[var(--color-text-primary)] font-mono text-sm flex justify-between w-full px-1"><span className="text-xs">L</span><span className="text-xs">R</span></div>}
    </div>
  );
};

export default ControlSlider;