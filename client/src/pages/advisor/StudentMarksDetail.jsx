import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  getMarksData, 
  addAdvisorFeedback,
  calcTotalScore, 
  calcAggregate, 
  gradeFromAggregate, 
  gapToTarget 
} from '../../data/marksData';
import { ChevronRight, Send, User as UserIcon, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function StudentMarksDetail() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [data, setData] = useState(null);
  const [selectedSemId, setSelectedSemId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubject, setFeedbackSubject] = useState('General');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // 1. Fetch student profile
        const userRes = await api.get(`/users/${studentId}`);
        setStudent(userRes.data.user);

        // 2. Fetch marks
        const allData = await getMarksData(studentId);
        const studentData = allData[studentId];
        
        if (studentData && studentData.semesters.length > 0) {
          setData(studentData);
          // Prioritize Ongoing semester (one missing final marks)
          let activeSem = studentData.semesters.find(s => 
            s.subjects.some(sub => !sub.components?.final?.scored)
          );
          if (!activeSem) activeSem = studentData.semesters[studentData.semesters.length - 1];

          setSelectedSemId(activeSem.label);
          setSubjects(activeSem.subjects);
          setFeedback(activeSem.advisorFeedback || []);
        }
      } catch (err) {
        console.error("Failed to load student details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [studentId]);

  const handleSemChange = (e) => {
    const sid = e.target.value;
    setSelectedSemId(sid);
    const sem = data.semesters.find(s => s.label === sid);
    if (sem) {
      setSubjects(sem.subjects);
      setFeedback(sem.advisorFeedback || []);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !data) return;
    setSending(true);
    try {
      // Find the database _id of the current semester mark record
      const semRecord = data.semesters.find(s => s.label === selectedSemId);
      if (!semRecord) return;

      const success = await addAdvisorFeedback(semRecord.id, {
        text: feedbackText,
        relatedSubject: feedbackSubject
      });
      
      if (success) {
        setFeedback([{ advisor: { name: 'You' }, text: feedbackText, relatedSubject: feedbackSubject, createdAt: new Date() }, ...feedback]);
        setFeedbackText('');
        alert("Feedback sent successfully!");
      }
    } catch (err) {
      alert("Failed to send feedback");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!student) return <div className="max-w-4xl mx-auto p-10 text-center text-red-500 font-bold">Student record not found.</div>;

  const aggregate = calcAggregate(subjects);
  const projectedGrade = gradeFromAggregate(aggregate);
  const atRiskCount = subjects.filter(s => calcTotalScore(s.components) < 40).length;
  const avgAttendance = subjects.length ? (subjects.reduce((acc, s) => acc + Number(s.attendance || 0), 0) / subjects.length).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500">
        <Link to="/advisor/dashboard" className="hover:text-indigo-600 font-medium">Dashboard</Link>
        <ChevronRight size={14} className="mx-2" />
        <span className="text-gray-900 font-bold">{student.name}'s Progress</span>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UserIcon size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-500 font-medium">{student.email} • {student.role?.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <label className="text-sm font-bold text-gray-700">Semester View:</label>
          <select 
            value={selectedSemId} 
            onChange={handleSemChange}
            disabled={!data}
            className="border-none bg-white rounded-lg px-4 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer shadow-sm"
          >
            {data ? data.semesters.map(s => (
              <option key={s.label} value={s.label}>{s.label}</option>
            )) : <option>No data available</option>}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Aggregate</p>
          <p className="text-4xl font-bold text-indigo-600">{aggregate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Projected Grade</p>
          <p className="text-4xl font-bold text-gray-900">{projectedGrade}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subjects At Risk</p>
          <p className={`text-4xl font-bold ${atRiskCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{atRiskCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Avg Attendance</p>
          <p className="text-4xl font-bold text-gray-900">{avgAttendance}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          {/* Marks Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Academic Records</h2>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Read Only View</span>
            </div>
            <div className="p-8 space-y-8">
               <div className="grid grid-cols-12 text-[10px] font-black text-gray-400 uppercase tracking-tighter pb-4 border-b border-gray-50">
                  <div className="col-span-4">Subject</div>
                  <div className="col-span-1 text-center">INT</div>
                  <div className="col-span-1 text-center">MID</div>
                  <div className="col-span-1 text-center">ASG</div>
                  <div className="col-span-1 text-center">FIN</div>
                  <div className="col-span-1 text-center">ATT%</div>
                  <div className="col-span-1 text-center">TOT</div>
                  <div className="col-span-2 text-right">GAP</div>
               </div>

               {subjects.length === 0 ? (
                 <div className="py-20 text-center text-gray-400">No active marks for this semester.</div>
               ) : subjects.map((sub, idx) => {
                 const total = calcTotalScore(sub.components);
                 const score80 = Number(sub.components.internal?.scored || 0) + Number(sub.components.midterm?.scored || 0) + Number(sub.components.assignment?.scored || 0);
                 const gap = gapToTarget(sub.targetGrade || 'A', score80);
                 
                 return (
                   <div key={idx} className="grid grid-cols-12 items-center gap-4 py-2 hover:bg-gray-50/50 transition-colors rounded-xl px-2 -mx-2">
                     <div className="col-span-4">
                       <div className="font-bold text-gray-900">{sub.code}</div>
                       <div className="text-[10px] text-gray-400 font-medium">{sub.name}</div>
                     </div>
                     <div className="col-span-1 text-center text-sm font-semibold text-gray-600">{sub.components.internal?.scored}</div>
                     <div className="col-span-1 text-center text-sm font-semibold text-gray-600">{sub.components.midterm?.scored}</div>
                     <div className="col-span-1 text-center text-sm font-semibold text-gray-600">{sub.components.assignment?.scored}</div>
                     <div className="col-span-1 text-center text-sm font-semibold text-gray-600">{sub.components.final?.scored || '-'}</div>
                     <div className="col-span-1 text-center text-sm font-semibold text-gray-600">{sub.attendance}%</div>
                     <div className="col-span-1 text-center">
                        <span className={`text-sm font-bold ${total >= 50 ? 'text-green-600' : 'text-red-500'}`}>{total}</span>
                     </div>
                     <div className={`col-span-2 text-right text-[10px] font-black uppercase ${gap.color}`}>
                       {gap.text}
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Feedback Timeline */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Feedback History</h2>
            </div>
            <div className="p-8 space-y-6">
              {feedback.length === 0 ? (
                <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-3">
                  <Info size={30} className="text-gray-200" />
                  <p className="text-sm font-medium">No previous feedback for this semester.</p>
                </div>
              ) : feedback.map((fb, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-gray-50 bg-white">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">YOU</div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-sm text-gray-900">Advisor Feedback</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-full">{fb.relatedSubject}</span>
                      <span className="text-[10px] text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{fb.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sticky top-8">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Send size={20} className="text-indigo-600" />
                Give Personal Feedback
             </h3>
             <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Target Subject</label>
                  <select 
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="General">General Performance</option>
                    {subjects.map(s => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Advice / Suggestion</label>
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Write your feedback here..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-40 resize-none font-medium"
                  />
                </div>
                <button 
                  onClick={handleSendFeedback}
                  disabled={sending || !feedbackText.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Send size={18}/> Send Feedback</>}
                </button>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 mt-4">
                  <AlertTriangle size={24} className="text-amber-600 flex-shrink-0" />
                  <p className="text-[10px] text-amber-700 leading-tight font-medium">
                    Feedback will be immediately visible to the student on their dashboard under the "My Marks" section.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
