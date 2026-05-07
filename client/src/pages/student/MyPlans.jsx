import { useState, useEffect } from 'react';
import api from '../../api/axios';
import PlanBuilder from '../../components/PlanBuilder';

export default function MyPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePlan, setActivePlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [activePlan]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      setPlans(res.data.plans);
    } catch (err) {
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.delete(`/plans/${id}`);
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  if (activePlan) {
    return (
      <div className="space-y-6">
        <button onClick={() => setActivePlan(null)} className="text-indigo-600 font-semibold hover:underline mb-4 inline-block">
          &larr; Back to Plans List
        </button>
        <PlanBuilder initialPlan={activePlan} />
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-6">
        <button onClick={() => setIsCreating(false)} className="text-indigo-600 font-semibold hover:underline mb-4 inline-block">
          &larr; Back to Plans List
        </button>
        <PlanBuilder initialPlan={null} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Plans</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Plan
        </button>
      </div>

      {loading && <div className="text-center py-12">Loading plans...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && plans.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 text-gray-500">
          You haven't created any academic plans yet. Click "New Plan" to get started.
        </div>
      )}

      {!loading && !error && plans.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map(plan => (
                <tr key={plan._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-900 cursor-pointer hover:underline" onClick={() => setActivePlan(plan)}>
                    {plan.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                      ${plan.status === 'draft' ? 'bg-gray-100 text-gray-700' : ''}
                      ${plan.status === 'submitted' ? 'bg-blue-100 text-blue-700' : ''}
                      ${plan.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                      ${plan.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setActivePlan(plan)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      {plan.status === 'draft' ? 'Edit' : 'View'}
                    </button>
                    {plan.status === 'draft' && (
                      <button onClick={() => deletePlan(plan._id)} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
