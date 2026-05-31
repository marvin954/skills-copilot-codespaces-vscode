import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Calculator, Users, LayoutDashboard } from 'lucide-react';

const items = [
  { to: '/search', icon: Search, label: 'Lookup' },
  { to: '/calculator', icon: Calculator, label: 'Deals' },
  { to: '/leads', icon: Users, label: 'Lists' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' }
];

const MobileBottomNav: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
    <div className="grid grid-cols-4">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 text-xs font-medium ${
              isActive ? 'text-brand-600' : 'text-gray-500'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default MobileBottomNav;
