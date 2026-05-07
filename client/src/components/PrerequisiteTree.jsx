import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CourseCard from './CourseCard';

export default function PrerequisiteTree({ courseId, onClose }) {
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchChain = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/prereq-chain`);
        setChain(res.data.chain || []);
      } catch (err) {
        setError('Failed to load prerequisite chain.');
      } finally {
        setLoading(false);
      }
    };
    fetchChain();
  }, [courseId]);

  const completed = new Set(user?.completedCourses?.map(c => typeof c === 'object' ? c._id : c) || []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">Prerequisite Chain</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-xl">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading && <div className="text-center py-8">Loading chain...</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          {!loading && !error && chain.length === 0 && (
            <p className="text-gray-500 text-center">No prerequisites for this course.</p>
          )}

          {!loading && !error && chain.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Courses are listed in topological order (deepest prerequisite first).
                Courses with red borders are missing from your completed courses.
              </p>
              {chain.map((c, idx) => {
                const hasCompleted = completed.has(c._id);
                return (
                  <div key={`${c._id}-${idx}`} className="flex items-center space-x-4">
                    <div className="text-gray-400 font-mono text-sm">{idx + 1}.</div>
                    <div className="flex-1">
                      <CourseCard course={c} hasPrereqs={hasCompleted} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
