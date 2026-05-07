import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Calendar, Users, AlertCircle, CheckCircle2, Clock, MapPin, Mail, Phone, Activity, Send, X } from 'lucide-react';
import { getMarksData, addAdvisorFeedback, calcTotalScore, calcAggregate, healthScore } from '../../data/marksData';

export default function AdvisorDashboard() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [healthData, setHealthData] = useState([]);
  
  // New Mock state for tabs
  const [activeTab, setActiveTab] = useState('Pending');
  const [suggestionTarget, setSuggestionTarget] = useState(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionSubject, setSuggestionSubject] = useState('General');
  const [suggestionFormOpenFor, setSuggestionFormOpenFor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Plans
        const plansRes = await api.get('/plans');
        let plansArray = [];
        if (Array.isArray(plansRes.data)) plansArray = plansRes.data;
        else if (plansRes.data?.plans) plansArray = plansRes.data.plans;
        setPlans(plansArray.filter(p => p.status?.toLowerCase() === 'submitted'));

        // 2. Fetch Assigned Students
        const studentsRes = await api.get('/users/my-students');
        const dbStudents = studentsRes.data?.students || [];

        // 3. Fetch Sessions
        const sessionsRes = await api.get('/sessions');
        setSessions(sessionsRes.data?.sessions || []);
        
        // 4. Reconcile with Database Marks Data
        const allMarks = await getMarksData();
        const dynamicHealth = dbStudents.map(student => {
          const studentId = (student._id || student.id)?.toString();
          const studentMarks = allMarks[studentId];
          
          if (!studentMarks || !studentMarks.semesters || !studentMarks.semesters.length) {
            return {
              id: studentId,
              name: student.name,
              degree: student.major || "Computer Science",
              year: student.year || "Sophomore",
              agg: 0,
              status: 'Healthy',
              bg: 'bg-green-100',
              color: 'text-green-600',
              subjects: []
            };
          }
          
          // Find the semester that is CURRENTLY RUNNING (missing final marks)
          let activeSem = studentMarks.semesters.find(s => 
            s.subjects.some(sub => !sub.components?.final?.scored)
          );
          // Fallback to the latest one if all are completed
          if (!activeSem) activeSem = studentMarks.semesters[studentMarks.semesters.length - 1];

          const agg = calcAggregate(activeSem.subjects);
          const h = healthScore(agg);
          
          return {
            id: studentId,
            name: student.name,
            degree: student.major || "Computer Science",
            year: student.year || "Sophomore",
            agg: agg.toFixed(1),
            status: h.status,
            color: h.color,
            bg: h.bg,
            subjects: activeSem.subjects.map(sub => ({
              code: sub.code,
              score: calcTotalScore(sub.components),
              status: (calcTotalScore(sub.components)) >= 50 ? 'Healthy' : 'At Risk'
            }))
          };
        });
        
        setHealthData(dynamicHealth);
      } catch (err) {
        setError('Failed to sync dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s for dashboard stats
    return () => clearInterval(interval);
  }, []);

  const handleSendFeedback = async (studentId) => {
    if(!suggestionText.trim()) return;
    const allMarks = await getMarksData();
    const studentMarks = allMarks[studentId];
    
    // Find the current RUNNING semester (missing final marks)
    let activeSem = studentMarks?.semesters?.find(s => 
      s.subjects.some(sub => !sub.components?.final?.scored)
    );
    // Fallback to the latest one if all are completed
    if (!activeSem && studentMarks?.semesters?.length > 0) {
      activeSem = studentMarks.semesters[studentMarks.semesters.length - 1];
    }
    
    const activeSemId = activeSem ? activeSem.id : null;
    
    if (activeSemId) {
      await addAdvisorFeedback(activeSemId, {
        text: suggestionText,
        relatedSubject: suggestionSubject
      });
      alert('Feedback sent!');
    } else {
      alert('Student has no active academic records to attach feedback.');
    }
    
    setSuggestionFormOpenFor(null);
    setSuggestionText('');
    setSuggestionSubject('General');
  };

  if (loading) return <div className="text-center py-12">Syncing Advisor Dashboard...</div>;

  // Compute dynamic stat counts
  const healthCounts = healthData.reduce((acc, s) => {
    if (s.status === 'Healthy') acc.healthy++;
    else if (s.status === 'Needs Attention') acc.attention++;
    else if (s.status === 'At Risk') acc.risk++;
    return acc;
  }, { healthy: 0, attention: 0, risk: 0 });

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAdvisorSessions = sessions
    .filter(s => s.date >= todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hello, Advisor</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">Computer Science Department • {healthData.length} Advisees</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Calendar size={18} />
            Office Hours
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Users size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Advisees</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{healthData.length}</div>
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
            <CheckCircle2 size={14} className="text-green-500" />
            All active
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertCircle size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Plans</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{plans.length}</div>
          <div className="mt-2 text-sm text-amber-600 font-medium">Require review</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Reviews</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">12</div>
          <div className="mt-2 text-sm text-gray-500">This semester</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">At Risk</span>
          </div>
          <div className="text-3xl font-bold text-red-600">{healthCounts.risk}</div>
          <div className="mt-2 text-sm text-red-500 font-medium">Needs urgent action</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          
          {/* Pending Plans Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Academic Plans for Review</h2>
                <p className="text-sm text-gray-500 mt-1">Students waiting for course approval</p>
              </div>
              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {plans.length} Total
              </span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {plans.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No pending plans for review.</div>
              ) : (
                plans.map(plan => (
                  <div key={plan._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                        {plan.student?.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{plan.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{plan.student?.name} • {plan.student?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Submitted</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{new Date(plan.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <Link 
                        to={`/advisor/plans/${plan._id}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        Review Plan
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Health Monitor */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Academic Health Monitor</h2>
                <p className="text-sm text-gray-500 mt-1">Real-time performance tracking of all advisees</p>
              </div>
              <div className="flex gap-2">
                {['All', 'Healthy', 'Needs Attention', 'At Risk'].map(filter => (
                  <button 
                    key={filter} 
                    onClick={() => setActiveTab(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === filter ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                  <tr>
                    <th className="px-8 py-4">Student</th>
                    <th className="px-8 py-4">Performance</th>
                    <th className="px-8 py-4">Aggregate</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {healthData.filter(s => activeTab === 'All' || s.status === activeTab).map(student => (
                    <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.degree}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-1.5">
                          {student.subjects.length > 0 ? student.subjects.map((sub, i) => (
                            <div key={i} title={`${sub.code}: ${sub.score}%`} className={`w-2.5 h-8 rounded-full ${sub.status === 'Healthy' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          )) : <span className="text-xs text-gray-400">No active marks</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-gray-900 dark:text-white">{student.agg}%</td>
                      <td className="px-8 py-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${student.bg} ${student.color}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right space-x-2">
                        <button 
                          onClick={() => setSuggestionFormOpenFor(student.id)}
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Quick Suggestion"
                        >
                          <Send size={18} />
                        </button>
                        <Link 
                          to={`/advisor/students/${student.id}/marks`}
                          className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors inline-block"
                          title="View Detailed Marks"
                        >
                          <Activity size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-1 space-y-8">
          
          {/* Quick Sessions Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Upcoming Sessions</h3>
              <Link to="/advisor/sessions" className="text-indigo-600 text-xs font-bold hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {upcomingAdvisorSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No sessions scheduled for today.</p>
              ) : (
                upcomingAdvisorSessions.slice(0, 3).map((session, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm h-fit">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white text-sm">{session.title}</h5>
                      <p className="text-xs text-gray-500 mt-1">{session.date} • {session.time}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{session.student?.name}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link 
              to="/advisor/sessions"
              className="block w-full text-center py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 transition-colors"
            >
              Schedule New Session
            </Link>
          </div>

          {/* Quick Connect Panel */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-lg p-8 text-white space-y-6">
            <h3 className="font-bold text-lg">Quick Student Chat</h3>
            <div className="space-y-4">
              {healthData.slice(0, 3).map(student => (
                <div key={student.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      {student.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{student.name}</span>
                  </div>
                  <Link to="/advisor/messages" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Send size={16} />
                  </Link>
                </div>
              ))}
            </div>
            <Link to="/advisor/messages" className="block text-center text-xs font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 py-2 rounded-lg transition-colors">
              Open Message Center
            </Link>
          </div>
        </div>
      </div>

      {/* Suggestion Overlay */}
      {suggestionFormOpenFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Send size={18} className="text-indigo-600" />
                Quick Feedback
              </h3>
              <button onClick={() => setSuggestionFormOpenFor(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Related Subject</label>
                <input 
                  type="text" 
                  value={suggestionSubject}
                  onChange={(e) => setSuggestionSubject(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. CS101"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Your Feedback</label>
                <textarea 
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                  placeholder="Write your suggestion here..."
                ></textarea>
              </div>
              <button 
                onClick={() => handleSendFeedback(suggestionFormOpenFor)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
