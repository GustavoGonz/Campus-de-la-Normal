import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboard } from '../student/StudentDashboard';
import { TeacherDashboard } from '../teacher/TeacherDashboard';
import { AdminPanel } from '../admin/AdminPanel';
import { GuestDashboard } from '../guest/GuestDashboard';

export const DashboardRouter = () => {
  const { isAdmin, isTeacher, isGuest } = useAuth();

  if (isAdmin) {
    return <AdminPanel />;
  }

  if (isTeacher) {
    return <TeacherDashboard />;
  }

  if (isGuest) {
    return <GuestDashboard />;
  }

  return <StudentDashboard />;
};
