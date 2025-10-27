interface GoogleAuthConfig {
  clientName: string;
  redirectUri: string;
  origin: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;
  private googleAuth: any = null;
  private accessToken: string | null = null;

  constructor() {
    this.config = {
      clientName: import.meta.env.VITE_GOOGLE_CLIENT_NAME,
      redirectUri: import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI,
      origin: import.meta.env.VITE_GOOGLE_OAUTH_ORIGIN
    };
  }

  private async loadGoogleAuthScript(): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  async initialize(clientId: string) {
    if (typeof window !== 'undefined') {
      await this.loadGoogleAuthScript();
      this.googleAuth = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (response: any) => {
          if (response.access_token) {
            this.handleTokenResponse(response);
          }
        },
      });
    }
  }

  private handleTokenResponse(response: { access_token: string }) {
    this.accessToken = response.access_token;
    localStorage.setItem('google_access_token', response.access_token);
    // Trigger any necessary UI updates or callbacks
  }

  async handleRedirect() {
    // Handle OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Handle authorization code
      return this.handleAuthCode(code);
    }
  }

  private async handleAuthCode(code: string) {
    try {
      // Exchange code for tokens
      // Implement token exchange logic here
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    // Check if user is authenticated
    // Implement your authentication check logic here
    return false;
  }

  getAuthUrl(): string {
    // Construct OAuth URL
    // Replace with your actual OAuth provider URL and parameters
    return `${this.config.origin}/oauth/authorize?redirect_uri=${encodeURIComponent(this.config.redirectUri)}`;
  }
}

  public login() {
    if (this.googleAuth) {
      this.googleAuth.requestAccessToken();
    }
  }

  public logout() {
    this.accessToken = null;
    localStorage.removeItem('google_access_token');
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken || !!localStorage.getItem('google_access_token');
  }

  public async getUserInfo() {
    const token = this.accessToken || localStorage.getItem('google_access_token');
    if (!token) return null;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }
}

export const googleAuthService = new GoogleAuthService();