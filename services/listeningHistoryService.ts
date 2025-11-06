// Listening History Service
import { firebaseService } from './firebaseService';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface ListeningEvent {
  id?: string;
  songTitle: string;
  songFile: string;
  userId: string; // Could be "beccabear@13" or device identifier
  timestamp: number;
  duration: number; // How long they listened (in seconds)
  completed: boolean; // Did they listen to the whole song?
  device: string; // Device/browser info
}

class ListeningHistoryService {
  
  // Log when a song starts playing
  async logPlayStart(songTitle: string, songFile: string, userId: string = 'beccabear@13'): Promise<string | null> {
    try {
      const event: ListeningEvent = {
        songTitle,
        songFile,
        userId,
        timestamp: Date.now(),
        duration: 0,
        completed: false,
        device: navigator.userAgent
      };

      // Try Firebase first, fallback to localStorage
      const docRef = await addDoc(collection(getFirestore(), 'listening_history'), event);
      
      // Also save to localStorage as backup
      this.saveToLocalStorage(event);
      
      console.log('🎵 Logged play start:', songTitle);
      return docRef.id;
    } catch (error) {
      console.error('Error logging play start:', error);
      // Fallback to localStorage
      const localEvent: ListeningEvent = {
        songTitle,
        songFile,
        userId,
        timestamp: Date.now(),
        duration: 0,
        completed: false,
        device: navigator.userAgent
      };
      return this.saveToLocalStorage(localEvent);
    }
  }

  // Update when song ends or is paused
  async logPlayEnd(eventId: string, duration: number, completed: boolean): Promise<void> {
    try {
      // Update Firebase record
      // For now, we'll create a new record since updating is more complex
      console.log('🎵 Play session ended:', { duration, completed });
      
      // Update localStorage record
      this.updateLocalStorage(eventId, duration, completed);
    } catch (error) {
      console.error('Error logging play end:', error);
    }
  }

  // Get listening history for a user
  async getListeningHistory(userId: string = 'beccabear@13', daysBack: number = 30): Promise<ListeningEvent[]> {
    try {
      const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(getFirestore(), 'listening_history'),
        where('userId', '==', userId),
        where('timestamp', '>=', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ListeningEvent[];
      
      console.log(`📊 Found ${history.length} listening events`);
      return history;
    } catch (error) {
      console.error('Error getting listening history:', error);
      return this.getFromLocalStorage(daysBack);
    }
  }

  // Check if a song has been played
  async hasSongBeenPlayed(songTitle: string, userId: string = 'beccabear@13'): Promise<boolean> {
    try {
      const q = query(
        collection(getFirestore(), 'listening_history'),
        where('userId', '==', userId),
        where('songTitle', '==', songTitle),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if song played:', error);
      return this.hasBeenPlayedLocally(songTitle);
    }
  }

  // Get listening stats
  async getListeningStats(userId: string = 'beccabear@13'): Promise<{
    totalSongs: number;
    uniqueSongs: number;
    totalListeningTime: number;
    favoriteGenre?: string;
    mostPlayedSong?: string;
    lastPlayed?: ListeningEvent;
  }> {
    const history = await this.getListeningHistory(userId);
    
    const uniqueSongs = new Set(history.map(h => h.songTitle)).size;
    const totalListeningTime = history.reduce((sum, h) => sum + h.duration, 0);
    
    // Find most played song
    const songCounts = history.reduce((acc, h) => {
      acc[h.songTitle] = (acc[h.songTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostPlayedSong = Object.entries(songCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return {
      totalSongs: history.length,
      uniqueSongs,
      totalListeningTime: Math.round(totalListeningTime),
      mostPlayedSong,
      lastPlayed: history[0]
    };
  }

  // localStorage fallback methods
  private saveToLocalStorage(event: ListeningEvent): string {
    try {
      const id = Date.now().toString();
      const eventWithId = { ...event, id };
      
      const saved = localStorage.getItem('beccabear@13_listening_history');
      const history = saved ? JSON.parse(saved) : [];
      history.push(eventWithId);
      
      // Keep only last 1000 events to prevent storage overflow
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
      
      localStorage.setItem('beccabear@13_listening_history', JSON.stringify(history));
      return id;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return '';
    }
  }

  private updateLocalStorage(eventId: string, duration: number, completed: boolean): void {
    try {
      const saved = localStorage.getItem('beccabear@13_listening_history');
      if (saved) {
        const history = JSON.parse(saved);
        const eventIndex = history.findIndex((h: ListeningEvent) => h.id === eventId);
        if (eventIndex >= 0) {
          history[eventIndex].duration = duration;
          history[eventIndex].completed = completed;
          localStorage.setItem('beccabear@13_listening_history', JSON.stringify(history));
        }
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  }

  private getFromLocalStorage(daysBack: number): ListeningEvent[] {
    try {
      const saved = localStorage.getItem('beccabear@13_listening_history');
      if (saved) {
        const history = JSON.parse(saved);
        const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
        return history.filter((h: ListeningEvent) => h.timestamp >= cutoffTime);
      }
    } catch (error) {
      console.error('Error getting from localStorage:', error);
    }
    return [];
  }

  private hasBeenPlayedLocally(songTitle: string): boolean {
    try {
      const saved = localStorage.getItem('beccabear@13_listening_history');
      if (saved) {
        const history = JSON.parse(saved);
        return history.some((h: ListeningEvent) => h.songTitle === songTitle);
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
    return false;
  }
}

export const listeningHistoryService = new ListeningHistoryService();