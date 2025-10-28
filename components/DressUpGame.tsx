import React, { useState, DragEvent } from 'react';
import '../styles/dressup.css';

interface ClothingItem {
  id: string;
  src: string;
  name: string;
  position?: { x: number; y: number };
}

const DressUpGame: React.FC = () => {
  const [placedItems, setPlacedItems] = useState<ClothingItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const clothingItems: ClothingItem[] = [
    { id: 'hat1', src: '/beccaboom/assets/dressup/hat.png', name: 'Hat' },
    { id: 'shirt1', src: '/beccaboom/assets/dressup/shirt.png', name: 'Shirt' },
    { id: 'dress1', src: '/beccaboom/assets/dressup/dress.png', name: 'Dress' },
    { id: 'shoes1', src: '/beccaboom/assets/dressup/shoes.png', name: 'Shoes' },
    { id: 'glasses1', src: '/beccaboom/assets/dressup/glasses.png', name: 'Glasses' },
    { id: 'bag1', src: '/beccaboom/assets/dressup/bag.png', name: 'Bag' },
  ];

  const handleDragStart = (e: DragEvent<HTMLDivElement>, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = e.clientY - rect.top - 50;

    const item = clothingItems.find(i => i.id === draggedItem);
    if (item) {
      setPlacedItems([...placedItems, { ...item, position: { x, y } }]);
    }
    setDraggedItem(null);
  };

  const handleReset = () => {
    setPlacedItems([]);
  };

  const removeItem = (index: number) => {
    setPlacedItems(placedItems.filter((_, i) => i !== index));
  };

  return (
    <div className="dressup-wrapper">
      <h1>👗 Dress Up Game 👗</h1>
      
      <div className="dressup-container">
        {/* Doll Area */}
        <div 
          className="doll-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="doll-base">
            <div className="doll-head">
              <div className="eye left">👁️</div>
              <div className="eye right">👁️</div>
              <div className="smile">😊</div>
            </div>
            <div className="doll-body"></div>
          </div>

          {/* Placed clothing items */}
          {placedItems.map((item, index) => (
            <div
              key={`placed-${index}`}
              className="placed-item"
              style={{
                left: `${item.position?.x}px`,
                top: `${item.position?.y}px`,
              }}
              onClick={() => removeItem(index)}
              title="Click to remove"
            >
              <img src={item.src} alt={item.name} />
            </div>
          ))}
        </div>

        {/* Clothing Options */}
        <div className="clothes-panel">
          <h3>Drag clothes to dress up! 👉</h3>
          <div className="clothes-grid">
            {clothingItems.map((item) => (
              <div
                key={item.id}
                className="clothing-item"
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
              >
                <img src={item.src} alt={item.name} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
          <button className="reset-btn" onClick={handleReset}>
            🔄 Reset
          </button>
        </div>
      </div>

      <p className="hint">💡 Tip: Click on placed items to remove them!</p>
    </div>
  );
};

export default DressUpGame;
