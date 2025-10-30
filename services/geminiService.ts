// Gemini AI Service
// Get API key from environment - VITE_ prefix is automatically exposed by Vite
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Log for debugging
if (!GEMINI_API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY not found in environment variables');
} else {
  console.log('✅ Gemini API Key loaded:', GEMINI_API_KEY.substring(0, 20) + '...');
}

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiResponse {
  text: string;
  timestamp: number;
}

class GeminiService {
  private conversationHistory: GeminiMessage[] = [];
  private apiKey: string;

  constructor() {
    this.apiKey = GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Gemini API Key not configured in environment variables');
    }
  }

  /**
   * Send a message to Gemini and get a response
   */
  async sendMessage(userMessage: string): Promise<GeminiResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API Key not configured');
    }

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Prepare the request
      const response = await fetch(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: this.conversationHistory.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            }))
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('🚨 Gemini API Error:', error);
        throw new Error(error.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!assistantMessage) {
        throw new Error('No response from Gemini API');
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'model',
        content: assistantMessage
      });

      return {
        text: assistantMessage,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Gemini Service Error:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('🗑️ Conversation history cleared');
  }

  /**
   * Get conversation history
   */
  getHistory(): GeminiMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Set system prompt/context
   */
  setSystemContext(context: string): void {
    this.conversationHistory = [
      {
        role: 'user',
        content: `System Context: ${context}`
      },
      {
        role: 'model',
        content: 'Understood. I will follow this context for our conversation.'
      }
    ];
    console.log('📝 System context set');
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export default new GeminiService();
