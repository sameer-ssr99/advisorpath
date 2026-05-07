import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import PrerequisiteTree from '../../components/PrerequisiteTree';
import { Search } from 'lucide-react';
import { getMarksData } from '../../data/marksData';
import { computeMyCourses } from '../../utils/computeMyCourses';

export default function CourseCatalog() {
  const { user } = useAuth();
  // Existing real backend data for course catalog
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  // New Mock Data logic for "My Courses" section
  const [myCoursesTab, setMyCoursesTab] = useState('Current');
  const [dynamicMyCourses, setDynamicMyCourses] = useState({ current: [], upcoming: [], completed: [] });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.courses);
      } catch (err) {
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchMyCoursesData = async () => {
      try {
        if (!user) return;
        const plansRes = await api.get('/plans');
        
        // Handle different possible backend response shapes
        let plansArray = [];
        if (Array.isArray(plansRes.data)) plansArray = plansRes.data;
        else if (plansRes.data?.data && Array.isArray(plansRes.data.data)) plansArray = plansRes.data.data;
        else if (plansRes.data?.plans && Array.isArray(plansRes.data.plans)) plansArray = plansRes.data.plans;

        const studentPlans = plansArray;
        
        const allMarks = await getMarksData();
        const studentId = user?._id || user?.id;
        const marksData = allMarks[studentId];

        const computed = computeMyCourses(studentPlans, marksData);
        setDynamicMyCourses(computed);
      } catch (err) {
        console.error('Failed to compute my courses', err);
      }
    };
    fetchMyCoursesData();
  }, [user]);

  const departments = [...new Set(courses.map(c => c.department).filter(Boolean))];

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter ? c.department === departmentFilter : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* NEW: [My Courses section] */}
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Course Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">View your current enrollments and explore the course catalog.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">My Courses</h2>
          </div>
          
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
            {['Current', 'Upcoming', 'Completed'].map(tab => (
              <button 
                key={tab}
                onClick={() => setMyCoursesTab(tab)}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${myCoursesTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* DYNAMIC: replaces hardcoded value */}
              {myCoursesTab === 'Current' && dynamicMyCourses.current.length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <div className="text-gray-400 mb-2 text-4xl">📚</div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No courses in progress</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your current semester courses will appear here once your plan is approved.</p>
                </div>
              )}
              {myCoursesTab === 'Upcoming' && dynamicMyCourses.upcoming.length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <div className="text-gray-400 mb-2 text-4xl">📅</div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No upcoming courses</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Submit a course plan for a future semester and get it approved to see upcoming courses here.</p>
                </div>
              )}
              {myCoursesTab === 'Completed' && dynamicMyCourses.completed.length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <div className="text-gray-400 mb-2 text-4xl">🎓</div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No completed courses yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Courses you finish will appear here with your final grade.</p>
                </div>
              )}

              {/* DYNAMIC: replaces hardcoded value */}
              {(myCoursesTab === 'Current' ? dynamicMyCourses.current : myCoursesTab === 'Upcoming' ? dynamicMyCourses.upcoming : dynamicMyCourses.completed).map((course, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full 
                      ${course.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                        course.status === 'Upcoming' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}
                    >
                      {course.status} {course.grade && course.grade !== 'N/A' && `• ${course.grade}`}
                    </span>
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{course.credits} cr</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{course.code}</h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1 truncate" title={course.name}>{course.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{course.professor}</p>
                  {course.subLabel && <p className="text-xs italic text-amber-600 dark:text-amber-400 mt-1">{course.subLabel}</p>}
                  
                  {course.progressPercent !== undefined && course.status !== 'Completed' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1 text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{course.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" style={{ width: `${course.progressPercent}%` }}></div>
                      </div>
                    </div>
                  )}
                  {course.percentage !== undefined && course.status === 'Completed' && course.percentage > 0 && (
                     <div className="mt-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                        Final Score: <span className="text-gray-900 dark:text-white">{course.percentage}%</span>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW: [Course Catalog section - updated to Table per instructions] */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Course Catalog</h2>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Search by code or title..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            />
          </div>
          <select 
            value={departmentFilter} 
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {loading && <div className="text-center py-12 dark:text-white">Loading courses...</div>}
        {error && <div className="text-red-500 dark:text-red-400">{error}</div>}

        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Prerequisites</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCourses.map(course => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setSelectedCourse(course._id)}>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{course.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">{course.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{course.credits} cr</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.prerequisites && course.prerequisites.length > 0 ? (
                        <div className="flex gap-2">
                          {course.prerequisites.map(p => {
                            // Find the prereq code safely depending on if it was populated
                            const pCode = typeof p === 'object' ? p.code : p;
                            return (
                              <span key={typeof p === 'object' ? p._id : p} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                                {pCode}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic text-sm">None</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No courses found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Existing Prerequisite Tree Modal */}
        {selectedCourse && (
          <PrerequisiteTree courseId={selectedCourse} onClose={() => setSelectedCourse(null)} />
        )}
      </section>
    </div>
  );
}
