import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, coursesRes, plansRes] = await Promise.all([
          api.get('/users'),
          api.get('/courses'),
          api.get('/plans')
        ]);
        
        const users = usersRes.data.users;
        const plans = plansRes.data.plans;
        
        setStats({
          totalUsers: users.length,
          students: users.filter(u => u.role === 'student').length,
          advisors: users.filter(u => u.role === 'advisor').length,
          totalCourses: coursesRes.data.courses.length,
          totalPlans: plans.length,
          approvedPlans: plans.filter(p => p.status === 'approved').length
        });
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-12">Loading stats...</div>;
  if (!stats) return <div className="text-center py-12 text-red-500">Failed to load statistics.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-semibold mb-1">Total Users</div>
          <div className="text-4xl font-bold text-indigo-900">{stats.totalUsers}</div>
          <div className="mt-2 text-sm text-gray-500">{stats.students} Students • {stats.advisors} Advisors</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-semibold mb-1">Total Courses</div>
          <div className="text-4xl font-bold text-blue-600">{stats.totalCourses}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-semibold mb-1">Plans Managed</div>
          <div className="text-4xl font-bold text-green-600">{stats.totalPlans}</div>
          <div className="mt-2 text-sm text-gray-500">{stats.approvedPlans} Approved</div>
        </div>
      </div>
    </div>
  );
}
