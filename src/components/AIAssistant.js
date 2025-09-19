import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import aiService from '../services/aiService';
import { useAuth } from '../context/AuthContext';
const AIAssistant = () => {
  const { trackAIInteraction } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { type: 'bot', message: 'Hello! I\'m your intelligent assistant for AnA Group Supplies. I have access to our complete product inventory and can help you find exactly what you\'re looking for. How can I assist you today?' }
  ]);

  // Initialize AI service when component opens
  useEffect(() => {
    if (isOpen) {
      aiService.updateProductCache();
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessage(''); // Clear input immediately
    setLoading(true);

    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
    
    const startTime = Date.now();
    
    try {
      // Use enhanced AI service with product context
      const response = await aiService.generateResponse(userMessage, chatHistory);
      const responseTime = Date.now() - startTime;
      
      setChatHistory(prev => [...prev, { type: 'bot', message: response }]);
      
      // Track AI interaction
      await trackAIInteraction(userMessage, response, responseTime);
      
    } catch (error) {
      console.error('Error calling AI service:', error);
      const errorResponse = 'I apologize, but I\'m experiencing some technical difficulties. Please try again in a moment, or feel free to browse our products directly on the website.';
      
      setChatHistory(prev => [...prev, {
        type: 'bot',
        message: errorResponse
      }]);
      
      // Track the error interaction
      const responseTime = Date.now() - startTime;
      await trackAIInteraction(userMessage, errorResponse, responseTime);
      
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshContext = async () => {
    setLoading(true);
    try {
      await aiService.refreshCache();
      setChatHistory(prev => [...prev, {
        type: 'bot',
        message: 'Great! I\'ve updated my knowledge with the latest product information. How can I help you now?'
      }]);
    } catch (error) {
      console.error('Error refreshing context:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([
      { type: 'bot', message: 'Hello! I\'m your intelligent assistant for AnA Group Supplies. I have access to our complete product inventory and can help you find exactly what you\'re looking for. How can I assist you today?' }
    ]);
  };
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-primary text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-secondary transition-all duration-300 z-50 flex items-center justify-center group"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5 md:h-6 md:w-6" />
        <span className="hidden md:block absolute right-16 bg-white text-primary px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
         AnA Group Supplies Assistant
        </span>
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-28 md:bottom-24 right-2 md:right-6 w-[calc(100vw-1rem)] md:w-96 max-w-[96vw] md:max-w-none bg-white dark:bg-surface-dark rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">AI Shopping Assistant</h3>
                <p className="text-xs text-white/80">Product-aware support</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleRefreshContext}
                disabled={loading}
                className="hover:bg-white/10 p-1 rounded-full transition-colors disabled:opacity-50"
                title="Refresh product data"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleClearChat}
                className="hover:bg-white/10 p-1 rounded-full transition-colors text-xs px-2 py-1"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                    chat.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-surface-dark text-gray-800 dark:text-text-dark border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {chat.message}
                  </div>
                  {chat.type === 'bot' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-75">
                      AI Assistant • Product-aware
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-surface-dark text-gray-800 dark:text-text-dark rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm">Analyzing products...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about products, prices, recommendations..."
                disabled={loading}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="bg-primary text-white p-2 rounded-full hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Try asking: "Show me jerseys under 50,000 TZS" or "What's new in shoes?"
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant; 