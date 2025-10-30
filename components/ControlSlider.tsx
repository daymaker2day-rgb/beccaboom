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
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  const updateValueFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    let p = (x / rect.width) * 100;
    p = Math.max(0, Math.min(100, p));
    const newValue = (p / 100) * (max - min) + min;
    setValue(Math.round(newValue));
  };

  const startDrag = (initialClientX: number, pointerType: 'mouse' | 'touch') => {
    updateValueFromClientX(initialClientX);

    if (pointerType === 'mouse') {
      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        updateValueFromClientX(moveEvent.clientX);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      const handleTouchMove = (moveEvent: TouchEvent) => {
        const touch = moveEvent.touches[0];
        if (!touch) return;
        moveEvent.preventDefault();
        updateValueFromClientX(touch.clientX);
      };

      const endTouch = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', endTouch);
        document.removeEventListener('touchcancel', endTouch);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', endTouch);
      document.addEventListener('touchcancel', endTouch);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    startDrag(e.clientX, 'mouse');
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(touch.clientX, 'touch');
  };

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    handleMouseDown(e);
  };

  const handleThumbTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(touch.clientX, 'touch');
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <span className="text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider">{label}</span>
      <div
        className="w-full h-10 flex items-center"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          ref={trackRef}
          className="w-full h-2 bg-black rounded-full shadow-inner relative cursor-pointer"
        >
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-[var(--color-text-secondary)] border-2 border-[var(--color-surface)] rounded-sm shadow-md"
            style={{ left: `calc(${percentage}% - 8px)` }}
            onMouseDown={handleThumbMouseDown}
            onTouchStart={handleThumbTouchStart}
          ></div>
        </div>
      </div>
       {showValue && <span className="text-[var(--color-text-primary)] font-mono text-sm">{value}</span>}
       {!showValue && label === 'Balance' && <div className="text-[var(--color-text-primary)] font-mono text-sm flex justify-between w-full px-1"><span className="text-xs">L</span><span className="text-xs">R</span></div>}
    </div>
  );
};

export default ControlSlider;