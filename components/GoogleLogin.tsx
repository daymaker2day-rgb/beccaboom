import React, { useEffect, useState } from 'react';
import { googleAuthService } from '../services/googleAuthService';

interface User {
  name: string;
  email: string;
  picture: string;
}

const GoogleLogin: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize Google OAuth
    googleAuthService.initialize(import.meta.env.VITE_GOOGLE_CLIENT_ID);
    
    // Check if user is already logged in
    if (googleAuthService.isAuthenticated()) {
      loadUserInfo();
    }
  }, []);

  const loadUserInfo = async () => {
    const userInfo = await googleAuthService.getUserInfo();
    if (userInfo) {
      setUser({
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      });
    }
  };

  const handleLogin = () => {
    googleAuthService.login();
  };

  const handleLogout = () => {
    googleAuthService.logout();
    setUser(null);
  };

  return (
    <div className="flex items-center justify-center p-4">
      {!user ? (
        <button
          onClick={handleLogin}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow flex items-center space-x-2 hover:bg-gray-100"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            className="w-6 h-6"
          />
          <span>Sign in with Google</span>
        </button>
      ) : (
        <div className="flex items-center space-x-4">
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleLogin;