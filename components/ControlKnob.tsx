import React from 'react';

interface ControlKnobProps {
  label: string;
  value: number;
  setValue: (value: number) => void;
  min?: number;
  max?: number;
}

const ControlKnob: React.FC<ControlKnobProps> = ({ label, value, setValue, min = 0, max = 100 }) => {
  const rotation = ((value - min) / (max - min)) * 270 - 135; // Map value to -135 to 135 degrees

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startValue = value;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      let newValue = startValue + deltaY;
      newValue = Math.max(min, Math.min(max, newValue));
      setValue(Math.round(newValue));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider">{label}</span>
      <div 
        className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center p-1 shadow-inner border-2 border-black cursor-ns-resize"
        onMouseDown={handleMouseDown}
        >
        <div 
            className="w-full h-full rounded-full bg-gradient-to-b from-[var(--color-surface-light)] to-[var(--color-surface)] relative flex items-start justify-center pt-1 pointer-events-none"
            style={{ transform: `rotate(${rotation}deg)` }}
        >
            <div className="w-1 h-3 bg-[var(--color-text-primary)] rounded-full"></div>
        </div>
      </div>
       <span className="text-[var(--color-text-primary)] font-mono text-sm">{value}</span>
    </div>
  );
};

export default ControlKnob;