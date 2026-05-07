import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPlans, setUserPlans] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const viewUserDetails = async (userId) => {
    setModalLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setSelectedUser(res.data.user);
      setUserPlans(res.data.plans);
    } catch (err) {
      alert('Failed to fetch user details');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>

      {loading && <div className="text-center py-12">Loading users...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="border-gray-300 rounded outline-none border px-2 py-1 bg-white text-sm"
                    >
                      <option value="student">Student</option>
                      <option value="advisor">Advisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => viewUserDetails(user._id)} className="text-indigo-600 hover:text-indigo-900">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-800 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedUser.role}</p>
                </div>
              </div>

              <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Academic Plans ({userPlans.length})</h3>
              {userPlans.length === 0 ? (
                <p className="text-gray-500 text-sm">No plans created.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {userPlans.map(p => (
                    <li key={p._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                      <span className="font-semibold text-indigo-900">{p.title}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
