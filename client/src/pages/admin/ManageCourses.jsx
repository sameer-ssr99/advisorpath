import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // for prereq selection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '', name: '', credits: 3, department: '', description: '', prerequisites: []
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data.courses);
      setAllCourses(res.data.courses);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        code: course.code,
        name: course.name,
        credits: course.credits,
        department: course.department || '',
        description: course.description || '',
        prerequisites: course.prerequisites.map(p => p._id)
      });
    } else {
      setEditingCourse(null);
      setFormData({
        code: '', name: '', credits: 3, department: '', description: '', prerequisites: []
      });
    }
    setIsModalOpen(true);
  };

  const handlePrereqChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    setFormData({ ...formData, prerequisites: options.map(o => o.value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse._id}`, formData);
      } else {
        await api.post('/courses', formData);
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to disable this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Courses</h1>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Course
        </button>
      </div>

      {loading && <div className="text-center py-12">Loading courses...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map(course => (
                <tr key={course._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{course.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{course.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{course.credits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{course.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(course)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(course._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" min="1" max="6" required value={formData.credits} onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites (Multi-select)</label>
                <select multiple value={formData.prerequisites} onChange={handlePrereqChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500 h-32">
                  {allCourses.filter(c => c._id !== editingCourse?._id).map(c => (
                    <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
