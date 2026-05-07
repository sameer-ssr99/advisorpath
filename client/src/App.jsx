import { Navigate, Route, Routes, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import CourseCatalog from './pages/student/CourseCatalog';
import MyPlans from './pages/student/MyPlans';
import AdvisorDashboard from './pages/advisor/AdvisorDashboard';
import ReviewPlan from './pages/advisor/ReviewPlan';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourses from './pages/admin/ManageCourses';
import ManageUsers from './pages/admin/ManageUsers';
import AcademicProgress from './pages/student/AcademicProgress';
import AdvisingSessions from './pages/student/AdvisingSessions';
import MessagesPage from './pages/student/MessagesPage';
import StudentProfile from './pages/student/StudentProfile';
import MyMarks from './pages/student/MyMarks';
import StudentMarksDetail from './pages/advisor/StudentMarksDetail';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useState } from 'react';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

const RoleRoute = ({ role, children }) => {
  const { role: currentRole, loading } = useAuth();
  if (loading) return null;
  if (currentRole !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRedirect = () => {
  const { role } = useAuth();
  if (role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (role === 'advisor') return <Navigate to="/advisor/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

import AIChatWidget from './components/ai/AIChatWidget';

const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { role } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex dark:bg-gray-900 transition-colors">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Navbar />
        <main className="p-8 flex-1 overflow-x-hidden"><Outlet /></main>
      </div>
      {role === 'student' && <AIChatWidget />}
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />

      <Route path="/student/*" element={<PrivateRoute><RoleRoute role="student"><Layout /></RoleRoute></PrivateRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="catalog" element={<CourseCatalog />} />
        <Route path="plans" element={<MyPlans />} />
        <Route path="marks" element={<MyMarks />} />
        <Route path="progress" element={<AcademicProgress />} />
        <Route path="sessions" element={<AdvisingSessions />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="/advisor/*" element={<PrivateRoute><RoleRoute role="advisor"><Layout /></RoleRoute></PrivateRoute>}>
        <Route path="dashboard" element={<AdvisorDashboard />} />
        <Route path="plans/:id" element={<ReviewPlan />} />
        <Route path="students/:studentId/marks" element={<StudentMarksDetail />} />
        <Route path="sessions" element={<AdvisingSessions />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="/admin/*" element={<PrivateRoute><RoleRoute role="admin"><Layout /></RoleRoute></PrivateRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
