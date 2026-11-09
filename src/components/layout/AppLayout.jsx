import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar - responsive desktop visible, mobile toggle */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'is-open' : ''}`}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
