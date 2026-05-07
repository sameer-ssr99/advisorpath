import { useState, useEffect } from 'react';
import api from '../api/axios';
import CourseCard from './CourseCard';
import ValidationAlert from './ValidationAlert';
import { useNavigate } from 'react-router-dom';

export default function PlanBuilder({ initialPlan }) {
  const [title, setTitle] = useState(initialPlan?.title || 'New Plan');
  const [semesters, setSemesters] = useState(initialPlan?.semesters || [{ name: 'Semester 1', courses: [], totalCredits: 0 }]);
  const [allCourses, setAllCourses] = useState([]);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeSemesterIndex, setActiveSemesterIndex] = useState(0);
  const [courseSearch, setCourseSearch] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setAllCourses(res.data.courses);
      } catch (err) {
        setError('Failed to fetch catalog.');
      }
    };
    fetchCourses();
  }, []);

  const addSemester = () => {
    setSemesters([...semesters, { name: `Semester ${semesters.length + 1}`, courses: [], totalCredits: 0 }]);
  };

  const removeSemester = (idx) => {
    if (semesters.length <= 1) return;
    const newSems = semesters.filter((_, i) => i !== idx);
    setSemesters(newSems);
    if (activeSemesterIndex >= newSems.length) setActiveSemesterIndex(newSems.length - 1);
  };

  const addCourseToSemester = (course) => {
    const newSems = [...semesters];
    newSems[activeSemesterIndex].courses.push(course);
    newSems[activeSemesterIndex].totalCredits += course.credits;
    setSemesters(newSems);
    setValidation(null);
  };

  const removeCourseFromSemester = (semIdx, courseIdx) => {
    const newSems = [...semesters];
    const removedCourse = newSems[semIdx].courses[courseIdx];
    newSems[semIdx].courses.splice(courseIdx, 1);
    newSems[semIdx].totalCredits -= removedCourse.credits;
    setSemesters(newSems);
    setValidation(null);
  };

  const validatePlan = async () => {
    if (!initialPlan?._id) return;
    setLoading(true);
    try {
      await savePlan();
      const res = await api.post(`/plans/${initialPlan._id}/validate`);
      setValidation(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title,
        semesters: semesters.map(s => ({
          name: s.name,
          courses: s.courses.map(c => c._id)
        }))
      };
      
      let savedPlan;
      if (initialPlan?._id) {
        const res = await api.put(`/plans/${initialPlan._id}`, payload);
        savedPlan = res.data.plan;
      } else {
        const res = await api.post('/plans', payload);
        savedPlan = res.data.plan;
        // Redirect to edit mode once created
        navigate('/student/plans'); // For simplicity, go back to plans list, or could stay here
      }
      return savedPlan;
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const submitPlan = async () => {
    if (!initialPlan?._id) return;
    setLoading(true);
    try {
      await savePlan();
      await api.post(`/plans/${initialPlan._id}/submit`);
      navigate('/student/plans');
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  const isDraftOrRejected = !initialPlan || initialPlan.status === 'draft' || initialPlan.status === 'rejected';

  const filteredCourses = allCourses.filter(c => 
    c.name.toLowerCase().includes(courseSearch.toLowerCase()) || 
    c.code.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Left Col: Builder */}
      <div className="col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            disabled={!isDraftOrRejected}
            className="text-2xl font-bold border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none w-full bg-transparent px-2 py-1"
          />
        </div>

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <ValidationAlert validation={validation} />

        <div className="space-y-4">
          {semesters.map((sem, sIdx) => (
            <div key={sIdx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <input 
                  type="text" 
                  value={sem.name}
                  onChange={e => {
                    const newSems = [...semesters];
                    newSems[sIdx].name = e.target.value;
                    setSemesters(newSems);
                  }}
                  disabled={!isDraftOrRejected}
                  className="font-semibold text-lg focus:outline-none border-b border-gray-200"
                />
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${sem.totalCredits > 18 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {sem.totalCredits} cr
                  </span>
                  {isDraftOrRejected && semesters.length > 1 && (
                    <button onClick={() => removeSemester(sIdx)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {sem.courses.map((course, cIdx) => (
                  <div key={`${course._id}-${cIdx}`} className="relative group">
                    <CourseCard course={course} />
                    {isDraftOrRejected && (
                      <button 
                        onClick={() => removeCourseFromSemester(sIdx, cIdx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {isDraftOrRejected && (
          <button 
            onClick={addSemester}
            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-colors"
          >
            + Add Semester
          </button>
        )}
      </div>

      {/* Right Col: Course Catalog & Actions */}
      <div className="col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 sticky top-8">
          <h3 className="font-bold text-lg text-gray-800">Actions</h3>
          {isDraftOrRejected && (
            <>
              <button 
                onClick={savePlan} disabled={saving}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors flex justify-center items-center"
              >
                {saving ? <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"></div> : 'Save Draft'}
              </button>
              
              {initialPlan?._id && (
                <button 
                  onClick={validatePlan} disabled={loading}
                  className="w-full py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                >
                  Validate Plan
                </button>
              )}

              {initialPlan?._id && (
                <button 
                  onClick={submitPlan} disabled={loading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Submit for Review
                </button>
              )}
            </>
          )}

          {!isDraftOrRejected && (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
              This plan is <strong>{initialPlan.status}</strong> and cannot be edited.
            </div>
          )}

          {isDraftOrRejected && (
            <div className="pt-6 border-t mt-6">
              <h3 className="font-bold text-gray-800 mb-4">Add Courses</h3>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Select Semester to Add to:</label>
                <select 
                  value={activeSemesterIndex} 
                  onChange={e => setActiveSemesterIndex(Number(e.target.value))}
                  className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none border"
                >
                  {semesters.map((s, i) => (
                    <option key={i} value={i}>{s.name}</option>
                  ))}
                </select>
              </div>

              <input 
                type="text" 
                placeholder="Search courses..." 
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none border mb-4"
              />

              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {filteredCourses.map(c => (
                  <div key={c._id} className="relative group">
                    <CourseCard course={c} />
                    <button 
                      onClick={() => addCourseToSemester(c)}
                      className="absolute inset-0 bg-indigo-600/90 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
