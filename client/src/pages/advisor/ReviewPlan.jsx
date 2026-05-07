import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CourseCard from '../../components/CourseCard';
import ValidationAlert from '../../components/ValidationAlert';

export default function ReviewPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [advisorNote, setAdvisorNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAndValidate = async () => {
      try {
        const [planRes, valRes] = await Promise.all([
          api.get(`/plans/${id}`),
          api.post(`/plans/${id}/validate`)
        ]);
        setPlan(planRes.data.plan);
        setValidation(valRes.data);
      } catch (err) {
        setError('Failed to load plan details');
      } finally {
        setLoading(false);
      }
    };
    fetchAndValidate();
  }, [id]);

  const handleAction = async (status) => {
    if (status === 'reject' && !advisorNote.trim()) {
      alert('A note is required to reject a plan.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/plans/${id}/${status}`, { advisorNote });
      navigate('/advisor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} plan`);
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading plan...</div>;
  if (!plan) return <div className="text-red-500 p-4">Plan not found</div>;

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-6">
        <button onClick={() => navigate('/advisor/dashboard')} className="text-indigo-600 font-semibold hover:underline">&larr; Back to Dashboard</button>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">{plan.title}</h1>
          <p className="text-gray-600 mt-1">Student: <span className="font-semibold text-gray-800">{plan.student?.name} ({plan.student?.email})</span></p>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <ValidationAlert validation={validation} />

        <div className="space-y-4">
          {plan.semesters.map((sem, sIdx) => (
            <div key={sIdx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">{sem.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sem.totalCredits > 18 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                  {sem.totalCredits} cr
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {sem.courses.map((course, cIdx) => (
                  <CourseCard key={cIdx} course={course} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-1 space-y-6 mt-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 sticky top-8">
          <h3 className="font-bold text-lg text-gray-800">Review Actions</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Advisor Note (Required for Reject)</label>
            <textarea 
              value={advisorNote} 
              onChange={e => setAdvisorNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
              rows={4}
              placeholder="Provide feedback..."
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => handleAction('approve')} 
              disabled={actionLoading}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Approve
            </button>
            <button 
              onClick={() => handleAction('reject')} 
              disabled={actionLoading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
