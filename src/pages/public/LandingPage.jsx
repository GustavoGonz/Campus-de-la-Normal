import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AITutorPage } from '../ai/AITutorPage';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  FolderArchive,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Mail,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';

export const LandingPage = () => {
  const {
    isAuthenticated,
    signIn,
    signUp,
    resendConfirmationEmail,
    verifyAuthCallback,
    quickLoginByRole,
    resetPassword,
  } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados de modales de autenticación
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | 'forgot' | 'confirm_sent'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
  });
  const [loading, setLoading] = useState(false);
  const [quickRoleLoading, setQuickRoleLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState('');

  // Si llegan parámetros de confirmación de correo o recuperación al dominio raíz, procesarlos
  useEffect(() => {
    const hasCallbackTokens =
      location.search.includes('code=') ||
      location.search.includes('token_hash=') ||
      window.location.hash.includes('access_token=') ||
      window.location.hash.includes('error_description=');

    if (!hasCallbackTokens) return;

    let active = true;
    const handleRootCallback = async () => {
      const res = await verifyAuthCallback(location.search, window.location.hash);
      if (!active) return;

      if (res.success) {
        if (res.type === 'recovery') {
          navigate('/reset-password', { replace: true });
        } else {
          showToast('¡Correo electrónico verificado! Sesión iniciada.', 'success');
          navigate('/panel', { replace: true });
        }
      } else if (res.error) {
        setErrorMsg(res.error);
        setAuthModal('login');
      }
    };

    handleRootCallback();
    return () => {
      active = false;
    };
  }, [location.search, navigate, showToast, verifyAuthCallback]);

  // Redirección automática al panel cuando el usuario ya tiene sesión confirmada
  // (excepto si viene con flujo de recuperación de contraseña)
  useEffect(() => {
    const isRecoveryHash =
      window.location.hash.includes('type=recovery') ||
      location.search.includes('type=recovery');
    if (isRecoveryHash) {
      navigate(`/reset-password${location.search}${window.location.hash}`, { replace: true });
      return;
    }

    if (isAuthenticated) {
      navigate('/panel', { replace: true });
    }
  }, [isAuthenticated, location.search, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  // Inicio de sesión con correo electrónico y contraseña
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await signIn(formData.email, formData.password);
    setLoading(false);

    if (res.success) {
      showToast('¡Bienvenido/a a Campus: La Normal!', 'success');
      navigate('/panel');
    } else {
      setErrorMsg(res.error || 'Credenciales incorrectas.');
    }
  };

  // Registro de nuevo usuario con confirmación de correo apuntando a producción
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const requestedRole = formData.role === 'guest' ? 'guest' : 'student';
    const res = await signUp(formData.email, formData.password, formData.fullName, requestedRole);
    setLoading(false);

    if (res.success) {
      if (res.confirmed) {
        showToast('¡Cuenta creada e iniciada con éxito!', 'success');
        setAuthModal(null);
        navigate('/panel');
      } else {
        setPendingConfirmEmail(formData.email.trim().toLowerCase());
        setAuthModal('confirm_sent');
        showToast('Revisá tu correo electrónico para confirmar tu cuenta.', 'info');
      }
    } else {
      setErrorMsg(res.error || 'No se pudo crear la cuenta.');
    }
  };

  // Reenviar enlace de validación de correo
  const handleResendConfirmation = async () => {
    if (!pendingConfirmEmail) return;
    setLoading(true);
    const res = await resendConfirmationEmail(pendingConfirmEmail);
    setLoading(false);
    if (res.success) {
      showToast('Se envió un nuevo enlace de confirmación a tu correo.', 'success');
    } else {
      setErrorMsg(res.error || 'No se pudo reenviar el correo de confirmación.');
    }
  };

  // Recuperación de contraseña
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await resetPassword(formData.email);
    setLoading(false);

    if (res.success) {
      showToast('Si el correo está registrado, recibirás el enlace para restablecer tu contraseña.', 'info');
      setAuthModal(null);
    } else {
      setErrorMsg(res.error || 'Error al solicitar recuperación de contraseña.');
    }
  };

  // Acceso rápido directo por rol (Estudiante, Docente, Administrador, Invitado)
  const handleQuickRoleAccess = async (roleKey) => {
    if (quickRoleLoading) return;
    setQuickRoleLoading(roleKey);
    setErrorMsg('');

    const roleNames = {
      student: 'Estudiante',
      teacher: 'Docente',
      admin: 'Administrador',
      guest: 'Invitado',
    };

    const res = await quickLoginByRole(roleKey);
    setQuickRoleLoading(null);

    if (res.success) {
      setAuthModal(null);
      showToast(`Acceso rápido iniciado como ${roleNames[roleKey] || roleKey}.`, 'success');
      navigate('/panel');
    } else {
      showToast(res.error || 'No se pudo iniciar el acceso rápido.', 'error');
    }
  };

  const quickAccessItems = [
    {
      role: 'student',
      number: '1',
      label: 'Estudiante',
      icon: GraduationCap,
      color: 'var(--success-700, #15803d)',
      bg: '#dcfce7',
      border: '#86efac',
      description: 'Consulta al Tutor IA, accede a materias matriculadas, visualiza y descarga cuadernillos oficiales.',
    },
    {
      role: 'teacher',
      number: '2',
      label: 'Docente',
      icon: BookOpen,
      color: 'var(--primary-800, #1e40af)',
      bg: '#dbeafe',
      border: '#93c5fd',
      description: 'Carga y actualiza sus propios documentos PDF, planifica clases y gestiona solicitudes de alumnos.',
    },
    {
      role: 'admin',
      number: '3',
      label: 'Administrador',
      icon: ShieldCheck,
      color: 'var(--danger-700, #b91c1c)',
      bg: '#fee2e2',
      border: '#fca5a5',
      description: 'Gestiona usuarios, asigna roles, autoriza docentes y supervisa cursos y materias del campus.',
    },
    {
      role: 'guest',
      number: '4',
      label: 'Invitado',
      icon: UserCheck,
      color: '#334155',
      bg: '#f1f5f9',
      border: '#cbd5e1',
      description: 'Acceso a información pública, calendario escolar y consultas al Tutor IA con fuentes autorizadas.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* Cabecera Pública */}
      <header
        style={{
          height: '72px',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <InstitutionalLogo variant="horizontal" size="md" showSlogan={true} showSubtitle={true} to="/" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => {
              setAuthModal('login');
              setErrorMsg('');
            }}
            className="btn btn-secondary"
            aria-label="Iniciar Sesión en el Campus"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setAuthModal('register');
              setErrorMsg('');
            }}
            className="btn btn-primary"
            aria-label="Crear Cuenta en el Campus"
          >
            Crear Cuenta
          </button>
        </div>
      </header>

      {/* Hero Principal con el Tutor IA Unificado y Accesos Rápidos por Rol */}
      <section
        style={{
          padding: '2.25rem 1rem 3rem',
          background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ maxWidth: '1020px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.4rem 1.1rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--primary-200, #c7d2fe)',
              color: 'var(--brand-blue, #0c13a8)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '1.1rem',
              boxShadow: '0 2px 8px rgba(12, 19, 168, 0.08)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-orange, #ff7b15)',
              }}
            />
            <span>Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros • La Rioja • Ciclo 2026</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)',
              color: 'var(--primary-900)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '0.35rem',
              letterSpacing: '-0.02em',
            }}
          >
            Campus: <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>La Normal</span>
          </h1>

          <div
            style={{
              fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)',
              color: 'var(--brand-blue, #0c13a8)',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              marginBottom: '0.85rem',
            }}
          >
            «Aprender mejor, juntos»
          </div>

          <p
            style={{
              fontSize: '1.02rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              maxWidth: '680px',
              margin: '0 auto 1.5rem',
            }}
          >
            Asistente pedagógico inteligente y biblioteca digital institucional. Respuestas claras fundamentadas en las{' '}
            <strong>planificaciones docentes y cuadernillos educativos reales</strong> de la institución.
          </p>

          {/* Barra de Accesos Rápidos por Rol (Estudiante, Docente, Administrador, Invitado) */}
          <div
            style={{
              maxWidth: '960px',
              margin: '0 auto 1.75rem',
              padding: '0.9rem 1.25rem',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-900)' }}>
              <Zap size={16} color="var(--brand-orange, #ff7b15)" />
              <span>Accesos Rápidos por Rol:</span>
            </div>

            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                const isThisLoading = quickRoleLoading === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    disabled={Boolean(quickRoleLoading)}
                    onClick={() => handleQuickRoleAccess(item.role)}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: item.bg,
                      color: item.color,
                      border: `1px solid ${item.border}`,
                      fontWeight: 700,
                      borderRadius: 'var(--radius-pill)',
                      padding: '0.42rem 0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: quickRoleLoading ? 'wait' : 'pointer',
                    }}
                    aria-label={`Ingreso rápido como ${item.label}`}
                  >
                    <Icon size={15} />
                    <span>{isThisLoading ? 'Ingresando...' : item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COMPONENTE ÚNICO Y UNIFICADO DEL TUTOR IA */}
          <AITutorPage embedded={true} />
        </div>
      </section>

      {/* Sección de Herramientas Complementarias */}
      <section style={{ padding: '3.25rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-900)', fontWeight: 800 }}>
              Herramientas Educativas de la Plataforma
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Servicios institucionales integrados para acompañar la trayectoria académica en la Escuela Normal.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#e0e7ff',
                    color: 'var(--brand-blue, #0c13a8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <FolderArchive size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Biblioteca de Materiales
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Almacenamiento y consulta de documentos oficiales en PDF organizados por materia, curso, división y unidad.
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthModal('login');
                  setErrorMsg('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1.25rem', alignSelf: 'flex-start' }}
              >
                Consultar Biblioteca <ArrowRight size={14} />
              </button>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Materias Autorizadas
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Acceso a las materias correspondientes según el rol de cada usuario (Estudiante, Docente o Administrador), con programas y cronogramas.
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthModal('login');
                  setErrorMsg('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1.25rem', alignSelf: 'flex-start' }}
              >
                Ver Mis Materias <ArrowRight size={14} />
              </button>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffedd5',
                    color: '#c2410c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Calendar size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Calendario Institucional
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Cronograma del ciclo lectivo 2026, turnos de exámenes de materias previas y libres, recesos escolares y efemérides riojanas.
                </p>
              </div>
              <Link
                to="/calendario"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1.25rem', alignSelf: 'flex-start', textDecoration: 'none' }}
              >
                Ver Calendario <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Tarjetas Interactivas de los 4 Roles con Acceso Rápido Directo */}
          <div
            style={{
              marginTop: '3rem',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--primary-900)',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}
            >
              Organización de Roles y Accesos Rápidos Institucionales
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '1rem' }}>
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                const isThisLoading = quickRoleLoading === item.role;
                return (
                  <div
                    key={item.role}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: item.color, fontWeight: 700, fontSize: '0.95rem' }}>
                        <Icon size={18} /> {item.number}. {item.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                        {item.description}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(quickRoleLoading)}
                      onClick={() => handleQuickRoleAccess(item.role)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                    >
                      {isThisLoading ? 'Abriendo panel...' : `Ingresar como ${item.label}`} <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pie de Página */}
      <footer
        style={{
          marginTop: 'auto',
          backgroundColor: '#0f172a',
          color: '#94a3b8',
          padding: '2.5rem 1.5rem',
          borderTop: '1px solid #1e293b',
        }}
      >
        <div
          style={{
            maxWidth: '1020px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Campus: <span style={{ color: '#ff7b15' }}>La Normal</span>
            </div>
            <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
              «Aprender mejor, juntos» • Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
              La Rioja, República Argentina • Sistema Educativo Provincial
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
            <Link to="/calendario" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              Calendario Escolar
            </Link>
            <Link to="/tutor-ia" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              Tutor IA
            </Link>
            <button
              onClick={() => {
                setAuthModal('login');
                setErrorMsg('');
              }}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}
            >
              Acceso Institucional
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL 1: INICIAR SESIÓN (ÚNICAMENTE CORREO ELECTRÓNICO Y CONTRASEÑA) */}
      {authModal === 'login' && (
        <Modal title="Iniciar Sesión en el Campus" isOpen={true} onClose={() => setAuthModal(null)} maxWidth="450px">
          <div style={{ marginBottom: '0.5rem' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="login-email">
                  Correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="usuario@correo.com"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Mail
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="login-password">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModal('forgot');
                      setErrorMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-blue)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Lock
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                {loading ? 'Verificando credenciales...' : 'Ingresar al Campus'}
              </button>
            </form>

            {/* Accesos rápidos desde el modal de inicio de sesión */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.55rem', textAlign: 'center' }}>
                Acceso rápido por rol:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem' }}>
                {quickAccessItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      disabled={Boolean(quickRoleLoading)}
                      onClick={() => handleQuickRoleAccess(item.role)}
                      className="btn btn-secondary btn-sm"
                      style={{ justifyContent: 'center', fontSize: '0.78rem' }}
                    >
                      <Icon size={13} />
                      <span>{quickRoleLoading === item.role ? 'Ingresando...' : item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ¿Todavía no tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModal('register');
                  setErrorMsg('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Crear una cuenta
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CREAR CUENTA INSTITUCIONAL (CORREO ELECTRÓNICO Y CONTRASEÑA) */}
      {authModal === 'register' && (
        <Modal title="Crear Cuenta en Campus: La Normal" isOpen={true} onClose={() => setAuthModal(null)} maxWidth="460px">
          <div style={{ marginBottom: '0.5rem' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" htmlFor="register-fullname">
                  Nombre Completo y Apellido
                </label>
                <input
                  id="register-fullname"
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Ej: Lucía Ramos"
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" htmlFor="register-email">
                  Correo electrónico
                </label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="estudiante@correo.com"
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" htmlFor="register-password">
                  Contraseña (Mínimo 6 caracteres)
                </label>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="register-role">
                  Rol Inicial Solicitado
                </label>
                <select
                  id="register-role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="student">Estudiante (Acceso a materias y Tutor IA)</option>
                  <option value="guest">Invitado (Acceso público y calendario)</option>
                </select>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  * Por seguridad, los roles de <strong>Docente</strong> y <strong>Administrador</strong> son asignados exclusivamente por la Dirección Escolar.
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                {loading ? 'Creando cuenta...' : 'Completar Registro'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ¿Ya tenés una cuenta registrada?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModal('login');
                  setErrorMsg('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: CONFIRMACIÓN DE CORREO PENDIENTE */}
      {authModal === 'confirm_sent' && (
        <Modal title="Confirmá tu Correo Electrónico" isOpen={true} onClose={() => setAuthModal(null)} maxWidth="450px">
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <CheckCircle size={46} color="var(--success-600)" style={{ margin: '0 auto 0.85rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
              Enviamos un enlace de activación
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
              Revisá la casilla <strong>{pendingConfirmEmail}</strong> (incluida la carpeta de correo no deseado). Al abrir el enlace serás redirigido automáticamente a{' '}
              <strong>Campus: La Normal</strong> con tu sesión iniciada.
            </p>

            {errorMsg && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.83rem' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                disabled={loading}
                onClick={handleResendConfirmation}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                {loading ? 'Reenviando...' : 'Reenviar correo de confirmación'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModal('login');
                  setErrorMsg('');
                }}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: RECUPERAR CONTRASEÑA */}
      {authModal === 'forgot' && (
        <Modal title="Recuperar Contraseña" isOpen={true} onClose={() => setAuthModal(null)} maxWidth="440px">
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Ingresá tu correo electrónico registrado. Te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="forgot-email">
                  Correo electrónico registrado
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="usuario@correo.com"
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                {loading ? 'Enviando enlace...' : 'Enviar Instrucciones'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthModal('login');
                  setErrorMsg('');
                }}
                className="btn btn-ghost btn-sm"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
