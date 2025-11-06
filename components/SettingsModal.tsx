import React, { useEffect, useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
  usedFormatted: string;
  quotaFormatted: string;
  available: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [localStorageSize, setLocalStorageSize] = useState<string>('0 KB');

  useEffect(() => {
    // Get localStorage size
    const getLocalStorageSize = () => {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      // Convert to KB or MB
      const kb = total / 1024;
      if (kb > 1024) {
        return `${(kb / 1024).toFixed(2)} MB`;
      }
      return `${kb.toFixed(2)} KB`;
    };

    setLocalStorageSize(getLocalStorageSize());

    // Get browser storage quota (if supported)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;
        
        const formatBytes = (bytes: number): string => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        setStorageInfo({
          used,
          quota,
          percentage,
          usedFormatted: formatBytes(used),
          quotaFormatted: formatBytes(quota),
          available: formatBytes(quota - used)
        });
      });
    }
  }, []);

  const ModalContent = () => (
    <div className="text-[var(--color-text-primary)] space-y-4 sm:space-y-6">
      <div>
        <img src="./images/appicon.webp" alt="Banner" className="w-full mb-4 rounded-lg" style={{ maxWidth: '100%', height: 'auto' }} />
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
          Your personal, private media player. Load your own audio and video files for a unique listening experience with vibrant, music-reactive visuals. Created with safety and privacy as the top priority.
        </p>
      </div>

      {/* Storage Information */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-surface)] pb-2 mb-3">💾 Storage Information</h3>
        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
          {storageInfo ? (
            <>
              <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)]">Storage Used:</span>
                  <span className="font-bold text-[var(--color-accent)]">{storageInfo.usedFormatted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)]">Total Available:</span>
                  <span className="font-bold">{storageInfo.quotaFormatted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)]">Space Remaining:</span>
                  <span className="font-bold text-green-400">{storageInfo.available}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Usage</span>
                    <span>{storageInfo.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface)] rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        storageInfo.percentage > 90 ? 'bg-red-500' : 
                        storageInfo.percentage > 70 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)]">Playlist Data (localStorage):</span>
                  <span className="font-bold">{localStorageSize}</span>
                </div>
              </div>

              {storageInfo.percentage > 80 && (
                <div className="bg-yellow-900/30 border border-yellow-500 p-3 rounded-lg">
                  <p className="text-yellow-300 text-xs">
                    ⚠️ <strong>Storage Warning:</strong> You're running low on storage space. Consider using Google Drive to store your media files externally.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-[var(--color-text-secondary)] italic">Calculating storage usage...</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg sm:text-xl font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-surface)] pb-2 mb-2">Features & Tips</h3>
        <ul className="space-y-2 text-xs sm:text-sm">
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">🎵</span><span className="flex-1"><strong>Reorder Songs:</strong> Click and hold (or press and drag) on any song in your playlist to change its position. Drag up or down to rearrange your music order.</span></li>
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">🎮</span><span className="flex-1"><strong>Controls:</strong> Use the knobs to adjust volume, bass, and treble. The slider controls left/right balance.</span></li>
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">📺</span><span className="flex-1"><strong>Video Mode:</strong> Switch between audio and video modes using the radio tuner.</span></li>
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">☁️</span><span className="flex-1"><strong>Google Drive:</strong> Running low on storage? Use Google Drive integration to stream your media without taking up local space.</span></li>
        </ul>
      </div>
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-surface)] pb-2 mb-2">Privacy & Safety Guarantee</h3>
        <ul className="space-y-2 text-xs sm:text-sm">
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">✅</span><span className="flex-1"><strong>No Tracking:</strong> This app does not track your activity in any way.</span></li>
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">✅</span><span className="flex-1"><strong>No Data Collection:</strong> We do not collect, store, or share any personal information.</span></li>
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">✅</span><span className="flex-1"><strong>No Geolocation:</strong> Location services are never requested or used.</span></li>
          <li className="flex items-start"><span className="mr-2 flex-shrink-0">✅</span><span className="flex-1"><strong>Local Files Only:</strong> Your media files are processed on your device and are never uploaded to any server.</span></li>
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-surface)] pb-2 mb-2">Enjoying the App?</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
            This app is designed to be a safe and fun media player for everyone.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] bg-[var(--color-bg-primary)] border-2 sm:border-4 border-[var(--color-surface)] rounded-xl sm:rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8">
          <ModalContent />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;