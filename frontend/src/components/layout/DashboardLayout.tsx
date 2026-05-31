import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;
