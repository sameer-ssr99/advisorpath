import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, User as UserIcon, Send, MoreVertical, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMessagesData, sendMessage, markAsRead } from '../../data/messageData';
import api from '../../api/axios';

export default function MessagesPage() {
  const { user } = useAuth();
  const isAdvisor = user?.role === 'advisor';
  
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [search, setSearch] = useState('');
  
  const messagesEndRef = useRef(null);

  const loadData = async () => {
    try {
      const rawMessages = await getMessagesData();
      
      // Group messages into conversations
      const convMap = {};
      const myId = (user?._id || user?.id)?.toString();

      rawMessages.forEach(msg => {
        const senderId = (msg.sender._id || msg.sender)?.toString();
        const receiverId = (msg.receiver._id || msg.receiver)?.toString();
        
        // Determine who the "other" person is
        const otherUser = senderId === myId ? msg.receiver : msg.sender;
        const otherId = (otherUser._id || otherUser.id)?.toString();

        // CRITICAL Safeguards:
        // 1. Don't chat with yourself
        if (otherId === myId) return;
        // 2. If I'm an advisor, ONLY show students
        if (isAdvisor && otherUser.role !== 'student') return;
        // 3. If I'm a student, ONLY show my advisor
        if (user?.role === 'student') {
          const advisorId = (user.advisor?.id || user.advisor?._id)?.toString();
          if (otherId !== advisorId) return;
        }

        if (!convMap[otherId]) {
          convMap[otherId] = {
            id: otherId,
            otherUser: otherUser,
            messages: [],
            unread: 0
          };
        }
        
        convMap[otherId].messages.push({
          id: msg._id,
          sender: senderId === myId ? 'self' : 'other',
          text: msg.text,
          timestamp: msg.createdAt
        });
        
        if (receiverId === myId && !msg.read) {
          convMap[otherId].unread++;
        }
      });

      // For students, if the advisor isn't in convMap yet, add them
      if (user?.role === 'student' && user.advisor) {
        const advId = user.advisor.id || user.advisor._id;
        if (!convMap[advId]) {
          convMap[advId] = {
            id: advId,
            otherUser: { ...user.advisor, _id: advId, role: 'advisor' },
            messages: [],
            unread: 0
          };
        }
      }

      // For advisors, ensure ALL assigned students are in the list
      if (isAdvisor) {
        try {
          const res = await api.get('/users/my-students');
          const students = res.data.students || [];
          students.forEach(s => {
            if (!convMap[s._id]) {
              convMap[s._id] = {
                id: s._id,
                otherUser: { ...s, role: 'student' },
                messages: [],
                unread: 0
              };
            }
          });
        } catch (err) {
          console.error("Failed to load students for messages", err);
        }
      }

      // Sort and filter by search
      let convList = Object.values(convMap).sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1]?.timestamp || 0;
        const lastB = b.messages[b.messages.length - 1]?.timestamp || 0;
        return new Date(lastB) - new Date(lastA);
      });

      if (search) {
        convList = convList.filter(c => 
          c.otherUser.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setConversations(convList);
      
      if (!activeConvId && convList.length > 0) {
        setActiveConvId(convList[0].id);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Faster polling for "real-time" feel
    return () => clearInterval(interval);
  }, [activeConvId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, activeConvId]);

  const handleSelectConv = async (id) => {
    setActiveConvId(id);
    await markAsRead(id);
    loadData();
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConvId) return;
    
    try {
      const text = messageInput;
      setMessageInput(''); // Clear immediately for UI responsiveness
      await sendMessage(activeConvId, text);
      loadData();
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => handleSelectConv(conv.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeConvId === conv.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${activeConvId === conv.id ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                {conv.otherUser.name?.charAt(0)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold truncate">{conv.otherUser.name}</span>
                  <span className={`text-[10px] ${activeConvId === conv.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {conv.messages.length > 0 ? new Date(conv.messages[conv.messages.length - 1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate ${activeConvId === conv.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : 'No messages yet'}
                  </p>
                  {conv.unread > 0 && activeConvId !== conv.id && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6">
          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all">
            <Plus size={18} />
            New Message
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                {activeConv.otherUser.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white leading-none">{activeConv.otherUser.name}</h3>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  {activeConv.otherUser.role || 'User'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"><Phone size={20}/></button>
              <button className="p-2.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"><MoreVertical size={20}/></button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30 dark:bg-gray-900/30">
            {activeConv.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Send size={32} /></div>
                <p className="font-medium text-sm text-center max-w-xs">Start a conversation with {activeConv.otherUser.name}. Your messages are secure and private.</p>
              </div>
            ) : (
              activeConv.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'self' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex flex-col max-w-[70%] ${msg.sender === 'self' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-sm transition-all
                      ${msg.sender === 'self' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="relative flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Type your message here..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!messageInput.trim()}
                className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale hover:-translate-y-1 active:translate-y-0"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-400 space-y-6">
           <div className="p-10 bg-gray-50 dark:bg-gray-800 rounded-full"><Plus size={48} className="text-gray-200"/></div>
           <div className="text-center space-y-2">
             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select a conversation</h3>
             <p className="text-sm max-w-xs">Choose a student from the left to start advising or review their recent queries.</p>
           </div>
        </div>
      )}
    </div>
  );
}
