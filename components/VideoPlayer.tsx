import React, { useEffect, useState } from 'react';

interface MediaFile {
  path: string;
  type: 'video' | 'audio';
  name: string;
}

const VideoPlayer = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // List videos and music files
    const loadMedia = async () => {
      try {
        // Load videos
        const videosResponse = await fetch('/videos');
        const videoFiles = await videosResponse.text();
        const videos = videoFiles.split('\n')
          .filter(file => file.match(/\.(mp4|webm|mov)$/i))
          .map(file => ({
            path: `/videos/${file}`,
            type: 'video' as const,
            name: file.replace(/\.[^/.]+$/, '')
          }));
        console.log('Found videos:', videos);

        // Load music
        const musicResponse = await fetch('/music');
        const musicFiles = await musicResponse.text();
        const music = musicFiles.split('\n')
          .filter(file => file.match(/\.(mp3|wav|ogg)$/i))
          .map(file => ({
            path: `/music/${file}`,
            type: 'audio' as const,
            name: file.replace(/\.[^/.]+$/, '')
          }));
        console.log('Found music:', music);

        const allMedia = [...videos, ...music];
        console.log('Total media files loaded:', allMedia.length);
        setMediaFiles(allMedia);
      } catch (error) {
        console.error('Error loading media:', error);
      }
    };
    loadMedia();
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaFiles.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
  };

  const currentMedia = mediaFiles[currentIndex];

  return (
    <div className="relative w-full h-full bg-black">
      {mediaFiles.length > 0 ? (
        <>
          {currentMedia.type === 'video' ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={currentMedia.path}
              onEnded={nextMedia}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <>
              <audio
                ref={audioRef}
                src={currentMedia.path}
                onEnded={nextMedia}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="flex items-center justify-center h-full">
                <div className="text-white text-center">
                  <div className="text-4xl mb-4">🎵</div>
                  <div className="text-xl font-bold">{currentMedia.name}</div>
                </div>
              </div>
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 flex flex-col items-center gap-2">
            <div className="text-white text-center mb-2">
              {currentMedia.name}
            </div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={prevMedia}
                className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-600"
              >
                Previous
              </button>
              <button 
                onClick={handlePlayPause}
                className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-600"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button 
                onClick={nextMedia}
                className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-600"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-white text-center p-4">
          Add media files to the /videos or /music folder to get started
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
