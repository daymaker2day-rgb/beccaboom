import { useEffect, useState } from 'react';

export interface Video {
  title: string;
  file: string;
  path: string;
}

interface VideoResponse {
  videos: Video[];
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetch('/beccaboom/videos/index.json');
        if (!response.ok) {
          throw new Error('Failed to load videos');
        }
        const data: VideoResponse = await response.json();
        console.log('Loaded videos:', data.videos);
        setVideos(data.videos);
      } catch (err) {
        console.error('Error loading videos:', err);
        setError(err instanceof Error ? err.message : 'Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  return { videos, loading, error };
};