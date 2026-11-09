import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { aiService } from '../../services/aiService';
import {
  Sparkles,
  Send,
  Trash2,
  HelpCircle,
  FileText,
  Lock,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const WELCOME_MESSAGE = {
  id: 'welcome-institutional',
  role: 'assistant',
  message: `¡Hola! Soy el **Tutor IA de Campus: La Normal**.
Estoy conectado directamente con los **documentos, planificaciones docentes y cuadernillos oficiales** de la *Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros* de La Rioja.

Podés consultarme sobre temas de cualquier materia, pedir explicaciones paso a paso, resúmenes para estudiar o cuestionarios de repaso.`,
  sources: [
    {
      documentName: 'ANTROPOLOGIA.docx',
      docType: 'Cuadernillo Educativo',
      subject: 'Antropología',
      course: '5° Año',
      unitTitle: 'EJE N° 2: La Cultura como modo de explicación de la diversidad humana',
      sectionOrPage: 'Páginas 1-5',
    },
    {
      documentName: '2026PLANIFICACIÓN ANUAL ANTROPOLOGIA.docx',
      docType: 'Planificación Docente',
      subject: 'Antropología',
      course: '5° Año',
      unitTitle: 'EJE N° 1 y EJE N° 2',
      sectionOrPage: 'Planificación Oficial 2026',
    },
  ],
};

// Renderizador seguro de texto enriquecido institucional (encabezados, listas, citas y negritas sin exponer HTML crudo)
const renderInlineFormatting = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

const renderFormattedMessage = (rawText) => {
  if (!rawText) return null;
  const lines = String(rawText).split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${index}`} style={{ height: '0.45rem' }} />);
      return;
    }

    if (trimmed === '---') {
      elements.push(
        <hr
          key={`hr-${index}`}
          style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0.65rem 0' }}
        />
      );
      return;
    }

    if (trimmed.startsWith('##### ')) {
      elements.push(
        <div key={`h5-${index}`} style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary-800)', marginTop: '0.5rem' }}>
          {renderInlineFormatting(trimmed.slice(6))}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <div key={`h4-${index}`} style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary-900)', marginTop: '0.55rem' }}>
          {renderInlineFormatting(trimmed.slice(5))}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <div key={`h3-${index}`} style={{ fontWeight: 800, fontSize: '1.08rem', color: 'var(--primary-900)', marginBottom: '0.2rem' }}>
          {renderInlineFormatting(trimmed.slice(4))}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq-${index}`}
          style={{
            margin: '0.35rem 0',
            padding: '0.45rem 0.75rem',
            borderLeft: '3px solid var(--brand-blue, #0c13a8)',
            backgroundColor: '#f8fafc',
            borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
          }}
        >
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    if (/^[-•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      elements.push(
        <div key={`li-${index}`} style={{ paddingLeft: '0.85rem', marginBottom: '0.2rem' }}>
          {renderInlineFormatting(trimmed)}
        </div>
      );
      return;
    }

    elements.push(
      <div key={`p-${index}`} style={{ marginBottom: '0.15rem' }}>
        {renderInlineFormatting(line)}
      </div>
    );
  });

  return elements;
};

/**
 * Componente Único y Unificado del Tutor IA Institucional.
 * Se utiliza exactamente la misma implementación tanto en la página pública de inicio
 * como dentro de los paneles autenticados por rol y en la vista dedicada /tutor-ia.
 */
