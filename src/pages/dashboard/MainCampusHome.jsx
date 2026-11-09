import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { aiService } from '../../services/aiService';
import { 
  Sparkles, 
  BookOpen, 
  FolderArchive, 
  Calendar, 
  BookmarkCheck, 
  ShieldCheck, 
  ArrowRight, 
  Send, 
  HelpCircle, 
  FileText, 
  Trash2
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';

export const MainCampusHome = () => {
  const { user, profile, role, isStudent, isTeacher, isAdmin, isGuest } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [promptInput, setPromptInput] = useState('');
  const [aiMode, setAiMode] = useState('explain'); // 'explain', 'summary', 'quiz'
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    const initDashboardData = async () => {
      setLoadingData(true);
      try {
        let subs = [];
        if (isAdmin) {
          subs = await subjectService.getSubjects();
        } else if (isTeacher) {
          subs = await subjectService.getTeacherSubjects(user?.id);
        } else if (isGuest) {
          const all = await subjectService.getSubjects();
          subs = all.filter((s) => s.is_public || s.id === 'sub-antrop-5' || s.id === 'sub-lengua-1');
        } else {
          // Estudiante
          subs = await subjectService.getStudentSubjects(user?.id);
          if (subs.length === 0) {
            const all = await subjectService.getSubjects();
            subs = all.filter((s) => s.is_public || s.access_type === 'open' || s.id === 'sub-antrop-5');
          }
        }

        setSubjects(subs);
        if (subs.length > 0) {
          const defaultSub = subs[0];
          setSelectedSubject(defaultSub);
          const history = await aiService.getChatHistory(defaultSub.id, user?.id || 'guest');
          setChatMessages(history);
        }
      } catch (err) {
        console.error('Error al cargar datos del panel:', err);
      } finally {
        setLoadingData(false);
      }
    };

    initDashboardData();
  }, [user, isTeacher, isAdmin, isGuest]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loadingAi]);

  const handleSubjectChange = async (subId) => {
    const chosen = subjects.find((s) => s.id === subId);
    if (!chosen) return;
    setSelectedSubject(chosen);
    setLoadingAi(true);
    const history = await aiService.getChatHistory(chosen.id, user?.id || 'guest');
    setChatMessages(history);
    setLoadingAi(false);
  };

  const handleSendPrompt = async (textToSend = null) => {
    const query = textToSend || promptInput;
    if (!query.trim() || loadingAi || !selectedSubject) return;

    const userMsg = {
      id: 'usr-' + Date.now(),
      role: 'user',
      message: query,
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPromptInput('');
    setLoadingAi(true);

    try {
      const response = await aiService.askTutor(
        selectedSubject,
        user?.id || 'guest',
        query,
        aiMode,
        { userRole: role }
      );

      const assistantMsg = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        message: response.message,
        sources: response.sources || [],
        found: response.found,
        created_at: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          message: 'Ocurrió un error al consultar el sistema RAG institucional. Por favor volvé a intentar.',
          sources: [],
        },
      ]);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleClearChat = async () => {
    if (!selectedSubject) return;
    await aiService.clearChat(selectedSubject.id, user?.id || 'guest');
    setChatMessages([]);
  };

  // Rutas complementarias según el rol del usuario
  const libraryRoute = isTeacher 
    ? '/profesor/biblioteca' 
    : isStudent 
    ? '/estudiante/biblioteca' 
    : '/profesor/biblioteca';

  const subjectsRoute = isTeacher 
    ? '/profesor/materias' 
    : isStudent 
    ? '/estudiante/materias' 
    : '/admin/materias';

  const roleBadgeLabel = isAdmin 
    ? 'Administrador' 
    : isTeacher 
    ? 'Docente' 
    : isGuest 
    ? 'Invitado' 
    : 'Estudiante';

  if (loadingData) return <LoadingSpinner text="Iniciando plataforma Campus: La Normal..." />;

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ============================================================== */}
      {/* 1. CABECERA INSTITUCIONAL Y BIENVENIDA */}
      {/* ============================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #0c13a8 0%, #1e3a8a 70%, #1e1b4b 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 2rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 4px 20px rgba(12, 19, 168, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <InstitutionalLogo variant="symbol" size="lg" theme="dark" />
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-pill)',
              marginBottom: '0.35rem',
            }}>
              <span>Rol: {roleBadgeLabel}</span>
              <span>•</span>
              <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>Ciclo 2026</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>
              ¡Hola, {profile?.full_name || 'Comunidad Normalista'}!
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.875rem', maxWidth: '640px', lineHeight: 1.4 }}>
              Escuela Normal Dr. Pedro Ignacio de Castro Barros • «Aprender mejor, juntos». El Tutor IA es tu punto central de estudio y consulta académica.
            </p>
          </div>
        </div>

        {/* Acceso rápido a la Biblioteca */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {!isGuest && (
            <button
              onClick={() => navigate(libraryRoute)}
              className="btn btn-sm"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--brand-blue, #0c13a8)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              <FolderArchive size={16} /> Biblioteca de Archivos
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PROTAGONISTA CENTRAL: TUTOR IA EDUCATIVO CON RAG */}
      {/* ============================================================== */}
      <section style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--primary-200)',
        boxShadow: '0 8px 24px rgba(12, 19, 168, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Barra Superior del Tutor IA */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid var(--border-light)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--brand-blue, #0c13a8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-900)' }}>
                Tutor IA — Asistente de Contenidos Escolares
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Consultando las planificaciones y cuadernillos de la materia activa
              </div>
            </div>
          </div>

          {/* Selector de Materia Activa para la Consulta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Materia de estudio:
            </label>
            <select
              value={selectedSubject?.id || ''}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="form-select"
              style={{ minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              aria-label="Seleccionar materia de estudio para el Tutor IA"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.courses ? `(${sub.courses.name})` : ''}
                </option>
              ))}
            </select>

            {chatMessages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger-700)', padding: '0.4rem' }}
                title="Reiniciar conversación de esta materia"
                aria-label="Reiniciar conversación"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Selector de Modos Pedagógicos */}
        <div style={{
          padding: '0.6rem 1.25rem',
          backgroundColor: '#f1f5f9',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Modo:
          </span>
          <button
            type="button"
            onClick={() => setAiMode('explain')}
            className="btn btn-xs"
            style={{
              backgroundColor: aiMode === 'explain' ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
              color: aiMode === 'explain' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-medium)',
            }}
          >
            Explicación paso a paso
          </button>
          <button
            type="button"
            onClick={() => setAiMode('summary')}
            className="btn btn-xs"
            style={{
              backgroundColor: aiMode === 'summary' ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
              color: aiMode === 'summary' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-medium)',
            }}
          >
            Síntesis y Resumen
          </button>
          <button
            type="button"
            onClick={() => setAiMode('quiz')}
            className="btn btn-xs"
            style={{
              backgroundColor: aiMode === 'quiz' ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
              color: aiMode === 'quiz' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-medium)',
            }}
          >
            Preguntas de Repaso
          </button>
        </div>

        {/* Ventana de Conversación Central */}
        <div style={{
          padding: '1.25rem',
          minHeight: '280px',
          maxHeight: '420px',
          overflowY: 'auto',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {chatMessages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '520px', padding: '1.5rem 1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--brand-blue, #0c13a8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
              }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', fontWeight: 800, margin: '0 0 0.4rem' }}>
                ¿Qué tema querés estudiar hoy en {selectedSubject?.name || 'tu materia'}?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                Podés pedirme resúmenes de unidades, explicaciones sencillas de conceptos difíciles o consultar sobre las consignas de tus cuadernillos de actividades.
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '85%' : '100%',
                  }}
                >
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isUser ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-xs)',
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.message}
                  </div>

                  {/* Citas de Fuentes Verificadas del RAG */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
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
                        <FileText size={14} color="var(--primary-800)" /> Fuentes Institucionales Respaldadas:
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
                        {msg.sources.map((src, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '0.55rem 0.75rem',
                              backgroundColor: '#ffffff',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border-light)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                                {src.documentName || src.title}
                              </span>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: (src.docType || '').includes('Planif') ? '#fef3c7' : '#dcfce7',
                                color: (src.docType || '').includes('Planif') ? '#92400e' : '#166534',
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
                                {src.unitTitle} {src.sectionOrPage ? `— ${src.sectionOrPage}` : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loadingAi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <LoadingSpinner size="sm" /> Consultando planificaciones y cuadernillos institucionales...
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chips de Preguntas Sugeridas */}
        <div style={{
          padding: '0.65rem 1.25rem',
          backgroundColor: '#f1f5f9',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <HelpCircle size={12} /> Preguntas sugeridas:
          </span>
          <button
            type="button"
            onClick={() => handleSendPrompt('¿Me podés explicar el tema de la segunda unidad de Antropología?')}
            className="btn btn-ghost btn-xs"
            style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem' }}
          >
            Segunda unidad de Antropología
          </button>
          <button
            type="button"
            onClick={() => handleSendPrompt('¿Cuáles son las 4 ramas de la antropología según Lévi-Strauss?')}
            className="btn btn-ghost btn-xs"
            style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem' }}
          >
            Ramas de la Antropología
          </button>
          <button
            type="button"
            onClick={() => handleSendPrompt('¿Cuáles son los tipos de familia que describe el cuadernillo?')}
            className="btn btn-ghost btn-xs"
            style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem' }}
          >
            Tipos de familia
          </button>
        </div>

        {/* Formulario de Entrada */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
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
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={`Escribí tu pregunta sobre ${selectedSubject?.name || 'los contenidos escolares'}...`}
            className="form-input"
            style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: 'var(--radius-pill)' }}
            disabled={loadingAi}
            aria-label="Preguntar al Tutor IA"
          />
          <button
            type="submit"
            disabled={loadingAi || !promptInput.trim()}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            aria-label="Enviar pregunta"
          >
            <span>Preguntar</span>
            <Send size={16} />
          </button>
        </form>
      </section>

      {/* ============================================================== */}
      {/* 3. HERRAMIENTAS COMPLEMENTARIAS SEGÚN EL ROL */}
      {/* ============================================================== */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', fontWeight: 800, margin: 0 }}>
              Herramientas Complementarias
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Acceso directo a las áreas de gestión educativa y biblioteca
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}>
          {/* Tarjeta A: Biblioteca Digital */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#e0e7ff',
                color: 'var(--brand-blue, #0c13a8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <FolderArchive size={22} />
              </div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-900)', fontWeight: 700, margin: '0 0 0.35rem' }}>
                Biblioteca Digital
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {isTeacher
                  ? 'Gestioná los archivos PDF de tus materias, actualizá versiones y completá metadatos.'
                  : 'Consultá y descargá los cuadernillos y textos oficiales de tus materias.'}
              </p>
            </div>
            <Link
              to={libraryRoute}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem', textDecoration: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              Ir a la Biblioteca <ArrowRight size={14} />
            </Link>
          </div>

          {/* Tarjeta B: Materias Autorizadas */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <BookOpen size={22} />
              </div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-900)', fontWeight: 700, margin: '0 0 0.35rem' }}>
                {isTeacher ? 'Mis Cátedras' : 'Materias Matriculadas'}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Accedé al espacio curricular de cada materia, programas analíticos y cronogramas.
              </p>
            </div>
            <Link
              to={subjectsRoute}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem', textDecoration: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              Ver Materias <ArrowRight size={14} />
            </Link>
          </div>

          {/* Tarjeta C: Calendario Institucional */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffedd5',
                color: '#c2410c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <Calendar size={22} />
              </div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-900)', fontWeight: 700, margin: '0 0 0.35rem' }}>
                Calendario Escolar
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Cronograma de clases, turnos de previas, receso invernal y efemérides riojanas.
              </p>
            </div>
            <Link
              to="/calendario"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem', textDecoration: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              Abrir Calendario <ArrowRight size={14} />
            </Link>
          </div>

          {/* Tarjeta D: Materias Previas (o Panel Admin si es Administrador) */}
          {isAdmin ? (
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--danger-600)' }}>
              <div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}>
                  <ShieldCheck size={22} />
                </div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-900)', fontWeight: 700, margin: '0 0 0.35rem' }}>
                  Administración Central
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Gestioná usuarios, asigná roles, autorizá docentes y controlá las materias del campus.
                </p>
              </div>
              <Link
                to="/admin/usuarios"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1rem', textDecoration: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Panel de Control <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#f3e8ff',
                  color: '#7e22ce',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}>
                  <BookmarkCheck size={22} />
                </div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-900)', fontWeight: 700, margin: '0 0 0.35rem' }}>
                  Materias Previas
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Planificá el repaso de materias pendientes de acreditación con checklist por unidades.
                </p>
              </div>
              <Link
                to="/materias-previas"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1rem', textDecoration: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Plan de Estudio <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
