import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const correctPassword = 'beccabear@13';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 theme-pink">
      <div className="w-full max-w-md relative">
        <div className="bg-[var(--color-bg-primary)] border-4 border-[var(--color-surface)] rounded-2xl shadow-2xl p-8 space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[var(--color-accent)] mb-4" style={{ fontFamily: 'var(--font-family)' }}>
              Rebecca Media Player
            </h1>
            
            {/* Logo with Music Note - R Icon */}
            <div className="flex justify-center mb-4 relative">
              {/* R Logo Background */}
              <div className="relative">
                <img 
                  src="images/120r.png" 
                  alt="R Logo" 
                  className="w-16 h-16 rounded-lg shadow-md bg-white"
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'images/120r.png';
                  }}
                />
                {/* Music Note Overlay */}
                <div className="absolute -bottom-1 -right-1 bg-[var(--color-accent)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                  ♪
                </div>
              </div>
            </div>
            
            <p className="text-[var(--color-text-secondary)] text-sm">
              Enter password to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="password" 
                className="block text-[var(--color-text-primary)] text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full px-4 py-3 bg-[var(--color-bg-secondary)] border-2 ${
                  error ? 'border-red-400' : 'border-[var(--color-surface)]'
                } rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors ${
                  shake ? 'animate-shake' : ''
                }`}
                placeholder="Enter password"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">
                  ❌ Incorrect password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              ENTER
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-[var(--color-text-secondary)] text-xs pt-4 border-t border-[var(--color-surface)]">
            🔒 Your media stays private and secure
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default Login;
