// Multi-Layer Watermark UI Component
// Replace the isVideoTools section in Speaker.tsx with this

interface WatermarkLayer {
  id: string;
  type: 'text' | 'square' | 'circle';
  text: string;
  color: string;
  thickness: number;
  opacity: number;
  x: number;
  y: number;
  angle: number;
  size: number;
  visible: boolean;
}

// Add these to Speaker component state:
// const [watermarkLayers, setWatermarkLayers] = useState<WatermarkLayer[]>([]);
// const [watermarkTraced, setWatermarkTraced] = useState(false);
// const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

// Add these handlers:
const addWatermarkLayer = (type: 'text' | 'square' | 'circle' = 'text') => {
  const newLayer: WatermarkLayer = {
    id: Date.now().toString(),
    type,
    text: type === 'text' ? 'CLIDEO' : '',
    color: '#FF00FF',
    thickness: 2,
    opacity: 100,
    x: 50,
    y: 50,
    angle: 0,
    size: 80,
    visible: true
  };
  setWatermarkLayers([...watermarkLayers, newLayer]);
  setSelectedLayerId(newLayer.id);
  showNotification(`➕ Added ${type} layer`);
};

const deleteWatermarkLayer = (layerId: string) => {
  setWatermarkLayers(watermarkLayers.filter(l => l.id !== layerId));
  if (selectedLayerId === layerId) {
    setSelectedLayerId(watermarkLayers.length > 1 ? watermarkLayers[0].id : null);
  }
  showNotification('🗑️ Layer deleted');
};

