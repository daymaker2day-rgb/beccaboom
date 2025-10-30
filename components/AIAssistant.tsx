import React, { useState, useRef, useEffect } from 'react';
import geminiService, { GeminiMessage } from '../services/geminiService';

interface AIAssistantProps {
  onClose?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: '🎤 Hey! I\'m your AI Boombox Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Send to Gemini
      const response = await geminiService.sendMessage(userMessage);
      
      // Add assistant response to UI
      setMessages(prev => [...prev, { role: 'assistant', text: response.text }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      console.error('❌ Error:', err);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `Sorry, I encountered an error: ${errorMessage}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', text: '🎤 Hey! I\'m your AI Boombox Assistant. How can I help you today?' }]);
    geminiService.clearHistory();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-accent)] to-purple-600 p-4 rounded-t-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            🤖 AI Boombox Assistant
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded transition-all"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-3 rounded-lg border-2 ${
                msg.role === 'user'
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-accent)]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] px-4 py-3 rounded-lg border-2 border-[var(--color-accent)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg border-2 border-red-500 text-sm">
              ⚠️ {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-2 border-[var(--color-accent)] p-4 bg-[var(--color-bg-secondary)]">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
            placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
            className="w-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-2 border-[var(--color-accent)] rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm"
            rows={3}
            disabled={loading}
          />
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-1 bg-[var(--color-accent)] text-white font-bold py-2 px-4 rounded border-2 border-[var(--color-accent)] hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '⏳ Thinking...' : '📤 Send'}
            </button>
            
            <button
              type="button"
              onClick={handleClear}
              className="bg-yellow-600 text-white font-bold py-2 px-4 rounded border-2 border-yellow-500 hover:bg-yellow-700 transition-all"
              title="Clear conversation"
            >
              🗑️
            </button>
          </div>
        </form>

        {!geminiService.isConfigured() && (
          <div className="mt-3 p-3 bg-red-900/30 border-2 border-red-500 rounded text-red-300 text-xs">
            ⚠️ Gemini API Key not configured. Set VITE_GEMINI_API_KEY in .env.local
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
