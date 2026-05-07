import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, CheckCircle, Info, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSessionsData, addSession, updateSessionStatus } from '../../data/sessionData';
import api from '../../api/axios';

export default function AdvisingSessions() {
  const { user } = useAuth();
  const isAdvisor = user?.role === 'advisor';
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [formData, setFormData] = useState({ 
    title: '', 
    date: '', 
    time: '', 
    duration: '30 minutes', 
    notes: '',
    studentId: '' // For advisor
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      const sessData = await getSessionsData();
      setSessions(sessData);

      if (isAdvisor) {
        const res = await api.get('/users/my-students');
        setMyStudents(res.data.students || []);
      }
    };
    
    fetchInitialData();
    const interval = setInterval(fetchInitialData, 5000); // Poll every 5s for real-time updates
    return () => clearInterval(interval);
  }, [isAdvisor]);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSessions = sessions.filter(s => s.date >= todayStr).sort((a,b) => new Date(a.date) - new Date(b.date));
  const pastSessions = sessions.filter(s => s.date < todayStr).sort((a,b) => new Date(b.date) - new Date(a.date));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdvisor && !user?.advisor) {
      alert("You don't have an advisor assigned yet. Please contact support.");
      return;
    }

    try {
      const payload = {
        ...formData,
        location: "Virtual / TBD",
        link: "Pending"
      };
      
      const newSess = await addSession(payload);
      setSessions([...sessions, newSess]);
      setIsModalOpen(false);
      setFormData({ title: '', date: '', time: '', duration: '30 minutes', notes: '', studentId: '' });
    } catch (err) {
      alert("Failed to schedule session");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateSessionStatus(id, status);
      const updated = sessions.map(s => s._id === id ? { ...s, status } : s);
      setSessions(updated);
    } catch (err) {
      alert(`Failed to ${status} session`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isAdvisor ? 'Advising Management' : 'Advising Sessions'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isAdvisor ? 'Review student requests and manage your schedule.' : 'Schedule and manage your meetings with your academic advisor.'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Calendar size={18} />
          {isAdvisor ? 'Schedule with Student' : '+ Schedule Session'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex space-x-6">
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`font-semibold pb-4 -mb-4 border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'upcoming' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                Upcoming
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-0.5 px-2 rounded-full text-xs">{upcomingSessions.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`font-semibold pb-4 -mb-4 border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'past' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                Past
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">{pastSessions.length}</span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'upcoming' ? (
                <div className="space-y-4">
                  {upcomingSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No upcoming sessions scheduled.
                    </div>
                  ) : upcomingSessions.map(session => (
                    <div key={session._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-gray-600">
                            <Calendar size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{session.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <span className="flex items-center gap-1"><Clock size={14}/> {session.time}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><MapPin size={14}/> {session.location}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${session.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {session.status || 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500"><User size={16}/></div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {isAdvisor ? session.student?.name : `Advisor: ${session.advisor?.name || 'Dr. Sharma'}`}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {session.status === 'Pending' && isAdvisor && (
                            <button 
                              onClick={() => handleUpdateStatus(session._id, 'Confirmed')}
                              className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                            >
                              Confirm
                            </button>
                          )}
                          <button 
                            onClick={() => handleUpdateStatus(session._id, 'Cancelled')}
                            className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pastSessions.map(session => (
                    <div key={session._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-full text-green-600 dark:text-green-400">
                          <CheckCircle size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-200">{session.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(session.date).toLocaleDateString()} • {isAdvisor ? session.student?.name : (session.advisor?.name || 'Advisor')}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">{session.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <Info size={20} className="text-indigo-600 dark:text-indigo-400" />
              Office Hours & Availability
            </h3>
            
            <div className="space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">My Schedule</h4>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">Mon/Wed: 2:00 PM - 4:00 PM</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">Fri: 10:00 AM - 12:00 PM</p>
              </div>
              <p className="text-xs text-gray-500">
                {isAdvisor ? 'Students can book sessions during these slots. You can override or cancel any request.' : 'Please book within these hours for faster confirmation.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Schedule Session</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {isAdvisor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Student</label>
                  <select 
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    required
                    className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose a Student --</option>
                    {myStudents.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Midterm Progress Review" 
                  required 
                  className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required 
                    className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input 
                    type="time" 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required 
                    className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
                <textarea 
                  rows="3" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
