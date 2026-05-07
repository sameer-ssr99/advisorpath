import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Sync Notifications from localStorage
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const loadNotifs = () => {
      const stored = localStorage.getItem('advisorpath_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        const initial = [
          { id: 1, text: 'Your Fall 2024 plan was approved by Dr. Sharma', unread: true, time: '2h ago' },
          { id: 2, text: 'Advising session reminder: tomorrow at 14:00', unread: true, time: '5h ago' }
        ];
        localStorage.setItem('advisorpath_notifications', JSON.stringify(initial));
        setNotifications(initial);
      }
    };
    loadNotifs();
    // Poll for updates across tabs
    const interval = setInterval(loadNotifs, 2000);
    return () => clearInterval(interval);
  }, []);

  // Mock Search Data
  const searchData = [
    { type: 'Course', text: 'CS101 - Intro to Programming' },
    { type: 'Course', text: 'CS301 - Data Structures' },
    { type: 'Plan', text: 'Fall 2024 Draft' },
    { type: 'Student', text: 'Arjun Patel' },
    { type: 'Student', text: 'Alex Student' }
  ];

  // Dark mode toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('advisorpath_notifications', JSON.stringify(updated));
  };

  const removeNotif = (id, e) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('advisorpath_notifications', JSON.stringify(updated));
  };

  const filteredSearch = searchData.filter(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-8 transition-colors sticky top-0 z-40">
      
      {/* Search Bar */}
      <div className="flex-1 flex items-center" ref={searchRef}>
        <div className="relative w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Search plans, courses, students..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors dark:text-white"
          />
          {showSearch && searchQuery && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              {filteredSearch.length > 0 ? (
                <ul className="py-2">
                  {filteredSearch.map((item, i) => (
                    <li key={i} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.text}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">{item.type}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center space-x-6">
        
        {/* Dark Mode */}
        <button onClick={() => setIsDark(!isDark)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors relative"
          >
            <Bell size={20} />
            {notifications.some(n => n.unread) && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-gray-800"></span>
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transform origin-top-right transition-all">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium">Mark all read</button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500">No notifications</li>}
                {notifications.map(n => (
                  <li key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 relative group transition-colors ${n.unread ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <p className={`text-sm ${n.unread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                          {n.text}
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">{n.time}</span>
                      </div>
                      {n.unread && <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <button onClick={(e) => removeNotif(n.id, e)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Profile */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</div>
          </div>
          <button 
            onClick={logout}
            className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
