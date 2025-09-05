import { useState } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { GoogleGenerativeAI } from '@google/generative-ai';
const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { type: 'bot', message: 'Hello! I\'m your assistant for AnA Group Supplies. How can I help you find the perfect look today?' }
  ]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage(''); // Clear input immediately
    setLoading(true);

    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
    
    // Call the Google Generative AI API directly
    try {
      // Initialize the Generative AI model
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Use the fashion assistant persona in the API call
      const fullPrompt = `You are a helpful fashion assistant for AnA Group Supplies. Provide fashion advice and recommendations based on the user's query. Keep your responses concise and relevant to fashion.

User query: ${userMessage}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      setChatHistory(prev => [...prev, { type: 'bot', message: text }]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setChatHistory(prev => [...prev, { type: 'bot', message: 'Sorry, I couldn\'t get a response right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-secondary transition-all duration-300 z-50 flex items-center justify-center group"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        <span className="absolute right-16 bg-white text-primary px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
         AnA Group Supplies Assistant
        </span>
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              <h3 className="font-semibold">AnA Group Supplies Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-1 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    chat.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {chat.message}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white p-2 rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant; 