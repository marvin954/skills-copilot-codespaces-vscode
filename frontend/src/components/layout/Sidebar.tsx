import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Users,
  Calculator,
  Home,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/search', icon: Search, label: 'Lookup' },
  { to: '/calculator', icon: Calculator, label: 'Deal Calculator' },
  { to: '/leads', icon: Users, label: 'Lead Lists' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-64 flex-col bg-brand-900 text-white">
      <div className="flex items-center gap-3 border-b border-brand-800 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
          <Home className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">Parcel Research</h1>
          <p className="text-xs text-brand-200">Investor Lookup</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-100 hover:bg-brand-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-brand-800 p-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-brand-300">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-brand-200 transition-colors hover:bg-brand-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
