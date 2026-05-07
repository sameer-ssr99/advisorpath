import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        setPlans(res.data.plans);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  const totalPlans = plans.length;
  const approvedPlans = plans.filter(p => p.status === 'approved').length;
  const pendingPlans = plans.filter(p => p.status === 'submitted').length;
  const draftPlans = plans.filter(p => p.status === 'draft').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Here's an overview of your academic plans.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-semibold mb-1">Total Plans</div>
          <div className="text-3xl font-bold text-indigo-900">{totalPlans}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-semibold mb-1">Approved</div>
          <div className="text-3xl font-bold text-green-600">{approvedPlans}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-semibold mb-1">Pending Review</div>
          <div className="text-3xl font-bold text-blue-600">{pendingPlans}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-semibold mb-1">Drafts</div>
          <div className="text-3xl font-bold text-gray-600">{draftPlans}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Recent Plans</h2>
          <Link to="/student/plans" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View All &rarr;</Link>
        </div>
        
        {plans.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No plans created yet. <Link to="/student/plans" className="text-indigo-600 underline">Create one now</Link>.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.slice(0, 5).map(plan => (
                <tr key={plan._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{plan.title}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
