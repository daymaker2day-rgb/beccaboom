import React, { useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

const CORRECT_PASSWORD = '1234'; // Simple default password

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const UnlockedContent = () => (
    <div className="text-[var(--color-text-primary)] space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-surface)] pb-2 mb-2">About AudioBox</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Your personal, private media player. Load your own audio and video files for a unique listening experience with vibrant, music-reactive visuals. Created with safety and privacy as the top priority.
        </p>
      </div>
      <div>
        <h3 className="text-xl font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-surface)] pb-2 mb-2">Privacy & Safety Guarantee</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start"><span className="mr-2">✅</span><span className="flex-1"><strong>No Tracking:</strong> This app does not track your activity in any way.</span></li>
          <li className="flex items-start"><span className="mr-2">✅</span><span className="flex-1"><strong>No Data Collection:</strong> We do not collect, store, or share any personal information.</span></li>
          <li className="flex items-start"><span className="mr-2">✅</span><span className="flex-1"><strong>No Geolocation:</strong> Location services are never requested or used.</span></li>
          <li className="flex items-start"><span className="mr-2">✅</span><span className="flex-1"><strong>Local Files Only:</strong> Your media files are processed on your device and are never uploaded to any server.</span></li>
        </ul>
      </div>
       <div>
        <h3 className="text-xl font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-surface)] pb-2 mb-2">Enjoying the App?</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
            This app is designed to be a safe and fun media player for everyone. The default password is <strong>{CORRECT_PASSWORD}</strong>.
        </p>
      </div>
    </div>
  );

  const PasswordPrompt = () => (
    <div className="text-center">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Settings Locked</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">Please enter the password to access the settings.</p>
        <form onSubmit={handlePasswordSubmit}>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-[var(--color-bg-deep)] border-2 border-[var(--color-surface)] text-[var(--color-text-primary)] text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="****"
            />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            <button
                type="submit"
                className="w-full mt-4 bg-[var(--color-accent-dark)] hover:bg-[var(--color-accent)] text-[var(--color-text-primary)] font-bold py-2 px-4 rounded-md transition-colors"
            >
                Unlock
            </button>
        </form>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-[var(--color-bg-primary)] border-4 border-[var(--color-surface)] rounded-2xl shadow-2xl p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {isUnlocked ? <UnlockedContent /> : <PasswordPrompt />}
      </div>
    </div>
  );
};

export default SettingsModal;