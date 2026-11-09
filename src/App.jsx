import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Páginas Públicas
import { LandingPage } from './pages/public/LandingPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';

// Enrutador de Dashboard y Roles
import { DashboardRouter } from './pages/dashboard/DashboardRouter';

// Páginas Docentes
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { SubjectWorkspace } from './pages/teacher/SubjectWorkspace';

// Páginas Estudiantiles
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentSubjectView } from './pages/student/StudentSubjectView';
import { StudentLibraryPage } from './pages/student/StudentLibraryPage';

// Módulos Pedagógicos Compartidos
import { AITutorPage } from './pages/ai/AITutorPage';
import { PreviousSubjectsPage } from './pages/previousSubjects/PreviousSubjectsPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { AdminPanel } from './pages/admin/AdminPanel';
import { ProfilePage } from './pages/profile/ProfilePage';

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Rutas Protegidas del Campus */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Panel adaptable según el rol (Estudiante, Docente, Administrador, Invitado) */}
              <Route path="/panel" element={<DashboardRouter />} />

              {/* Rutas Docentes */}
              <Route
                path="/profesor/materias"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profesor/materia/:id"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <SubjectWorkspace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profesor/biblioteca"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profesor/clases"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Rutas Estudiantiles */}
              <Route
                path="/estudiante/materias"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/estudiante/materia/:id"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentSubjectView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/estudiante/biblioteca"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentLibraryPage />
                  </ProtectedRoute>
                }
              />

              {/* Módulos Compartidos */}
              <Route path="/tutor-ia" element={<AITutorPage />} />
              <Route path="/materias-previas" element={<PreviousSubjectsPage />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/perfil" element={<ProfilePage />} />

              {/* Panel de Administración */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
