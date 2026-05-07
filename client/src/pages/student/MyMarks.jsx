import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  getMarksData, 
  updateStudentMarks, 
  calcTotalScore, 
  calcAggregate, 
  gradeFromAggregate, 
  gapToTarget 
} from '../../data/marksData';
import { 
  Save, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  Info,
  Clock,
  LayoutDashboard,
  Award
} from 'lucide-react';

export default function MyMarks() {
  const { user } = useAuth();
  const studentId = user?._id || user?.id;

  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [selectedSemId, setSelectedSemId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch academic plans to know which semesters/courses exist
        const plansRes = await api.get('/plans');
        const allPlans = plansRes.data.plans || plansRes.data || [];
        const approvedPlans = allPlans.filter(p => (p.status || '').toLowerCase() === 'approved');
        setPlans(approvedPlans);

        const semSet = new Set();
        approvedPlans.forEach(plan => {
          (plan.semesters || []).forEach(s => semSet.add(s.name));
        });

        // 2. Load Marks (Check if we need to sync from local storage)
        const allMarks = await getMarksData();
        const studentMarks = allMarks[studentId];

        // Ensure all semesters from marks are also in the set
        if (studentMarks?.semesters) {
          studentMarks.semesters.forEach(s => semSet.add(s.label));
        }

        const sems = Array.from(semSet.values()).map(s => {
          const m = studentMarks?.semesters?.find(ms => ms.label === s);
          // A semester is completed ONLY if all its subjects have final marks
          const isCompleted = m && m.subjects?.length > 0 && m.subjects.every(sub => 
            sub.components?.final?.scored !== undefined && 
            sub.components?.final?.scored !== null && 
            sub.components?.final?.scored !== ''
          );
          return { id: s, name: s, status: isCompleted ? 'Completed' : 'Ongoing' };
        }).sort((a, b) => a.name.localeCompare(b.name));
        
        setAvailableSemesters(sems);

        // AUTO-SYNC BRIDGE: If DB is empty but localStorage has data, push to DB
        if (!studentMarks || studentMarks.semesters.length === 0) {
          const local = localStorage.getItem('advisorpath_marks');
          if (local) {
            const fullLocal = JSON.parse(local);
            const localData = fullLocal[studentId];
            if (localData && localData.semesters) {
              for (const sem of localData.semesters) {
                await updateStudentMarks(studentId, sem.label, sem.subjects);
              }
              localStorage.removeItem('advisorpath_marks');
              window.location.reload(); 
              return;
            }
          }
        }

        if (sems.length > 0) {
          const initialSemId = sems[0].id;
          setSelectedSemId(initialSemId);
          loadSemesterData(initialSemId, approvedPlans, studentMarks);
        }
      } catch (err) {
        console.error("Failed to load marks data", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user, studentId]);

  const loadSemesterData = async (sid, pData, mData) => {
    const studentMarks = mData || (await getMarksData())[studentId];
    
    const sem = studentMarks?.semesters.find(s => s.label === sid);
    if (sem) {
      setSubjects(sem.subjects);
      setFeedback(sem.advisorFeedback || []);
    } else {
      let foundCourses = [];
      for (const plan of pData) {
        const planSem = (plan.semesters || []).find(s => s.name === sid);
        if (planSem) {
          foundCourses = planSem.courses || [];
          break;
        }
      }
      setSubjects(foundCourses.map(c => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        components: {
          internal: { scored: '', total: 30 },
          midterm: { scored: '', total: 30 },
          assignment: { scored: '', total: 20 },
          final: { scored: '', total: 20 }
        },
        attendance: 90,
        targetGrade: 'A',
        studentNote: ''
      })));
      setFeedback([]);
    }
  };

  const handleUpdateMark = (subIdx, component, value) => {
    const newSubjects = [...subjects];
    newSubjects[subIdx].components[component].scored = value === '' ? '' : Number(value);
    setSubjects(newSubjects);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudentMarks(studentId, selectedSemId, subjects);
      alert("Marks saved successfully! Your advisor can now see these updates.");
    } catch (err) {
      alert("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const aggregate = calcAggregate(subjects);
  const projectedGrade = gradeFromAggregate(aggregate);
  const atRiskCount = subjects.filter(s => calcTotalScore(s.components) < 40).length;
  const avgAttendance = subjects.length ? (subjects.reduce((acc, s) => acc + Number(s.attendance || 0), 0) / subjects.length).toFixed(1) : 0;
  
  const currentSem = availableSemesters.find(s => s.id === selectedSemId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Marks</h1>
          <p className="text-gray-500">Track your semester performance and view advisor feedback.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <div className="pl-4 pr-2 py-2 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <Clock size={14} /> Semester:
           </div>
           <div className="relative">
             <select 
               value={selectedSemId} 
               onChange={(e) => {
                 setSelectedSemId(e.target.value);
                 loadSemesterData(e.target.value, plans);
               }}
               className="appearance-none bg-gray-50 border-none rounded-xl px-6 py-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer pr-10"
             >
               {availableSemesters.map(s => (
                 <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
               ))}
             </select>
             <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
           </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Aggregate</p>
          <p className="text-4xl font-black text-indigo-600">{aggregate.toFixed(1)}%</p>
          <div className="mt-4 h-1.5 bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${aggregate}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Projected Grade</p>
          <p className="text-4xl font-black text-gray-900">{projectedGrade}</p>
          <p className="text-[10px] font-bold text-gray-400 mt-4 italic">Based on current components</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subjects At Risk</p>
          <p className={`text-4xl font-black ${atRiskCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{atRiskCount}</p>
          <div className="flex items-center gap-2 mt-4">
             {atRiskCount > 0 ? <AlertCircle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-green-500" />}
             <span className="text-[10px] font-bold text-gray-500">{atRiskCount > 0 ? 'Needs Attention' : 'On Track'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Attendance</p>
          <p className="text-4xl font-black text-gray-900">{avgAttendance}%</p>
          <div className="mt-4 h-1.5 bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${avgAttendance}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <LayoutDashboard size={20} className="text-indigo-600" />
                <h2 className="text-xl font-black text-gray-800">Subject Marks</h2>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={18}/> Save Marks</>}
              </button>
            </div>

            <div className="p-8 space-y-10">
               <div className="grid grid-cols-12 text-[10px] font-black text-gray-400 uppercase tracking-tighter pb-4 border-b border-gray-50">
                  <div className="col-span-3">Subject</div>
                  <div className="col-span-1 text-center">INT(/30)</div>
                  <div className="col-span-1 text-center">MID(/30)</div>
                  <div className="col-span-1 text-center">ASG(/20)</div>
                  <div className="col-span-1 text-center">ATT%</div>
                  <div className="col-span-1 text-center">FIN(/20)</div>
                  <div className="col-span-1 text-center">SCORE</div>
                  <div className="col-span-1 text-center">TARGET</div>
                  <div className="col-span-2 text-right">GAP ANALYSIS</div>
               </div>

               {subjects.map((sub, idx) => {
                 const score80 = Number(sub.components.internal?.scored || 0) + Number(sub.components.midterm?.scored || 0) + Number(sub.components.assignment?.scored || 0);
                 const total = score80 + Number(sub.components.final?.scored || 0);
                 const gap = gapToTarget(sub.targetGrade || 'A', score80);
                 const isAtRisk = total < 40;

                 return (
                   <div key={idx} className="space-y-4 group">
                     <div className="grid grid-cols-12 items-center gap-4">
                       <div className="col-span-3">
                         <div className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{sub.code}</div>
                         <div className="text-[10px] text-gray-400 font-medium truncate">{sub.name}</div>
                       </div>
                       
                       {['internal', 'midterm', 'assignment'].map(comp => (
                         <div key={comp} className="col-span-1">
                           <input 
                             type="number" 
                             value={sub.components[comp]?.scored}
                             onChange={(e) => handleUpdateMark(idx, comp, e.target.value)}
                             className="w-full bg-gray-50 border-none rounded-lg p-2 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                           />
                         </div>
                       ))}
                       
                       <div className="col-span-1">
                         <input 
                           type="number" 
                           value={sub.attendance}
                           onChange={(e) => {
                             const newS = [...subjects];
                             newS[idx].attendance = Number(e.target.value);
                             setSubjects(newS);
                           }}
                           className="w-full bg-gray-50 border-none rounded-lg p-2 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                         />
                       </div>

                       <div className="col-span-1">
                         <input 
                           type="number" 
                           value={sub.components.final?.scored}
                           onChange={(e) => handleUpdateMark(idx, 'final', e.target.value)}
                           className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm"
                           placeholder="-"
                         />
                       </div>

                       <div className="col-span-1 text-center font-black">
                         <span className={total >= 50 ? 'text-green-600' : 'text-red-500'}>{total}</span>
                         <span className="text-[8px] text-gray-400 ml-0.5">/100</span>
                       </div>

                       <div className="col-span-1">
                         <select 
                           value={sub.targetGrade}
                           onChange={(e) => {
                             const newS = [...subjects];
                             newS[idx].targetGrade = e.target.value;
                             setSubjects(newS);
                           }}
                           className="w-full bg-white border border-gray-100 rounded-lg p-1 text-[10px] font-black focus:ring-1 focus:ring-indigo-500"
                         >
                           {['A+', 'A', 'B+', 'B', 'C'].map(g => <option key={g} value={g}>{g}</option>)}
                         </select>
                       </div>

                       <div className={`col-span-2 text-right text-[10px] font-black uppercase ${gap.color}`}>
                         {gap.text}
                       </div>
                     </div>
                     <div className="pl-4 border-l-2 border-gray-100 ml-2">
                        <input 
                          type="text" 
                          value={sub.studentNote}
                          onChange={(e) => {
                            const newS = [...subjects];
                            newS[idx].studentNote = e.target.value;
                            setSubjects(newS);
                          }}
                          placeholder="Add a note for your advisor (optional)..."
                          className="w-full text-[10px] text-gray-500 bg-transparent border-none focus:ring-0 italic"
                        />
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <Award size={20} className="text-indigo-600" />
              Advisor Feedback
            </h3>
            <div className="space-y-6">
              {feedback.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Info size={24} />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">No feedback received for this semester yet.</p>
                </div>
              ) : feedback.map((fb, idx) => (
                <div key={idx} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{fb.relatedSubject}</span>
                    <span className="text-[8px] font-bold text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{fb.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden">
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full" />
             <h3 className="text-lg font-bold mb-4">Semester Goal</h3>
             <p className="text-indigo-100 text-sm leading-relaxed mb-6">
               To reach your target grades, ensure you focus on the gaps identified in the analysis. Consistent attendance is key!
             </p>
             <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">System Insight</p>
                <p className="text-xs font-bold italic">"You are 5% away from your Calculus I target. Small push needed!"</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
