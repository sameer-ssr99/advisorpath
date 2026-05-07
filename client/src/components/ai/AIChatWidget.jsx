import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, MinusCircle } from 'lucide-react';
import api from '../../api/axios';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm your Virtual Junior Advisor. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare className="relative z-10 w-8 h-8 group-hover:animate-bounce" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 w-[400px] ${isMinimized ? 'h-16' : 'h-[600px]'} bg-white dark:bg-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col transition-all duration-500 z-50 border border-gray-100 dark:border-gray-700 overflow-hidden`}>
      {/* Header */}
      <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shrink-0 cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AdvisorPath AI</h3>
            <p className="text-[10px] text-indigo-100 flex items-center gap-1">
              <Sparkles size={8} /> Virtual Junior Advisor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <MinusCircle size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    <Bot size={16} />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your Virtual Advisor..."
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 pr-14 transition-all"
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">Powered by Gemini AI • Context Aware Assistant</p>
          </form>
        </>
      )}
    </div>
  );
}