export const AITutorPage = ({ embedded = false, fullWidth = false }) => {
  const [searchParams] = useSearchParams();
  const urlSubjectId = embedded ? null : searchParams.get('subject');

  const { user, profile, role, isAuthenticated, isTeacher, isGuest, isAdmin } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId || 'all');
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [mode, setMode] = useState('explain'); // 'explain' | 'summary' | 'quiz'
  const [loading, setLoading] = useState(false);

  const chatContainerRef = useRef(null);
  const activeUserKey = isAuthenticated && user?.id ? user.id : 'public';
  const effectiveRole = isAuthenticated ? role : 'guest';
  const isPublicScope = !isAuthenticated || isGuest;

  // Cargar materias disponibles según el estado de autenticación y el rol
  useEffect(() => {
    let mounted = true;

    const loadTutorContext = async () => {
      try {
        let availableSubjects = [];
        const allSubjects = await subjectService.getSubjects();

        if (!isAuthenticated || isGuest) {
          availableSubjects = allSubjects;
        } else if (isAdmin) {
          availableSubjects = allSubjects;
        } else if (isTeacher) {
          const teacherSubs = await subjectService.getTeacherSubjects(user?.id);
          availableSubjects = teacherSubs.length > 0 ? teacherSubs : allSubjects;
        } else {
          // Estudiante: materias matriculadas + catálogo institucional
          const studentSubs = await subjectService.getStudentSubjects(user?.id);
          availableSubjects = studentSubs.length > 0 ? studentSubs : allSubjects;
        }

        if (!mounted) return;
        setSubjects(availableSubjects);

        const targetSubId =
          urlSubjectId && availableSubjects.some((s) => s.id === urlSubjectId)
            ? urlSubjectId
            : 'all';
        setSelectedSubjectId(targetSubId);

        const historyKey = targetSubId === 'all' ? 'general' : targetSubId;
        const storedHistory = await aiService.getChatHistory(historyKey, activeUserKey);
        if (!mounted) return;

        if (Array.isArray(storedHistory) && storedHistory.length > 0) {
          setMessages(storedHistory);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch (err) {
        console.warn('Aviso al inicializar contexto del Tutor IA:', err.message);
      }
    };

    loadTutorContext();
    return () => {
      mounted = false;
    };
  }, [activeUserKey, isAdmin, isAuthenticated, isGuest, isTeacher, urlSubjectId, user?.id]);

  // Desplazamiento interno del contenedor de mensajes sin mover el scroll de toda la página
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 1) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const activeSubject =
    selectedSubjectId === 'all'
      ? null
      : subjects.find((s) => s.id === selectedSubjectId) || null;

  const handleSubjectChange = async (newSubId) => {
    setSelectedSubjectId(newSubId);
    const historyKey = newSubId === 'all' ? 'general' : newSubId;
    const storedHistory = await aiService.getChatHistory(historyKey, activeUserKey);
    if (Array.isArray(storedHistory) && storedHistory.length > 0) {
      setMessages(storedHistory);
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
  };

  const handleSendMessage = async (customPrompt = null, requestedMode = null) => {
    const activeMode = requestedMode || mode;
    const textToSend = (customPrompt !== null ? customPrompt : inputPrompt).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      message: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (customPrompt === null) setInputPrompt('');
    setLoading(true);

    try {
      const response = await aiService.askTutor(
        activeSubject,
        activeUserKey,
        textToSend,
        activeMode,
        {
          userRole: effectiveRole,
          userName: profile?.full_name || null,
        }
      );

      const assistantMsg = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        message: response.message,
        sources: response.sources || [],
        found: response.found,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error en consulta al Tutor IA:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          message: 'Ocurrió un inconveniente al consultar la base documental. Por favor volvé a intentar.',
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const historyKey = activeSubject?.id || 'general';
    await aiService.clearChat(historyKey, activeUserKey);
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <div
      style={{
        maxWidth: fullWidth ? '100%' : embedded ? '960px' : '1020px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: embedded ? 'auto' : 'calc(100vh - 120px)',
        minHeight: embedded ? 'auto' : '540px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--primary-200)',
          boxShadow: '0 10px 30px rgba(12, 19, 168, 0.1)',
          overflow: 'hidden',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          flex: embedded ? 'unset' : 1,
        }}
      >
        {/* Cabecera Unificada del Tutor IA */}
        <div
          style={{
            backgroundColor: 'var(--brand-blue, #0c13a8)',
            color: '#ffffff',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} color="#ffb74d" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>
                Tutor IA — Asistente Pedagógico Institucional
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                Conectado a las planificaciones y cuadernillos oficiales (RAG)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {subjects.length > 0 && (
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                aria-label="Filtrar materia de consulta del Tutor IA"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all" style={{ color: '#0f172a' }}>
                  Todas las materias (Consulta General)
                </option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} style={{ color: '#0f172a' }}>
                    {sub.name} {sub.courses?.name ? `(${sub.courses.name})` : ''}
                  </option>
                ))}
              </select>
            )}

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '0.28rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.74rem',
                fontWeight: 600,
              }}
            >
              {isPublicScope ? (
                <>
                  <Lock size={12} /> Fuentes Públicas Autorizadas
                </>
              ) : (
                <>
                  <ShieldCheck size={13} /> Acceso Institucional ({profile?.full_name || 'Autenticado'})
                </>
              )}
            </div>

            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearHistory}
                title="Reiniciar conversación"
                aria-label="Reiniciar conversación"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.32rem 0.55rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}

            {embedded && (
              <Link
                to="/tutor-ia"
                title="Abrir Tutor IA en pantalla completa"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.28rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Maximize2 size={12} /> Pantalla completa
              </Link>
            )}
          </div>
        </div>

        {/* Barra de Modos Pedagógicos */}
        <div
          style={{
            padding: '0.55rem 1.25rem',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Modo pedagógico:
          </span>
          {[
            { key: 'explain', label: 'Explicación paso a paso' },
            { key: 'summary', label: 'Síntesis y Resumen' },
            { key: 'quiz', label: 'Cuestionario de Repaso' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className="btn btn-xs"
              style={{
                backgroundColor: mode === item.key ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
                color: mode === item.key ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                padding: '0.2rem 0.7rem',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Ventana de Mensajes */}
        <div
          ref={chatContainerRef}
          aria-live="polite"
          style={{
            padding: '1.25rem',
            flex: embedded ? 'unset' : 1,
            maxHeight: embedded ? '420px' : 'none',
            minHeight: embedded ? '260px' : '300px',
            overflowY: 'auto',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {messages.map((msg) => {
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
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isUser ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-xs)',
                    border: isUser ? 'none' : '1px solid var(--border-light)',
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                  }}
                >
                  {isUser ? msg.message : renderFormattedMessage(msg.message)}
                </div>

                {/* Tarjetas de Fuentes Institucionales Respaldadas */}
                {!isUser && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.6rem',
                      padding: '0.8rem',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--primary-900)',
                        marginBottom: '0.45rem',
                      }}
                    >
                      <FileText size={14} color="var(--primary-800)" /> Fuentes Institucionales Consultadas:
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '0.5rem',
                      }}
                    >
                      {msg.sources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            padding: '0.5rem 0.65rem',
                            backgroundColor: '#ffffff',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-light)',
                            fontSize: '0.76rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                              {src.documentName || src.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.66rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: (src.docType || '').includes('Planif') ? '#fef3c7' : '#dcfce7',
                                color: (src.docType || '').includes('Planif') ? '#92400e' : '#166534',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {src.docType || 'Documento'}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {src.subject} {src.course ? `• ${src.course}` : ''} {src.division ? `(${src.division})` : ''}
                          </div>
                          {src.unitTitle && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.71rem', marginTop: '0.15rem' }}>
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
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <LoadingSpinner size="sm" /> Consultando planificaciones y cuadernillos institucionales...
            </div>
          )}
        </div>

        {/* Preguntas Sugeridas Rápidas */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <HelpCircle size={13} /> Preguntas sugeridas:
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage('¿Me podés explicar el tema de la segunda unidad de Antropología?')}
            className="btn btn-ghost btn-xs"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              padding: '0.2rem 0.65rem',
            }}
          >
            Segunda unidad de Antropología (Eje 2)
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage('¿Cuáles son las 4 ramas de la antropología según Lévi-Strauss?')}
            className="btn btn-ghost btn-xs"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              padding: '0.2rem 0.65rem',
            }}
          >
            Ramas de la Antropología (Eje 1)
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage('¿Cuáles son los 4 tipos de normas según Formación Ética y Ciudadana?')}
            className="btn btn-ghost btn-xs"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              padding: '0.2rem 0.65rem',
            }}
          >
            Tipos de normas (Formación Ética)
          </button>
        </div>

        {/* Formulario de Consulta */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
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
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              activeSubject
                ? `Preguntale al Tutor IA sobre ${activeSubject.name}...`
                : 'Preguntale al Tutor IA sobre cualquier materia, planificación o cuadernillo escolar...'
            }
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-pill)',
              border: '1.5px solid var(--border-base, #cbd5e1)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
            disabled={loading}
            aria-label="Escribir consulta para el Tutor IA"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="btn btn-primary"
            style={{
              borderRadius: 'var(--radius-pill)',
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            aria-label="Enviar consulta al Tutor IA"
          >
            <span>Preguntar</span>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
