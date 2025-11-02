// Firebase configuration and service
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 Firebase Config:', firebaseConfig);

// Initialize Firebase with error handling
let app: any = null;
let db: any = null;
let firebaseInitialized = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase config incomplete, running in offline mode');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.warn('⚠️ Running in offline mode - comments will use localStorage');
}

export interface Comment {
  id: string;  // Made required since the Boombox component requires it
  songTitle: string;
  user: string;
  text: string;
  timestamp: number;  // Changed to number for consistent handling in UI
}

class FirebaseService {
  // Get all comments for a specific song
  async getCommentsForSong(songTitle: string): Promise<Comment[]> {
    if (!firebaseInitialized || !db) {
      console.log('📱 Firebase not available, using localStorage fallback');
      return this.getCommentsFromLocalStorage(songTitle);
    }

    try {
      console.log('📥 Loading comments for:', songTitle);
      const q = query(
        collection(db, 'comments'),
        where('songTitle', '==', songTitle),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().getTime()  // Convert to timestamp number
      })) as Comment[];
      console.log('✅ Loaded comments:', comments.length);
      return comments;
    } catch (error) {
      console.error('❌ Error getting comments from Firebase:', error);
      console.log('📱 Falling back to localStorage');
      return this.getCommentsFromLocalStorage(songTitle);
    }
  }

  // Fallback method for localStorage
  private getCommentsFromLocalStorage(songTitle: string): Comment[] {
    try {
      const saved = localStorage.getItem('beccabear@13_song_comments');
      if (saved) {
        const allComments = JSON.parse(saved);
        return (allComments[songTitle] || []).map((c: any) => ({
          ...c,
          id: c.id || Date.now().toString(), // Ensure each comment has an ID
          timestamp: new Date(c.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading comments from localStorage:', error);
    }
    return [];
  }

  // Add a new comment
  async addComment(songTitle: string, user: string, text: string): Promise<string | null> {
    if (!firebaseInitialized || !db) {
      console.log('📱 Firebase not available, using localStorage fallback');
      return this.addCommentToLocalStorage(songTitle, user, text);
    }

    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        songTitle,
        user,
        text,
        timestamp: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding comment to Firebase:', error);
      console.log('📱 Falling back to localStorage');
      return this.addCommentToLocalStorage(songTitle, user, text);
    }
  }

  // Delete a comment
  async deleteComment(commentId: string): Promise<boolean> {
    if (!firebaseInitialized || !db) {
      console.log('📱 Firebase not available, using localStorage fallback');
      return this.deleteCommentFromLocalStorage(commentId);
    }

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      return true;
    } catch (error) {
      console.error('❌ Error deleting comment from Firebase:', error);
      console.log('📱 Falling back to localStorage');
      return this.deleteCommentFromLocalStorage(commentId);
    }
  }

  // LocalStorage fallback methods
  private addCommentToLocalStorage(songTitle: string, user: string, text: string): string | null {
    try {
      const id = Date.now().toString();
      const comment = {
        id,
        songTitle,
        user,
        text,
        timestamp: Date.now()
      };

      const saved = localStorage.getItem('beccabear@13_song_comments');
      const allComments = saved ? JSON.parse(saved) : {};
      if (!allComments[songTitle]) allComments[songTitle] = [];
      allComments[songTitle].push(comment);
      localStorage.setItem('beccabear@13_song_comments', JSON.stringify(allComments));
      return id;
    } catch (error) {
      console.error('Error saving comment to localStorage:', error);
      return null;
    }
  }

  private deleteCommentFromLocalStorage(commentId: string): boolean {
    try {
      const saved = localStorage.getItem('beccabear@13_song_comments');
      if (saved) {
        const allComments = JSON.parse(saved);
        for (const songTitle in allComments) {
          allComments[songTitle] = allComments[songTitle].filter((c: any) => c.id !== commentId);
        }
        localStorage.setItem('beccabear@13_song_comments', JSON.stringify(allComments));
      }
      return true;
    } catch (error) {
      console.error('Error deleting comment from localStorage:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
export { db };