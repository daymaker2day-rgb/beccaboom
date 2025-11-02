<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-0pVVxgLVmtcZPgYn07G_HJ_bQvGEbjW

## Database Setup (Firebase)

This app uses **Firebase Firestore** for persistent cloud storage of comments and user data. Firebase provides a generous free tier perfect for personal projects.

### Setup Instructions:

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or "Add project"
   - Name it `beccaboom` (or your preferred name)
   - Enable Google Analytics (optional)

2. **Set Up Firestore Database:**
   - In Firebase console, click "Firestore Database" from left menu
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location (us-central1 recommended)

3. **Get Firebase Configuration:**
   - Click the gear icon (⚙️) → "Project settings"
   - Scroll to "Your apps" section
   - Click "</>" icon (Add web app)
   - Copy the config object

4. **Environment Variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase config values:
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=beccaboom.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=beccaboom
     VITE_FIREBASE_STORAGE_BUCKET=beccaboom.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     ```

### Firebase Free Tier Limits:
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Hosting**: 10GB bandwidth/month (if using Firebase Hosting)
- **No credit card required**

### Features:
- Real-time comment synchronization
- Cross-device persistence
- Automatic scaling
- Built-in security rules

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set up MongoDB (see Database Setup above)
4. Run the app:
   `npm run dev`

## Deploy to GitHub Pages
This app is configured to deploy to GitHub Pages automatically.

**Live site:** https://daymaker2day-rgb.github.io/beccaboom/
