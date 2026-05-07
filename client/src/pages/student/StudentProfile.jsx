import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Mail, Phone, MapPin, GraduationCap, Calendar, Lock, Bell, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMarksData, calcScoreOutOf80, calcAggregate, gradeFromAggregate } from '../../data/marksData';
import api from '../../api/axios';

const PROFILE_KEY = 'advisorpath_student_profile';

export default function StudentProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [plans, setPlans] = useState([]);

  // Editable profile fields stored in localStorage
  const defaultProfile = {
    phone: '',
    address: '',
    hostel: '',
    degree: 'B.Tech Computer Science',
    enrollmentYear: new Date().getFullYear() - 1,
    expectedGrad: new Date().getFullYear() + 3,
    rollNo: '',
    branch: 'Computer Science',
    semester: '1',
  };

  const loadProfile = () => {
    const stored = localStorage.getItem(PROFILE_KEY + '_' + (user?._id || user?.id));
    return stored ? JSON.parse(stored) : defaultProfile;
  };

  const [profile, setProfile] = useState(loadProfile);
  const [editForm, setEditForm] = useState(profile);

  // Load plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        let arr = [];
        if (Array.isArray(res.data)) arr = res.data;
        else if (res.data?.data) arr = res.data.data;
        else if (res.data?.plans) arr = res.data.plans;
        setPlans(arr);
      } catch (_) {}
    };
    fetchPlans();
  }, []);

  const [studentMarks, setStudentMarks] = useState({ semesters: [] });
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch courses to get correct credit values
        const courseRes = await api.get('/courses');
        setAllCourses(courseRes.data.courses || []);

        // 2. Fetch marks
        const allMarks = await getMarksData();
        const studentId = user?._id || user?.id;
        if (allMarks[studentId]) {
          setStudentMarks(allMarks[studentId]);
        }
      } catch (err) {
        console.error("Failed to load profile data", err);
      }
    };
    if (user) fetchData();
  }, [user]);

  const semesters = studentMarks.semesters || [];

  // GPA: average across all semesters
  let totalAgg = 0;
  semesters.forEach(sem => { totalAgg += calcAggregate(sem.subjects || []); });
  const avgAgg = semesters.length ? totalAgg / semesters.length : 0;
  const gpaRaw = (avgAgg / 100) * 10;
  const gpa = gpaRaw.toFixed(2);

  // Credits: only count subjects that have final marks using official credit values
  const creditsEarned = semesters.reduce((acc, sem) => {
    const semCredits = (sem.subjects || []).reduce((sAcc, sub) => {
      const hasFinal = sub.components?.final?.scored !== undefined && 
                       sub.components?.final?.scored !== null && 
                       sub.components?.final?.scored !== '';
      if (!hasFinal) return sAcc;
      
      // Look up official credit value from courses list
      const courseInfo = allCourses.find(c => c.code === sub.code);
      return sAcc + (courseInfo?.credits || sub.credits || 3);
    }, 0);
    return acc + semCredits;
  }, 0);
  const totalCredits = 120;

  // Approved plans
  const approvedCount = plans.filter(p => p.status === 'Approved' || p.status === 'approved').length;
  const pendingCount = plans.filter(p => p.status === 'Submitted' || p.status === 'submitted').length;

  // Initials
  const initials = (user?.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const advisorName = user?.advisor?.name || 'Dr. Priya Sharma';
  const advisorEmail = user?.advisor?.email || 'advisor@advisorpath.com';
  const advisorInitials = advisorName.split(' ').filter(n => n !== 'Dr.' && n !== 'Prof.').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleSave = () => {
    localStorage.setItem(PROFILE_KEY + '_' + (user?._id || user?.id), JSON.stringify(editForm));
    setProfile(editForm);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Student Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your personal information and academic overview.</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-semibold">
            <CheckCircle size={16}/> Profile saved!
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8">

        {/* ── LEFT: Personal Info Card ── */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 relative">

            {!editing ? (
              <button onClick={() => { setEditForm(profile); setEditing(true); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Edit2 size={18}/>
              </button>
            ) : (
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleSave} className="text-green-600 hover:text-green-700"><Save size={18}/></button>
                <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
              </div>
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-6 pt-4">
              <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold mb-4 shadow-sm border-4 border-white dark:border-gray-800">
                {initials}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name || 'Student'}</h2>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Student</p>
              {profile.rollNo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Roll No: {profile.rollNo}</p>}
            </div>

            {/* Info Fields */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              {/* Email (read-only from auth) */}
              <div className="flex items-start gap-3 text-sm">
                <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                <div className="text-gray-700 dark:text-gray-300 font-medium">{user?.email || '—'}</div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3 text-sm">
                <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                {editing ? (
                  <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Your phone number"
                    className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"/>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 font-medium">{profile.phone || <span className="text-gray-400 italic">Not set</span>}</div>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                {editing ? (
                  <input value={editForm.hostel} onChange={e => setEditForm({...editForm, hostel: e.target.value})}
                    placeholder="Hostel / Address"
                    className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"/>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 font-medium">{profile.hostel || <span className="text-gray-400 italic">Not set</span>}</div>
                )}
              </div>

              {/* Degree */}
              <div className="flex items-start gap-3 text-sm">
                <GraduationCap size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                {editing ? (
                  <input value={editForm.degree} onChange={e => setEditForm({...editForm, degree: e.target.value})}
                    placeholder="Degree program"
                    className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"/>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 font-medium">{profile.degree}</div>
                )}
              </div>

              {/* Roll No */}
              {editing && (
                <div className="flex items-start gap-3 text-sm">
                  <BookOpen size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                  <input value={editForm.rollNo} onChange={e => setEditForm({...editForm, rollNo: e.target.value})}
                    placeholder="Roll / Student ID"
                    className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"/>
                </div>
              )}

              {/* Enrollment & Grad Year */}
              <div className="flex items-start gap-3 text-sm">
                <Calendar size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                {editing ? (
                  <div className="flex gap-2 flex-1">
                    <input type="number" value={editForm.enrollmentYear} onChange={e => setEditForm({...editForm, enrollmentYear: e.target.value})}
                      placeholder="Enroll Year"
                      className="w-1/2 border dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"/>
                    <input type="number" value={editForm.expectedGrad} onChange={e => setEditForm({...editForm, expectedGrad: e.target.value})}
                      placeholder="Grad Year"
                      className="w-1/2 border dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"/>
                  </div>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 font-medium">
                    Enrolled: {profile.enrollmentYear} &nbsp;|&nbsp; Grad: {profile.expectedGrad}
                  </div>
                )}
              </div>

              {/* Current Semester */}
              {editing && (
                <div className="flex items-start gap-3 text-sm">
                  <TrendingUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                  <select value={editForm.semester} onChange={e => setEditForm({...editForm, semester: e.target.value})}
                    className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {editing && (
              <button onClick={handleSave}
                className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                <Save size={16}/> Save Profile
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">GPA</p>
                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{gpa}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Approved Plans</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">{approvedCount}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Credits</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{creditsEarned}<span className="text-sm text-gray-400">/{totalCredits}</span></p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Pending</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="col-span-2 space-y-6">

          {/* Academic Information Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Academic Information</h2>
            </div>
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
              {['summary', 'marks'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                  {tab === 'summary' ? 'Summary' : 'Marks History'}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Current GPA', value: gpa, color: 'text-gray-900 dark:text-white' },
                      { label: 'Credits Earned', value: `${creditsEarned}/${totalCredits}`, color: 'text-indigo-600 dark:text-indigo-400' },
                      { label: 'Enrollment', value: profile.enrollmentYear, color: 'text-gray-900 dark:text-white' },
                      { label: 'Expected Grad', value: profile.expectedGrad, color: 'text-gray-900 dark:text-white' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Degree progress bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Degree Progress</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{Math.min(100, Math.round((creditsEarned / totalCredits) * 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (creditsEarned / totalCredits) * 100)}%` }}/>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{creditsEarned} of {totalCredits} credits completed</p>
                  </div>

                  {/* Advisor Card */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">Academic Advisor</h3>
                    <div className="border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-xl flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-indigo-200 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-lg">
                          {advisorInitials}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {advisorName}
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Available</span>
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Academic Advisor</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><Mail size={11}/> {advisorEmail}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Office Hours</p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Mon/Wed 2–4 pm</p>
                        <p className="text-gray-600 dark:text-gray-400">Fri 10 am–12 pm</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'marks' && (
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Semester Performance History</h3>
                  {semesters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No marks entered yet. Go to <a href="/student/marks" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">My Marks</a> to add your scores.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900/30">
                        <tr>
                          {['Semester', 'Subjects', 'Aggregate', 'Grade', 'Advisor Notes'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {semesters.map(sem => {
                          const agg = calcAggregate(sem.subjects || []);
                          const grade = gradeFromAggregate(agg);
                          const feedbackCount = (sem.advisorFeedback || []).length;
                          return (
                            <tr key={sem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                              onClick={() => window.location.href = '/student/marks'}>
                              <td className="px-4 py-4 font-bold text-indigo-600 dark:text-indigo-400">{sem.label}</td>
                              <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{sem.subjects?.length || 0}</td>
                              <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{agg.toFixed(1)}%</td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  grade === 'C' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>{grade}</span>
                              </td>
                              <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                                {feedbackCount > 0
                                  ? <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-bold">{feedbackCount} Notes</span>
                                  : <span className="text-gray-400">No notes</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Account Settings</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                { icon: <Bell size={20}/>, title: 'Email Notifications', desc: 'Receive alerts for plan approvals, advisor feedback, and session reminders', action: 'Manage' },
                { icon: <Lock size={20}/>, title: 'Change Password', desc: `Registered email: ${user?.email || '—'}`, action: 'Change' },
              ].map(item => (
                <div key={item.title} className="px-6 py-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex gap-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 h-fit">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
