import React, { useState } from 'react';
import { listeningHistoryService } from '../services/listeningHistoryService';

interface QuickCheckProps {
  onClose: () => void;
}

const QuickCheck: React.FC<QuickCheckProps> = ({ onClose }) => {
  const [songTitle, setSongTitle] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!songTitle.trim()) return;
    
    setLoading(true);
    try {
      const hasBeenPlayed = await listeningHistoryService.hasSongBeenPlayed(songTitle.trim());
      const stats = await listeningHistoryService.getListeningStats();
      
      if (hasBeenPlayed) {
        setResult(`✅ "${songTitle}" HAS been listened to!`);
      } else {
        setResult(`❌ "${songTitle}" has NOT been listened to yet.`);
      }
    } catch (error) {
      setResult(`❌ Error checking song: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 max-w-lg w-full border-2 border-[var(--color-surface)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--color-accent)]">
            🔍 Quick Song Check
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Song Title:
            </label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="Enter exact song title..."
              className="w-full px-3 py-2 bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded border border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              💡 Tip: Use the exact filename (e.g., "song.mp3")
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={!songTitle.trim() || loading}
            className="w-full px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : '🔍 Check Song'}
          </button>

          {result && (
            <div className={`p-3 rounded text-center font-medium ${
              result.includes('HAS been') 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : result.includes('has NOT been')
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {result}
            </div>
          )}

          <div className="text-xs text-[var(--color-text-secondary)] text-center">
            This checks both cloud and local listening history
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCheck;