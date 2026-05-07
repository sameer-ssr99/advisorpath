import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  User, 
  Settings, 
  Users, 
  BookMarked,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function Sidebar({ isCollapsed, toggleCollapse }) {
  const { role } = useAuth();

  const links = {
    student: [
      { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/student/catalog', label: 'Course Planning', icon: BookOpen },
      { path: '/student/plans', label: 'My Plans', icon: BookMarked },
      { path: '/student/marks', label: 'My Marks', icon: Award },
      { path: '/student/progress', label: 'Academic Progress', icon: TrendingUp },
      { path: '/student/sessions', label: 'Advising Sessions', icon: Calendar },
      { path: '/student/messages', label: 'Messages', icon: MessageSquare },
      { path: '/student/profile', label: 'Profile', icon: User }
    ],
    advisor: [
      { path: '/advisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/advisor/sessions', label: 'Advising Sessions', icon: Calendar },
      { path: '/advisor/messages', label: 'Messages', icon: MessageSquare }
    ],
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/courses', label: 'Manage Courses', icon: BookOpen },
      { path: '/admin/users', label: 'Manage Users', icon: Users }
    ]
  };

  const navLinks = links[role] || [];

  return (
    <div className={`fixed left-0 top-0 h-full bg-indigo-900 text-white pt-8 px-4 transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-indigo-700">
        {!isCollapsed && <h2 className="text-2xl font-bold text-indigo-100 whitespace-nowrap overflow-hidden">AdvisorPath</h2>}
        {isCollapsed && <h2 className="text-2xl font-bold text-indigo-100 mx-auto">AP</h2>}
        <button 
          onClick={toggleCollapse} 
          className={`text-indigo-200 hover:text-white bg-indigo-800 hover:bg-indigo-700 p-1 rounded ${isCollapsed ? 'hidden' : 'block'}`}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {isCollapsed && (
        <div className="flex justify-center mb-6">
          <button 
            onClick={toggleCollapse} 
            className="text-indigo-200 hover:text-white bg-indigo-800 hover:bg-indigo-700 p-1 rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <nav className="space-y-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              title={isCollapsed ? link.label : ''}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'space-x-3'}`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
