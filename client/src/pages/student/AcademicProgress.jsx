import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { getMarksData } from '../../data/marksData';
import { CheckCircle2, Clock, BookOpen, ChevronRight, Award, GraduationCap } from 'lucide-react';

export default function AcademicProgress() {
  const { user } = useAuth();
  const [completedFromMarks, setCompletedFromMarks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch ALL courses to build categories
        const courseRes = await api.get('/courses');
        setCourses(courseRes.data.courses || []);

        // 2. Fetch marks to see what's actually completed
        const studentId = user?._id || user?.id;
        const allMarks = await getMarksData();
        const studentMarks = allMarks[studentId] || { semesters: [] };
        
        // A course is "Completed" if it has final marks
        const completed = [];
        if (studentMarks && studentMarks.semesters) {
          studentMarks.semesters.forEach(sem => {
            if (sem.subjects) {
              sem.subjects.forEach(sub => {
                const c = sub.components || {};
                const hasFinal = c.final?.scored !== undefined && c.final?.scored !== null && c.final?.scored !== '';
                if (hasFinal) {
                  completed.push(sub.code);
                }
              });
            }
          });
        }
        setCompletedFromMarks(completed);
      } catch (err) {
        console.error("Failed to load progress data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Categorization Logic
  const categories = {
    "Core Requirements": courses.filter(c => c.code.startsWith('CS')),
    "Mathematics": courses.filter(c => c.code.startsWith('MATH')),
    "Electives": courses.filter(c => !c.code.startsWith('CS') && !c.code.startsWith('MATH'))
  };

  const totalRequired = 120;
  const completedCredits = courses
    .filter(c => completedFromMarks.includes(c.code))
    .reduce((acc, c) => acc + (c.credits || 0), 0);
  
  const progressPercent = Math.min(100, (completedCredits / totalRequired) * 100);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Progress</h1>
          <p className="text-gray-500">Track your degree requirements and graduation status.</p>
        </div>
      </div>

      {/* Progress Hero */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Computer Science Degree Progress</h2>
              <p className="text-sm text-gray-500">B.S. in Computer Science • 2022 Curriculum</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-indigo-600">{completedCredits}</span>
            <span className="text-gray-400 font-bold"> / {totalRequired} Credits</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-8 pt-4">
            {Object.entries(categories).map(([name, catCourses]) => {
              const catTotal = catCourses.reduce((acc, c) => acc + (c.credits || 0), 0);
              const catDone = catCourses.filter(c => completedFromMarks.includes(c.code)).reduce((acc, c) => acc + (c.credits || 0), 0);
              const percent = catTotal ? (catDone / catTotal) * 100 : 0;
              
              return (
                <div key={name} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>{name}</span>
                    <span>{catDone}/{catTotal} ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed View */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Requirement Checklist</h2>
        </div>
        
        <div className="p-8">
          <div className="space-y-12">
            {Object.entries(categories).map(([name, catCourses]) => (
              <div key={name} className="space-y-4">
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  {name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catCourses.map(course => {
                    const isDone = completedFromMarks.includes(course.code);
                    return (
                      <div key={course.code} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isDone ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDone ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400'}`}>
                            {isDone ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{course.code}</p>
                            <p className="text-xs text-gray-500 font-medium">{course.name}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-gray-400 uppercase">{course.credits} Credits</span>
                          <span className={`text-[10px] font-black uppercase ${isDone ? 'text-green-600' : 'text-amber-500'}`}>
                            {isDone ? 'Completed' : 'Planned'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
