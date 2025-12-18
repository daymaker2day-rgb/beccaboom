import React, { useState, useEffect } from 'react';

interface PuzzleGameProps {
  onClose: () => void;
}

interface PuzzlePiece {
  id: number;
  correctPosition: number;
  currentPosition: number;
  imagePosition: { x: number; y: number };
}

const PuzzleGame: React.FC<PuzzleGameProps> = ({ onClose }) => {
  const [selectedPuzzle, setSelectedPuzzle] = useState<'25' | '50' | null>(null);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const baseUrl = import.meta.env.BASE_URL;
  const puzzleImage = `${baseUrl}puzzles/llbpuzzle2.png`;

  // Initialize puzzle pieces
  useEffect(() => {
    if (selectedPuzzle) {
      const pieceCount = selectedPuzzle === '25' ? 25 : 50;
      const gridSize = selectedPuzzle === '25' ? 5 : 10;
      
      const newPieces: PuzzlePiece[] = [];
      for (let i = 0; i < pieceCount; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        newPieces.push({
          id: i,
          correctPosition: i,
          currentPosition: i,
          imagePosition: { 
            x: (col / gridSize) * 100, 
            y: (row / gridSize) * 100 
          }
        });
      }
      
      // Shuffle pieces
      const shuffled = [...newPieces];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffled[i].currentPosition;
        shuffled[i].currentPosition = shuffled[j].currentPosition;
        shuffled[j].currentPosition = temp;
      }
      
      shuffled.sort((a, b) => a.currentPosition - b.currentPosition);
      setPieces(shuffled);
      setIsComplete(false);
    }
  }, [selectedPuzzle]);

  // Check if puzzle is complete
  useEffect(() => {
    if (pieces.length > 0) {
      const complete = pieces.every(p => p.correctPosition === p.currentPosition);
      if (complete && !isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          alert('🎉 Congratulations! You completed the puzzle!');
        }, 500);
      }
    }
  }, [pieces, isComplete]);

  const handleDragStart = (pieceId: number) => {
    setDraggedPiece(pieceId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPosition: number) => {
    if (draggedPiece === null) return;
    
    setPieces(prev => {
      const newPieces = [...prev];
      const draggedIndex = newPieces.findIndex(p => p.id === draggedPiece);
      const targetIndex = newPieces.findIndex(p => p.currentPosition === targetPosition);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const temp = newPieces[draggedIndex].currentPosition;
        newPieces[draggedIndex].currentPosition = newPieces[targetIndex].currentPosition;
        newPieces[targetIndex].currentPosition = temp;
        newPieces.sort((a, b) => a.currentPosition - b.currentPosition);
      }
      
      return newPieces;
    });
    setDraggedPiece(null);
  };

  const gridSize = selectedPuzzle === '25' ? 5 : 10;
  const pieceSize = selectedPuzzle === '25' ? 20 : 10;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-white/20">
        {/* Header - Apple Style */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">P</span>
              </div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Puzzle Games
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
              title="Close"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-6 py-6">
          {!selectedPuzzle ? (
            /* Puzzle Selection */
            <div className="space-y-6">
              <div className="text-center mb-8">
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Choose your challenge
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Your music keeps playing while you solve! 🎵
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 25 Piece Puzzle */}
                <button
                  onClick={() => setSelectedPuzzle('25')}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-8 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl border border-purple-200/50 dark:border-purple-700/50"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">Easy Mode</h3>
                    <p className="text-lg text-purple-700 dark:text-purple-300 mb-1">25 Pieces</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for a quick challenge</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                {/* 50 Piece Puzzle */}
                <button
                  onClick={() => setSelectedPuzzle('50')}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 p-8 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl border border-pink-200/50 dark:border-pink-700/50"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-pink-900 dark:text-pink-100 mb-2">Challenge Mode</h3>
                    <p className="text-lg text-pink-700 dark:text-pink-300 mb-1">50 Pieces</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">For puzzle masters</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>

              {/* Info Section */}
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">How to Play</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Drag and drop pieces to solve the puzzle</li>
                      <li>• Your music continues playing in the background</li>
                      <li>• Take your time - there's no rush!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Puzzle Game Area */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedPuzzle(null);
                    setIsComplete(false);
                  }}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                
                <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm">
                  {selectedPuzzle} Piece Puzzle
                </span>
              </div>

              {isComplete && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl text-center font-bold animate-pulse">
                  🎉 Puzzle Complete! Amazing work!
                </div>
              )}

              {/* Reference Image */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-3 border border-blue-200/50 dark:border-blue-700/50">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
                  Reference Image
                </p>
                <div className="flex justify-center">
                  <img 
                    src={puzzleImage} 
                    alt="Reference" 
                    className="rounded-lg shadow-lg max-w-[200px] w-full border-2 border-white/50 dark:border-gray-700/50"
                  />
                </div>
              </div>

              {/* Puzzle Grid */}
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4">
                <div 
                  className="grid gap-1 mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    maxWidth: '600px',
                    aspectRatio: '1'
                  }}
                >
                  {pieces.map((piece) => (
                    <div
                      key={piece.id}
                      draggable
                      onDragStart={() => handleDragStart(piece.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(piece.currentPosition)}
                      className={`relative overflow-hidden cursor-move transition-all hover:scale-105 hover:z-10 ${
                        piece.correctPosition === piece.currentPosition 
                          ? 'ring-2 ring-green-400' 
                          : 'ring-1 ring-gray-300'
                      }`}
                      style={{
                        aspectRatio: '1',
                        backgroundImage: `url(${puzzleImage})`,
                        backgroundSize: `${gridSize * 100}%`,
                        backgroundPosition: `${piece.imagePosition.x}% ${piece.imagePosition.y}%`,
                      }}
                    >
                      {piece.correctPosition === piece.currentPosition && (
                        <div className="absolute inset-0 bg-green-400/20"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {pieces.filter(p => p.correctPosition === p.currentPosition).length} / {pieces.length} pieces correct
                  </p>
                </div>

                {/* Apple Intelligence Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-600 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80">
                      Mixed Pieces
                    </span>
                  </div>
                </div>

                {/* Small Reservoir */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3">
                  <div 
                    className="grid gap-2 mx-auto"
                    style={{ 
                      gridTemplateColumns: `repeat(${Math.min(gridSize, 8)}, 1fr)`,
                      maxWidth: '400px'
                    }}
                  >
                    {pieces
                      .filter(p => p.correctPosition !== p.currentPosition)
                      .slice(0, 16)
                      .map((piece) => (
                        <div
                          key={`res-${piece.id}`}
                          draggable
                          onDragStart={() => handleDragStart(piece.id)}
                          className="relative overflow-hidden cursor-grab active:cursor-grabbing rounded hover:scale-110 transition-transform border border-white/50 dark:border-gray-700/50"
                          style={{
                            aspectRatio: '1',
                            backgroundImage: `url(${puzzleImage})`,
                            backgroundSize: `${gridSize * 100}%`,
                            backgroundPosition: `${piece.imagePosition.x}% ${piece.imagePosition.y}%`,
                          }}
                        />
                      ))}
                  </div>
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Drag to swap • {pieces.filter(p => p.correctPosition !== p.currentPosition).length} remaining
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuzzleGame;
