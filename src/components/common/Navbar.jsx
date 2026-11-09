import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Search,
  LogOut,
  LogIn,
  User as UserIcon,
  Shield,
  BookOpen,
  GraduationCap,
  Menu,
  UserCheck
} from 'lucide-react';
import { SearchModal } from './SearchModal';
import { InstitutionalLogo } from './InstitutionalLogo';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, profile, isAuthenticated, isAdmin, isTeacher, isGuest, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/');
  };

  // Badge representativo de los 4 roles en el orden y estilo institucional
  const getRoleBadge = () => {
    if (isAdmin) {
      return <span className="badge badge-danger"><Shield size={12} /> Administrador</span>;
    }
    if (isTeacher) {
      return <span className="badge badge-primary"><BookOpen size={12} /> Docente</span>;
    }
    if (isGuest) {
      return <span className="badge badge-neutral" style={{ backgroundColor: '#e2e8f0', color: '#334155' }}><UserCheck size={12} /> Invitado</span>;
    }
    return <span className="badge badge-success"><GraduationCap size={12} /> Estudiante</span>;
  };

  return (
    <>
      <header className="header-nav">
        {/* Izquierda: Menú móvil y Logo institucional */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
            aria-label="Abrir menú de navegación"
          >
            <Menu size={22} />
          </button>

          <InstitutionalLogo
            variant="horizontal"
            size="md"
            to={isAuthenticated ? '/panel' : '/'}
            showSlogan={true}
          />
        </div>

        {/* Derecha: Búsqueda, Notificaciones y Perfil (o Ingreso si es visitante público) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isAuthenticated ? (
            <Link to="/" className="btn btn-primary btn-sm">
              <LogIn size={15} /> Iniciar Sesión / Inicio
            </Link>
          ) : (
            <>
              {/* Búsqueda global (restringida a usuarios con acceso académico) */}
              {!isGuest && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-pill)', padding: '0.45rem 0.9rem' }}
                >
                  <Search size={16} />
                  <span className="hide-below-sm">Buscar...</span>
                </button>
              )}

              {/* Campana de Notificaciones */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn btn-ghost btn-sm"
                  style={{ position: 'relative', padding: '0.5rem', borderRadius: '50%' }}
                  aria-label="Notificaciones del Campus"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      backgroundColor: 'var(--danger-500)',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-surface)',
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Menú desplegable de Notificaciones */}
                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '340px',
                    maxWidth: 'calc(100vw - 24px)',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)',
                    zIndex: 60,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)' }}>
                        Notificaciones
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', color: 'var(--primary-600)' }}
                        >
                          Marcar leídas
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No tenés notificaciones pendientes.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifications(false);
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              borderBottom: '1px solid var(--border-light)',
                              backgroundColor: n.is_read ? 'transparent' : 'var(--primary-50)',
                              cursor: 'pointer',
                              transition: 'background-color var(--trans-fast)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-900)' }}>
                                {n.title}
                              </span>
                              {!n.is_read && (
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-600)' }} />
                              )}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Menú de Usuario */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem' }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}>
                    {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="hide-below-md" style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {profile?.full_name || 'Usuario'}
                    </div>
                    {getRoleBadge()}
                  </div>
                </button>

                {/* Dropdown del Usuario */}
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '240px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)',
                    zIndex: 60,
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)' }}>
                        {profile?.full_name || 'Mi Perfil'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {profile?.email || user?.email}
                      </div>
                      <div style={{ marginTop: '0.4rem' }}>{getRoleBadge()}</div>
                    </div>

                    <div style={{ padding: '0.4rem' }}>
                      <Link
                        to="/perfil"
                        onClick={() => setShowUserMenu(false)}
                        className="btn btn-ghost btn-sm"
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
                      >
                        <UserIcon size={16} /> Mi Perfil y Cuenta
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/usuarios"
                          onClick={() => setShowUserMenu(false)}
                          className="btn btn-ghost btn-sm"
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
                        >
                          <Shield size={16} /> Panel Administrador
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="btn btn-ghost btn-sm"
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', color: 'var(--danger-600)' }}
                      >
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Cuadro de Búsqueda Global */}
      {isAuthenticated && !isGuest && (
        <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
      )}
    </>
  );
};
