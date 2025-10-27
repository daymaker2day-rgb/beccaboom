
import React, { useEffect, useState } from 'react';
import Boombox from './components/Boombox';
import Login from './components/Login';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('App component mounted');
    // Check if already logged in (stored in sessionStorage)
    const loggedIn = sessionStorage.getItem('boombox_authenticated');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('boombox_authenticated', 'true');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <main>
        <Boombox />
      </main>
    </div>
  );
};

export default App;