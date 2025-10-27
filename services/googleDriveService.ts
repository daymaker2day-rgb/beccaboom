export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webContentLink?: string;
}

export class GoogleDriveService {
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('google_access_token');
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    return response;
  }

  async listVideoFiles(): Promise<GoogleDriveFile[]> {
    const query = "mimeType contains 'video/'";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webContentLink)`;
    
    const response = await this.fetchWithAuth(url);
    const data = await response.json();
    return data.files;
  }

  async getFileContent(fileId: string): Promise<Response> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    return this.fetchWithAuth(url);
  }

  async getSharedVideoUrl(fileId: string): Promise<string> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`;
    const response = await this.fetchWithAuth(url);
    const data = await response.json();
    return data.webContentLink;
  }
}