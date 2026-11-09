import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { aiService } from '../../services/aiService';
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  Calendar, 
  FolderArchive, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  FileText,
  AlertCircle,
  Mail,
  Send,
  HelpCircle,
  Info
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const LandingPage = () => {
  const { user, signIn, signInWithGoogle, signUp, resetPassword } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  // Estados de modales de autenticación
  const [authModal, setAuthModal] = useState(null); // 'login', 'register', 'forgot'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados del Tutor IA Público en portada
  const [tutorPrompt, setTutorPrompt] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'welcome-msg',
      role: 'assistant',
      message: `¡Hola! Soy el **Tutor IA de Campus: La Normal**.  
Estoy conectado directamente con los **documentos, planificaciones y cuadernillos oficiales** de la *Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros* de La Rioja.

Podés consultarme libremente sobre contenidos escolares, resúmenes, explicaciones paso a paso o la relación entre las planificaciones docentes y los cuadernillos de actividades.`,
      sources: [
        {
          documentName: 'ANTROPOLOGIA.docx',
          docType: 'Cuadernillo Educativo',
          subject: 'Antropología',
          course: '5° Año',
          unitTitle: 'EJE N° 2: La Cultura como modo de explicación de la diversidad humana',
          sectionOrPage: 'Páginas 1-5'
        },
        {
          documentName: '2026PLANIFICACIÓN ANUAL ANTROPOLOGIA.docx',
          docType: 'Planificación Docente',
          subject: 'Antropología',
          course: '5° Año',
          unitTitle: 'EJE N° 1 y EJE N° 2',
          sectionOrPage: 'Planificación Oficial 2026'
        }
      ]
    }
  ]);

  // Redirección si ya está autenticado
  React.useEffect(() => {
    if (user) {
      navigate('/panel');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  // Consulta pública al Tutor IA
  const handlePublicTutorSubmit = async (customText = null) => {
    const textToSend = customText || tutorPrompt;
    if (!textToSend.trim() || tutorLoading) return;

    const userEntry = {
      id: 'user-' + Date.now(),
      role: 'user',
      message: textToSend,
      created_at: new Date().toISOString()
    };

    setChatHistory((prev) => [...prev, userEntry]);
    if (!customText) setTutorPrompt('');
    setTutorLoading(true);

    try {
      const res = await aiService.askTutor(null, 'public', textToSend, 'explain');
      const assistantEntry = {
        id: 'resp-' + Date.now(),
        role: 'assistant',
        message: res.message,
        sources: res.sources || [],
        found: res.found,
        created_at: new Date().toISOString()
      };
      setChatHistory((prev) => [...prev, assistantEntry]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          message: 'Ocurrió un error al consultar el sistema documental. Por favor volvé a intentar.',
          sources: []
        }
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Inicio de sesión con correo (Gmail) y contraseña
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

  // Inicio de sesión directo con Google OAuth
  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setErrorMsg('');

    const res = await signInWithGoogle();
    setOauthLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'No se pudo iniciar sesión con Google.');
    }
  };

  // Registro de nuevo usuario
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
      showToast('Cuenta creada con éxito. Si tu cuenta requiere confirmación, revisá tu casilla de correo.', 'success');
      setAuthModal('login');
    } else {
      setErrorMsg(res.error || 'No se pudo crear la cuenta.');
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
      showToast('Si la cuenta existe, recibirás el enlace de recuperación en tu casilla de correo.', 'info');
      setAuthModal(null);
    } else {
      setErrorMsg(res.error || 'Error al solicitar recuperación de contraseña.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* Cabecera Pública */}
      <header style={{
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
        boxShadow: 'var(--shadow-xs)'
      }}>
        <InstitutionalLogo
          variant="horizontal"
          size="md"
          showSlogan={true}
          showSubtitle={true}
          to="/"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => { setAuthModal('login'); setErrorMsg(''); }}
            className="btn btn-secondary"
            aria-label="Iniciar Sesión en el Campus"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setAuthModal('register'); setErrorMsg(''); }}
            className="btn btn-primary"
            aria-label="Crear Cuenta en el Campus"
          >
            Crear Cuenta
          </button>
        </div>
      </header>

      {/* Hero Principal con el Tutor IA como Eje Central */}
      <section style={{
        padding: '2.5rem 1rem 3.5rem',
        background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ maxWidth: '1020px', margin: '0 auto', textAlign: 'center' }}>
          {/* Distintivo Institucional */}
          <div style={{
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
            marginBottom: '1.25rem',
            boxShadow: '0 2px 8px rgba(12, 19, 168, 0.08)',
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-orange, #ff7b15)' }}></span>
            <span>Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros • La Rioja • Ciclo 2026</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)',
            color: 'var(--primary-900)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '0.4rem',
            letterSpacing: '-0.02em',
          }}>
            Campus: <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>La Normal</span>
          </h1>

          <div style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)',
            color: 'var(--brand-blue, #0c13a8)',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            marginBottom: '1rem',
          }}>
            «Aprender mejor, juntos»
          </div>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            maxWidth: '680px',
            margin: '0 auto 2rem',
          }}>
            Asistente pedagógico inteligente y biblioteca digital institucional. Respuestas claras fundamentadas en las <strong>planificaciones docentes y cuadernillos educativos reales</strong> de la institución.
          </p>

          {/* ============================================================== */}
          {/* TUTOR IA PÚBLICO — ELEMENTO CENTRAL Y PRINCIPAL DE LA PANTALLA */}
          {/* ============================================================== */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--primary-200)',
            boxShadow: '0 10px 30px rgba(12, 19, 168, 0.12)',
            overflow: 'hidden',
            textAlign: 'left',
            maxWidth: '920px',
            margin: '0 auto',
          }}>
            {/* Cabecera del Asistente */}
            <div style={{
              backgroundColor: 'var(--brand-blue, #0c13a8)',
              color: '#ffffff',
              padding: '0.9rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={20} color="#ffb74d" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>Tutor IA — Consulta Pública Institucional</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Conectado a la base documental de la Escuela Normal (RAG)</div>
                </div>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                <Lock size={12} /> Fuentes Públicas Autorizadas
              </div>
            </div>

            {/* Ventana de Respuestas del Tutor IA */}
            <div style={{
              padding: '1.25rem',
              maxHeight: '440px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {chatHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: item.role === 'user' ? '85%' : '100%',
                  }}
                >
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: item.role === 'user' ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
                    color: item.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-xs)',
                    border: item.role === 'user' ? 'none' : '1px solid var(--border-light)',
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {item.message}
                  </div>

                  {/* Citas de Fuentes Verificadas del RAG */}
                  {item.sources && item.sources.length > 0 && item.role === 'assistant' && (
                    <div style={{
                      marginTop: '0.65rem',
                      padding: '0.85rem',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--primary-900)',
                        marginBottom: '0.45rem',
                      }}>
                        <FileText size={14} color="var(--primary-800)" /> Fuentes Institucionales Consultadas:
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem' }}>
                        {item.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              padding: '0.5rem 0.65rem',
                              backgroundColor: '#ffffff',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border-light)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{src.documentName}</span>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: src.docType?.includes('Planif') ? '#fef3c7' : '#dcfce7',
                                color: src.docType?.includes('Planif') ? '#92400e' : '#166534',
                                fontWeight: 700,
                              }}>
                                {src.docType || 'Documento'}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {src.subject} • {src.course || '5° Año'} {src.division ? `(${src.division})` : ''}
                            </div>
                            {src.unitTitle && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                                {src.unitTitle} — {src.sectionOrPage}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {tutorLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <LoadingSpinner size="sm" /> Consultando planificaciones y cuadernillos institucionales...
                </div>
              )}
            </div>

            {/* Preguntas de Ejemplo Rápidas */}
            <div style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#f1f5f9',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <HelpCircle size={13} /> Preguntas sugeridas:
              </span>
              <button
                type="button"
                onClick={() => handlePublicTutorSubmit('¿Me podés explicar el tema de la segunda unidad de Antropología?')}
                className="btn btn-ghost btn-xs"
                style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-pill)', fontSize: '0.76rem', padding: '0.2rem 0.65rem' }}
              >
                Segunda unidad de Antropología (Eje 2)
              </button>
              <button
                type="button"
                onClick={() => handlePublicTutorSubmit('¿Cuáles son las 4 ramas de la antropología según Lévi-Strauss?')}
                className="btn btn-ghost btn-xs"
                style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-pill)', fontSize: '0.76rem', padding: '0.2rem 0.65rem' }}
              >
                Ramas de la Antropología (Eje 1)
              </button>
              <button
                type="button"
                onClick={() => handlePublicTutorSubmit('¿Cuáles son los 4 tipos de normas según Formación Ética y Ciudadana?')}
                className="btn btn-ghost btn-xs"
                style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-pill)', fontSize: '0.76rem', padding: '0.2rem 0.65rem' }}
              >
                Tipos de normas (Formación Ética)
              </button>
            </div>

            {/* Input y Botón de Envío */}
            <form
              onSubmit={(e) => { e.preventDefault(); handlePublicTutorSubmit(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.25rem',
                backgroundColor: '#ffffff',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <input
                type="text"
                value={tutorPrompt}
                onChange={(e) => setTutorPrompt(e.target.value)}
                placeholder="Preguntale al Tutor IA sobre cualquier tema o cuadernillo escolar..."
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1.5px solid var(--border-base)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                disabled={tutorLoading}
                aria-label="Escribir pregunta para el Tutor IA"
              />
              <button
                type="submit"
                disabled={tutorLoading || !tutorPrompt.trim()}
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                aria-label="Enviar consulta"
              >
                <span>Preguntar</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECCIÓN DE HERRAMIENTAS COMPLEMENTARIAS DE ACCESO RÁPIDO */}
      {/* ============================================================== */}
      <section style={{ padding: '3.5rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-900)', fontWeight: 800 }}>
              Herramientas Educativas de la Plataforma
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Servicios institucionales integrados para acompañar la trayectoria académica en la Escuela Normal.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {/* Tarjeta 1: Biblioteca Digital de Documentos */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#e0e7ff',
                  color: 'var(--brand-blue, #0c13a8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <FolderArchive size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Biblioteca de Materiales
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Almacenamiento y consulta de documentos oficiales en PDF y formatos educativos. Organizados por materia, curso, división y unidad.
                </p>
              </div>
              <button
                onClick={() => setAuthModal('login')}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1.25rem', alignSelf: 'flex-start' }}
              >
                Consultar Biblioteca <ArrowRight size={14} />
              </button>
            </div>

            {/* Tarjeta 2: Espacios Curriculares y Materias */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
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
                onClick={() => setAuthModal('login')}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1.25rem', alignSelf: 'flex-start' }}
              >
                Ver Mis Materias <ArrowRight size={14} />
              </button>
            </div>

            {/* Tarjeta 3: Calendario Escolar y Mesas */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffedd5',
                  color: '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
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

          {/* Información de los 4 Roles Institucionales */}
          <div style={{
            marginTop: '3.5rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
              Organización de Roles y Permisos Institucionales
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-700)', fontWeight: 700, fontSize: '0.95rem' }}>
                  <GraduationCap size={18} /> 1. Estudiante
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Consulta al Tutor IA, accede a materias matriculadas, visualiza y descarga cuadernillos oficiales.
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-800)', fontWeight: 700, fontSize: '0.95rem' }}>
                  <BookOpen size={18} /> 2. Docente
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Carga y actualiza sus propios documentos, completa metadatos y define si autoriza fuentes públicas.
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger-700)', fontWeight: 700, fontSize: '0.95rem' }}>
                  <ShieldCheck size={18} /> 3. Administrador
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Gestiona usuarios, asigna roles, autoriza docentes, controla la biblioteca y supervisa el sistema.
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 700, fontSize: '0.95rem' }}>
                  <UserCheck size={18} /> 4. Invitado
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Acceso a información pública, calendario escolar y consultas al Tutor IA con fuentes autorizadas.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pie de Página */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        padding: '2.5rem 1.5rem',
        borderTop: '1px solid #1e293b',
      }}>
        <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
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
            <Link to="/calendario" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Calendario Escolar</Link>
            <Link to="/tutor-ia" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Tutor IA</Link>
            <button onClick={() => setAuthModal('login')} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}>
              Acceso Institucional
            </button>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MODAL 1: INICIAR SESIÓN (GMAIL / CONTRASEÑA / GOOGLE OAUTH) */}
      {/* ============================================================== */}
      {authModal === 'login' && (
        <Modal
          title="Iniciar Sesión en el Campus"
          isOpen={true}
          onClose={() => setAuthModal(null)}
          maxWidth="450px"
        >
          <div style={{ marginBottom: '1.25rem' }}>
            {errorMsg && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Opción A: Botón Directo con Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading || loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
                transition: 'background var(--trans-fast)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{oauthLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
            </button>

            {/* Separador Visual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }}></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>o con correo y contraseña</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }}></div>
            </div>

            {/* Opción B: Formulario de Correo (Gmail u otro) y Contraseña */}
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Correo Electrónico (Gmail o Institucional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="ejemplo@gmail.com"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => { setAuthModal('forgot'); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Verificando cuenta...' : 'Ingresar al Campus'}
              </button>
            </form>

            {/* Nota aclaratoria sobre configuración de Gmail y Supabase */}
            <div style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
            }}>
              <Info size={14} color="var(--primary-800)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Aclaración:</strong> Podés ingresar con cualquier casilla de <strong>Gmail</strong> utilizando correo y contraseña. Si elegís «Continuar con Google», se requiere que la institución tenga activado el proveedor OAuth en Supabase.
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ¿Todavía no tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => { setAuthModal('register'); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Crear una cuenta
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CREAR CUENTA INSTITUCIONAL */}
      {/* ============================================================== */}
      {authModal === 'register' && (
        <Modal
          title="Crear Cuenta en Campus: La Normal"
          isOpen={true}
          onClose={() => setAuthModal(null)}
          maxWidth="460px"
        >
          <div style={{ marginBottom: '1.25rem' }}>
            {errorMsg && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label">Nombre Completo y Apellido</label>
                <input
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
                <label className="form-label">Correo Electrónico (Gmail u otro)</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="estudiante@gmail.com"
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label">Contraseña (Mínimo 6 caracteres)</label>
                <input
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
                <label className="form-label">Rol Inicial Solicitado</label>
                <select
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

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Creando cuenta...' : 'Completar Registro'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ¿Ya tenés una cuenta registrada?{' '}
              <button
                type="button"
                onClick={() => { setAuthModal('login'); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RECUPERAR CONTRASEÑA */}
      {/* ============================================================== */}
      {authModal === 'forgot' && (
        <Modal
          title="Recuperar Contraseña"
          isOpen={true}
          onClose={() => setAuthModal(null)}
          maxWidth="440px"
        >
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Ingresá tu correo de Gmail o institucional registrado. Te enviaremos un enlace seguro para restablecer tu clave de acceso.
            </p>

            {errorMsg && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Correo Electrónico Registrado</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ejemplo@gmail.com"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Enviando enlace...' : 'Enviar Instrucciones'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setAuthModal('login'); setErrorMsg(''); }}
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