const updateWatermarkLayer = (layerId: string, updates: Partial<WatermarkLayer>) => {
  setWatermarkLayers(watermarkLayers.map(layer => 
    layer.id === layerId ? { ...layer, ...updates } : layer
  ));
  // Send real-time update
  if (watermarkTraced && onWatermarkChange) {
    onWatermarkChange({
      layers: watermarkLayers.map(layer => 
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
      traced: true
    } as any);
  }
};

const toggleLayerVisibility = (layerId: string) => {
  const layer = watermarkLayers.find(l => l.id === layerId);
  if (layer) {
    updateWatermarkLayer(layerId, { visible: !layer.visible });
  }
};

const handleApplyWatermarks = () => {
  if (watermarkLayers.length === 0) {
    showNotification('⚠️ Add at least one layer first');
    return;
  }
  setWatermarkTraced(true);
  showNotification(`✅ ${watermarkLayers.length} layer(s) applied`);
  
  if (onWatermarkChange) {
    onWatermarkChange({
      layers: watermarkLayers,
      traced: true
    } as any);
  }
};

const handleEraseAllLayers = () => {
  setWatermarkLayers([]);
  setWatermarkTraced(false);
  setSelectedLayerId(null);
  showNotification('🗑️ All layers removed');
  
  if (onWatermarkChange) {
    onWatermarkChange({
      layers: [],
      traced: false
    } as any);
  }
};

// JSX:
<div className="flex flex-col h-full gap-2 overflow-y-auto">
  <h3 className="text-[var(--color-accent)] font-bold text-lg border-b-2 border-[var(--color-accent)] pb-2">
    🎨 Multi-Layer Watermark
  </h3>
  
  {/* Status */}
  <div className={`p-2 rounded text-xs font-semibold text-center ${watermarkTraced ? 'bg-green-900/30 text-green-300 border border-green-500' : 'bg-gray-900/30 text-gray-300 border border-gray-500'}`}>
    {watermarkTraced ? `✓ ACTIVE (${watermarkLayers.filter(l => l.visible).length} visible)` : '○ Inactive'}
  </div>

  {/* Add Layer Buttons */}
  <div className="flex gap-1">
    <button onClick={() => addWatermarkLayer('text')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">
      ➕ Text
    </button>
    <button onClick={() => addWatermarkLayer('square')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
      ➕ □
    </button>
    <button onClick={() => addWatermarkLayer('circle')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1 px-2 rounded">
      ➕ ○
    </button>
  </div>

  {/* Layers List */}
  <div className="flex-1 bg-[var(--color-bg-secondary)] rounded p-2 overflow-y-auto border border-[var(--color-accent)]">
    {watermarkLayers.length === 0 ? (
      <div className="text-center text-gray-400 text-xs py-4">Click "Add" buttons above to create layers</div>
    ) : (
      <div className="space-y-2">
        {watermarkLayers.map((layer, idx) => (
          <div 
            key={layer.id} 
            onClick={() => setSelectedLayerId(layer.id)}
            className={`p-2 rounded border-2 cursor-pointer transition-all ${
              selectedLayerId === layer.id 
                ? 'border-[var(--color-accent)] bg-[var(--color-bg-primary)]' 
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="flex justify-between items-center gap-2">
              <div className="text-xs font-semibold">
                <span className="text-[var(--color-accent)]">{layer.type === 'text' ? 'Txt' : layer.type === 'square' ? '□' : '○'}</span>
                <span className="ml-1">{layer.text || `Layer ${idx + 1}`}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                  className="text-xs px-1 hover:bg-gray-600 rounded"
                >
                  {layer.visible ? '👁️' : '🚫'}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteWatermarkLayer(layer.id); }}
                  className="text-xs px-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Layer Controls - Show only if layer selected */}
  {selectedLayerId && watermarkLayers.find(l => l.id === selectedLayerId) && (() => {
    const layer = watermarkLayers.find(l => l.id === selectedLayerId)!;
    return (
      <div className="bg-[var(--color-bg-secondary)] rounded p-2 border border-[var(--color-accent)] space-y-2">
        <h4 className="text-xs font-bold text-[var(--color-accent)]">Edit Layer</h4>

        {/* Text Input (only for text layers) */}
        {layer.type === 'text' && (
          <div>
            <label className="text-xs text-gray-300 block mb-1">Text</label>
            <input 
              type="text" 
              value={layer.text} 
              onChange={(e) => updateWatermarkLayer(layer.id, { text: e.target.value })}
              className="w-full bg-[var(--color-bg-primary)] text-[var(--color-accent)] px-2 py-1 rounded border border-[var(--color-accent)] text-xs"
              placeholder="Your text"
            />
          </div>
        )}

        {/* Color */}
        <div>
          <label className="text-xs text-gray-300 block mb-1">Color</label>
          <input 
            type="color" 
            value={layer.color} 
            onChange={(e) => updateWatermarkLayer(layer.id, { color: e.target.value })}
            className="w-full h-6 cursor-pointer rounded"
          />
        </div>

        {/* X Position */}
        <div>
          <label className="text-xs text-gray-300">X: {layer.x}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={layer.x}
            onChange={(e) => updateWatermarkLayer(layer.id, { x: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Y Position */}
        <div>
          <label className="text-xs text-gray-300">Y: {layer.y}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={layer.y}
            onChange={(e) => updateWatermarkLayer(layer.id, { y: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Angle */}
        <div>
          <label className="text-xs text-gray-300">Angle: {layer.angle}°</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={layer.angle}
            onChange={(e) => updateWatermarkLayer(layer.id, { angle: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Size */}
        <div>
          <label className="text-xs text-gray-300">Size: {layer.size}px</label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            value={layer.size}
            onChange={(e) => updateWatermarkLayer(layer.id, { size: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="text-xs text-gray-300">Opacity: {layer.opacity}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={layer.opacity}
            onChange={(e) => updateWatermarkLayer(layer.id, { opacity: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Thickness */}
        <div>
          <label className="text-xs text-gray-300">Thickness: {layer.thickness}px</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={layer.thickness}
            onChange={(e) => updateWatermarkLayer(layer.id, { thickness: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    );
  })()}

  {/* Action Buttons */}
  <div className="space-y-1 flex flex-col">
    <button
      onClick={handleApplyWatermarks}
      disabled={watermarkLayers.length === 0}
      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-2 rounded text-xs transition-all"
    >
      ✓ Apply All Layers
    </button>
    <button
      onClick={handleEraseAllLayers}
      disabled={watermarkLayers.length === 0}
      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-2 rounded text-xs transition-all"
    >
      🗑️ Remove All
    </button>
  </div>
</div>
