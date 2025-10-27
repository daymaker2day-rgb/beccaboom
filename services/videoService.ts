import { useEffect, useState } from 'react';

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Fetch the list of videos from the /videos directory
        const response = await fetch('/videos/index.json');
        if (!response.ok) {
          throw new Error('Failed to load videos');
        }
        const data = await response.json();
        setVideos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  return { videos, loading, error };
};