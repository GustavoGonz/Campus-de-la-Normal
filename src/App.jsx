import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Páginas Públicas y Callbacks de Autenticación
import { LandingPage } from './pages/public/LandingPage';
import { AuthCallbackPage } from './pages/public/AuthCallbackPage';
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
            {/* Rutas Públicas y Validación de Correo / Contraseña */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Shell del Campus (soporta vistas públicas compartidas y rutas protegidas por rol) */}
            <Route element={<AppLayout />}>
              {/* Módulos de acceso tanto público como autenticado */}
              <Route path="/tutor-ia" element={<AITutorPage />} />
              <Route path="/calendario" element={<CalendarPage />} />

              {/* Panel adaptable según el rol (Estudiante, Docente, Administrador, Invitado) */}
              <Route
                path="/panel"
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
              />

              {/* Perfil del usuario autenticado */}
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Materias Previas (exclusivo para estudiantes, docentes y administradores; restringido a invitados) */}
              <Route
                path="/materias-previas"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                    <PreviousSubjectsPage />
                  </ProtectedRoute>
                }
              />

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
