
import React, { useEffect, useState } from 'react';
import Boombox from './components/Boombox';
import Login from './components/Login';

function App() {
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
      <div className="h-screen w-full flex items-center justify-center">
        <div className="p-4 w-full max-w-md">
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg" role="alert">
            <strong className="font-bold block mb-2">Error: </strong>
            <span className="block mb-4">{error}</span>
            <button 
              className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
              onClick={() => {
                sessionStorage.removeItem('boombox_authenticated');
                window.location.reload();
              }}
            >
              Reset App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[var(--color-bg-deep)] to-[var(--color-bg-secondary)]">
      <main className="w-full max-w-screen-lg mx-auto">
        <Boombox />
      </main>
    </div>
  );
}

export default App;