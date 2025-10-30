import React, { useState, useRef, useEffect } from 'react';
import geminiService, { GeminiMessage } from '../services/geminiService';

interface AIAssistantProps {
  onClose?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Hi there! I\'m your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      console.log('📤 Sending message to Gemini:', userMessage);
      
      // Check if service is configured
      if (!geminiService.isConfigured()) {
        throw new Error('Gemini API Key is not configured. Check your .env.local file.');
      }
      
      // Send to Gemini
      const response = await geminiService.sendMessage(userMessage);
      console.log('✅ Received response:', response.text.substring(0, 100) + '...');
      
      // Add assistant response to UI
      setMessages(prev => [...prev, { role: 'assistant', text: response.text }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      console.error('❌ Error sending message:', err);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `⚠️ Error: ${errorMessage}\n\nPlease make sure:\n1. Your API key is set in .env.local\n2. You have internet connection\n3. Your API quota is not exceeded` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', text: 'Hi there! I\'m your AI assistant. How can I help you today?' }]);
    geminiService.clearHistory();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
      {/* Header - ChatGPT Style */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">✨</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Assistant
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Messages Container - ChatGPT Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-3xl'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-3xl'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-3 rounded-3xl">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Message AI..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              rows={1}
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-full p-2.5 transition-all flex items-center justify-center"
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 0V5m0 14v0" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 py-1 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              title="Clear conversation"
            >
              Clear Chat
            </button>
          </div>
        </form>

        {!geminiService.isConfigured() && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-xs">
            ⚠️ API Key not configured
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
