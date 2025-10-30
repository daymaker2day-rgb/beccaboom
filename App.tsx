
import React, { useEffect, useState } from 'react';
import Boombox from './components/Boombox';
import Login from './components/Login';
import QRCode from './components/QRCode';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('App component mounted');
    try {
      // Check if already logged in (stored in sessionStorage)
      const loggedIn = sessionStorage.getItem('boombox_authenticated');
      console.log('Login status:', loggedIn);
      if (loggedIn === 'true') {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Error checking authentication:', err);
      setError('Error checking login status');
    }
  }, []);

  const handleLogin = () => {
    try {
      console.log('Handling login...');
      sessionStorage.setItem('boombox_authenticated', 'true');
      setIsAuthenticated(true);
      console.log('Login successful');
    } catch (err) {
      console.error('Error during login:', err);
      setError('Error logging in. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[var(--color-bg-deep)] to-[var(--color-bg-secondary)]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              sessionStorage.removeItem('boombox_authenticated');
              window.location.reload();
            }}
          >
            Reset App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[var(--color-bg-deep)] to-[var(--color-bg-secondary)]">
      <main className="w-full">
        <Boombox />
        <QRCode />
      </main>
    </div>
  );
};

export default App;