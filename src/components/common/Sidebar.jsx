import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderArchive,
  Calendar,
  Sparkles,
  BookmarkCheck,
  Users,
  X,
  UserCheck
} from 'lucide-react';
import { InstitutionalLogo } from './InstitutionalLogo';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, isAdmin, isTeacher, isGuest, isStudent } = useAuth();

  const teacherLinks = [
    { to: '/panel', label: 'Inicio (Tutor IA)', icon: LayoutDashboard },
    { to: '/tutor-ia', label: 'Tutor Pedagógico', icon: Sparkles },
    { to: '/profesor/biblioteca', label: 'Biblioteca Digital', icon: FolderArchive },
    { to: '/profesor/materias', label: 'Mis Cátedras', icon: BookOpen },
    { to: '/profesor/clases', label: 'Clases y Cronograma', icon: Calendar },
    { to: '/materias-previas', label: 'Materias Previas', icon: BookmarkCheck },
    { to: '/calendario', label: 'Calendario Escolar', icon: Calendar },
  ];

  const studentLinks = [
    { to: '/panel', label: 'Inicio (Tutor IA)', icon: LayoutDashboard },
    { to: '/tutor-ia', label: 'Tutor Pedagógico', icon: Sparkles },
    { to: '/estudiante/biblioteca', label: 'Biblioteca Digital', icon: FolderArchive },
    { to: '/estudiante/materias', label: 'Mis Materias', icon: BookOpen },
    { to: '/materias-previas', label: 'Materias Previas', icon: BookmarkCheck },
    { to: '/calendario', label: 'Calendario Escolar', icon: Calendar },
  ];

  const adminLinks = [
    { to: '/panel', label: 'Inicio (Tutor IA)', icon: LayoutDashboard },
    { to: '/tutor-ia', label: 'Tutor Pedagógico', icon: Sparkles },
    { to: '/admin/usuarios', label: 'Gestión de Usuarios', icon: Users },
    { to: '/admin/materias', label: 'Materias y Cursos', icon: BookOpen },
    { to: '/profesor/biblioteca', label: 'Control de Biblioteca', icon: FolderArchive },
    { to: '/materias-previas', label: 'Materias Previas', icon: BookmarkCheck },
    { to: '/calendario', label: 'Calendario Escolar', icon: Calendar },
  ];

  const guestLinks = [
    { to: '/panel', label: 'Inicio (Tutor IA)', icon: LayoutDashboard },
    { to: '/tutor-ia', label: 'Tutor IA Público', icon: Sparkles },
    { to: '/calendario', label: 'Calendario Escolar', icon: Calendar },
  ];

  const links = isAdmin 
    ? adminLinks 
    : isTeacher 
    ? teacherLinks 
    : isGuest 
    ? guestLinks 
    : studentLinks;

  const roleText = isAdmin 
    ? 'Administrativa' 
    : isTeacher 
    ? 'Docente' 
    : isGuest 
    ? 'Invitado' 
    : 'Estudiantil';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 45,
            display: 'block',
          }}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'transform var(--trans-base)',
          transform: isOpen ? 'translateX(0)' : undefined,
          flexShrink: 0,
        }}
      >
        {/* Cabecera institucional del Sidebar */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <InstitutionalLogo
            variant="horizontal"
            size="sm"
            showSlogan={false}
            to="/panel"
          />
          {onClose && (
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Elementos de Navegación */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 0.75rem 0.5rem',
          }}>
            Navegación {roleText}
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0, padding: 0 }}>
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024 && onClose) onClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.875rem',
                      color: isActive ? 'var(--primary-800)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all var(--trans-fast)',
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pie con identidad de la escuela */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-muted)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Escuela Normal Superior
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--brand-orange, #ff7b15)', fontWeight: 600 }}>
            «Aprender mejor, juntos»
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            La Rioja, Argentina • Ciclo 2026
          </div>
        </div>
      </aside>
    </>
  );
};
