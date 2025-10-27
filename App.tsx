
import React from 'react';
import Boombox from './components/Boombox';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <main>
        <Boombox />
      </main>
    </div>
  );
};

export default App;