import React, { useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AIInsightModal = ({ isOpen, onClose, chartTitle, data }) => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `I'm analyzing the ${chartTitle}. What specific insights would you like to explore?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = `chart-${Date.now()}`;

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const contextMessage = `Regarding ${chartTitle}: ${input}`;
      const response = await axios.post(
        `${API}/ai/chat`,
        {
          message: contextMessage,
          session_id: sessionId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const aiMessage = { role: 'ai', content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error('AI Assistant is unavailable');
      const errorMessage = {
        role: 'ai',
        content: 'Sorry, I am currently unavailable. Please try again later.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div
        className="w-full max-w-2xl h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col"
        data-testid="ai-insight-modal"
      >
        {/* Header */}
        <div
          className="p-6 border-b flex items-center justify-between rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg" style={{ fontFamily: 'Space Grotesk' }}>
                AI Deep Dive
              </h3>
              <p className="text-sm text-blue-100">{chartTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl border border-gray-200">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about this chart data..."
              disabled={loading}
              className="flex-1"
              data-testid="ai-modal-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              data-testid="ai-modal-send-button"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightModal;