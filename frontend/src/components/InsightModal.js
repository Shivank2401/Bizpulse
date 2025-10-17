import React, { useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Sparkles, TrendingUp, AlertCircle, Lightbulb, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const InsightModal = ({ isOpen, onClose, chartTitle, insights, recommendations, onExploreDeep }) => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `I'm analyzing ${chartTitle}. What would you like to know about this data?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = `insight-${Date.now()}`;

  if (!isOpen) return null;

  // AI-generated recommendations based on chart type
  const aiRecommendations = recommendations || [
    {
      type: 'positive',
      icon: CheckCircle,
      title: 'Strong Sales Growth',
      description: 'Sales have increased by 25% over the last quarter, showing positive momentum.',
      action: 'Continue current strategy',
      color: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '#10b981' }
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Profit Margin Declining',
      description: 'While sales are up, profit margins have decreased by 8%, indicating rising costs.',
      action: 'Review operational expenses',
      color: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' }
    },
    {
      type: 'urgent',
      icon: AlertCircle,
      title: 'Immediate Action Required',
      description: 'Customer acquisition cost has spiked 40% this month. Immediate review needed.',
      action: 'Schedule urgent review',
      color: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' }
    }
  ];

  // Suggested prompts based on chart context
  const suggestedPrompts = [
    'Show trends',
    'Identify issues',
    'Recommendations',
    'Forecast'
  ];

  const followUpPrompts = [
    'Show sales overview',
    'Analyze profitability',
    'Customer insights',
    'Brand performance'
  ];

  const handleSendMessage = async (messageText = null) => {
    const msgToSend = messageText || input.trim();
    if (!msgToSend) return;

    const userMessage = { role: 'user', content: msgToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const contextMessage = `Regarding ${chartTitle}: ${msgToSend}`;
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

  const handlePromptClick = (prompt) => {
    handleSendMessage(prompt);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ background: 'rgba(0, 0, 0, 0.5)' }} 
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        data-testid="insight-modal"
      >
        {/* Header */}
        <div
          className="p-5 border-b flex items-center justify-between rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}
        >
          <div>
            <h3 className="text-white font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>
              {chartTitle} - Insights & Analysis
            </h3>
            <p className="text-sm text-blue-100">AI-powered recommendations and chat analysis</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Recommendations */}
          <div className="w-2/5 border-r bg-gray-50 flex flex-col">
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                Recommendations
              </h3>
            </div>

            <ScrollArea className="flex-1 px-5 pb-5">
              <div className="space-y-4">
                {aiRecommendations.map((rec, idx) => {
                  const Icon = rec.icon;
                  return (
                    <div
                      key={idx}
                      className="rounded-lg p-4 border-l-4"
                      style={{
                        background: rec.color.bg,
                        borderColor: rec.color.border
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: rec.color.icon }} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1" style={{ color: rec.color.text }}>
                            {rec.title}
                          </h4>
                          <p className="text-xs mb-3" style={{ color: rec.color.text, opacity: 0.8 }}>
                            {rec.description}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 border"
                            style={{ 
                              borderColor: rec.color.border,
                              color: rec.color.text
                            }}
                          >
                            {rec.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Column - Chat Analysis */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                Chat Analysis
              </h3>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-5">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 ${msg.role === 'user' ? 'flex justify-end' : ''}`}
                >
                  {msg.role === 'ai' && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-800 mb-3">{msg.content}</p>
                      
                      {/* Suggested Prompts */}
                      {idx === 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {suggestedPrompts.map((prompt, pidx) => (
                            <button
                              key={pidx}
                              onClick={() => handlePromptClick(prompt)}
                              className="text-left px-3 py-2 rounded text-sm transition hover:bg-amber-100"
                              style={{ background: '#fef3c7', color: '#92400e' }}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Follow-up prompts after first response */}
                      {idx > 1 && idx === messages.length - 1 && msg.role === 'ai' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2">
                            I can help you analyze your business data. Try asking about sales trends, profit margins, customer performance, or brand analysis. What would you like to know?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {followUpPrompts.map((prompt, pidx) => (
                              <button
                                key={pidx}
                                onClick={() => handlePromptClick(prompt)}
                                className="text-left px-3 py-2 rounded text-xs transition hover:bg-amber-100"
                                style={{ background: '#fef3c7', color: '#92400e' }}
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {msg.role === 'user' && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg px-4 py-3 max-w-[80%]">
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="mb-4">
                  <div className="bg-gray-100 px-4 py-3 rounded-lg border border-gray-200 inline-block">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-5 border-t bg-white">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                  placeholder="Ask about this chart..."
                  disabled={loading}
                  className="flex-1"
                  data-testid="insight-chat-input"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  data-testid="insight-send-button"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;