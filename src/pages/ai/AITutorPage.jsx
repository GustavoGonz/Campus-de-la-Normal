import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { aiService } from '../../services/aiService';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  Trash2, 
  HelpCircle, 
  FileText, 
  CheckCircle, 
  ListOrdered, 
  RotateCcw,
  ShieldCheck,
  Lock,
  Layers,
  BookMarked
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';

export const AITutorPage = () => {
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subject');

  const { user, profile, isTeacher, isGuest, isAdmin } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [mode, setMode] = useState('explain'); // 'explain', 'summary', 'quiz'
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initTutor = async () => {
      setInitializing(true);
      try {
        let subs = [];
        if (isAdmin) {
          subs = await subjectService.getSubjects();
        } else if (isTeacher) {
          subs = await subjectService.getTeacherSubjects(user?.id);
        } else if (isGuest || !user) {
          // Para invitados o público general: ofrecer materias públicas institucionales autorizadas
          const all = await subjectService.getSubjects();
          subs = all.filter((s) => s.is_public || s.id === 'sub-antrop-5' || s.id === 'sub-lengua-1');
        } else {
          // Estudiante
          subs = await subjectService.getStudentSubjects(user?.id);
          // Si el estudiante aún no tiene materias matriculadas, sumar las de acceso abierto institucional
          if (subs.length === 0) {
            const all = await subjectService.getSubjects();
            subs = all.filter((s) => s.is_public || s.access_type === 'open' || s.id === 'sub-antrop-5');
          }
        }

        setSubjects(subs);

        if (subs.length > 0) {
          const defaultSub = initialSubjectId
            ? subs.find((s) => s.id === initialSubjectId) || subs[0]
            : subs[0];
          setSelectedSubject(defaultSub);
          const history = await aiService.getChatHistory(defaultSub.id, user?.id || 'guest');
          setMessages(history);
        }
      } catch (err) {
        console.error('Error al inicializar Tutor IA:', err);
      } finally {
        setInitializing(false);
      }
    };

    initTutor();
  }, [user, isTeacher, isGuest, isAdmin, initialSubjectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubjectChange = async (subId) => {
    const chosen = subjects.find((s) => s.id === subId);
    if (!chosen) return;
    setSelectedSubject(chosen);
    setLoading(true);
    const history = await aiService.getChatHistory(chosen.id, user?.id || 'guest');
    setMessages(history);
    setLoading(false);
  };

  const handleSendMessage = async (promptText = null, requestedMode = null) => {
    const activeMode = requestedMode || mode;
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || !selectedSubject || loading) return;

    const userMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      message: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputPrompt('');
    setLoading(true);

    try {
      const response = await aiService.askTutor(
        selectedSubject,
        user?.id || 'guest',
        textToSend,
        activeMode,
        { userRole: profile?.role || 'guest' }
      );

      const assistantMsg = {
        id: 'resp-' + Date.now(),
        role: 'assistant',
        message: response.message,
        sources: response.sources || [],
        found: response.found,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          message: 'Ocurrió un error al procesar tu consulta con la base documental. Por favor volvé a intentar.',
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedSubject) return;
    await aiService.clearChat(selectedSubject.id, user?.id || 'guest');
    setMessages([]);
  };

  if (initializing) return <LoadingSpinner text="Iniciando Tutor Pedagógico de Campus: La Normal..." />;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
      {/* Header bar con selector de materia y modos pedagógicos */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
        padding: '0.85rem 1.25rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        marginBottom: '0.75rem',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <InstitutionalLogo variant="symbol" size="sm" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h1 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', fontWeight: 800, margin: 0 }}>
                Tutor IA Institucional
              </h1>
              <span style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-800)',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
              }}>
                RAG Oficial
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Escuela Normal Dr. Pedro I. de Castro Barros • La Rioja
            </div>
          </div>
        </div>

        {/* Selector de Materia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Materia activa:
          </label>
          <select
            value={selectedSubject?.id || ''}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="form-select"
            style={{ minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            aria-label="Seleccionar materia activa para el Tutor IA"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} {sub.courses ? `(${sub.courses.name})` : ''}
              </option>
            ))}
          </select>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger-700)', padding: '0.4rem' }}
              title="Borrar conversación de esta materia"
              aria-label="Borrar conversación"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Selector de Modos Pedagógicos */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
          Modo de respuesta:
        </span>
        <button
          type="button"
          onClick={() => setMode('explain')}
          className="btn btn-xs"
          style={{
            backgroundColor: mode === 'explain' ? 'var(--primary-800)' : 'var(--bg-surface)',
            color: mode === 'explain' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          Explicación paso a paso
        </button>
        <button
          type="button"
          onClick={() => setMode('summary')}
          className="btn btn-xs"
          style={{
            backgroundColor: mode === 'summary' ? 'var(--primary-800)' : 'var(--bg-surface)',
            color: mode === 'summary' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          Síntesis y Resumen
        </button>
        <button
          type="button"
          onClick={() => setMode('quiz')}
          className="btn btn-xs"
          style={{
            backgroundColor: mode === 'quiz' ? 'var(--primary-800)' : 'var(--bg-surface)',
            color: mode === 'quiz' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          Cuestionario de Repaso
        </button>
      </div>

      {/* Área Principal de Mensajes */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '520px', padding: '2rem 1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--brand-blue, #0c13a8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Sparkles size={28} />
            </div>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary-900)', fontWeight: 800, marginBottom: '0.5rem' }}>
              Tutor de {selectedSubject?.name || 'la Escuela Normal'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Este tutor consulta prioritariamente las <strong>planificaciones docentes</strong> y <strong>cuadernillos oficiales</strong> cargados en el campus para responder tus dudas con rigor educativo.
            </p>

            <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
                Podés preguntarme sobre:
              </div>
              <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li>¿Me podés explicar el tema de la segunda unidad de Antropología?</li>
                <li>¿Cuáles son las 4 ramas de la antropología según Lévi-Strauss?</li>
                <li>¿Cuáles son las características de la cultura según el cuadernillo?</li>
                <li>Tipos de familia y hábitos alimentarios como práctica cultural.</li>
                <li>Resumen de las tipologías textuales en Lengua y Literatura.</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '82%' : '100%',
                }}
              >
                <div style={{
                  padding: '1.1rem 1.35rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isUser ? 'var(--brand-blue, #0c13a8)' : '#ffffff',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  border: isUser ? 'none' : '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-xs)',
                  fontSize: '0.925rem',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.message}
                </div>

                {/* Tarjetas de Fuentes Oficiales Documentadas del RAG */}
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
                            padding: '0.6rem 0.75rem',
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
                          {src.evidenceExcerpt && (
                            <div style={{
                              marginTop: '0.35rem',
                              padding: '0.35rem 0.5rem',
                              backgroundColor: '#f8fafc',
                              borderLeft: '2px solid var(--primary-700)',
                              fontSize: '0.72rem',
                              fontStyle: 'italic',
                              color: '#334155',
                            }}>
                              "{src.evidenceExcerpt}"
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

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <LoadingSpinner size="sm" /> Consultando documentos oficiales y planificaciones...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Entrada y Preguntas Rápidas */}
      <div style={{ marginTop: '0.75rem' }}>
        {/* Preguntas sugeridas en chips */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '0.5rem',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <HelpCircle size={12} /> Preguntas sugeridas:
          </span>
          <button
            type="button"
            onClick={() => handleSendMessage('¿Me podés explicar el tema de la segunda unidad de Antropología?')}
            className="btn btn-ghost btn-xs"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem' }}
          >
            Segunda unidad de Antropología
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Ramas de la antropología según Claude Lévi-Strauss')}
            className="btn btn-ghost btn-xs"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem' }}
          >
            Ramas de la Antropología
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('¿Cuáles son los tipos de familia que describe el cuadernillo?')}
            className="btn btn-ghost btn-xs"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem' }}
          >
            Tipos de familia
          </button>
        </div>

        {/* Formulario de Consulta */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Escribí tu consulta sobre ${selectedSubject?.name || 'la materia'}...`}
            className="form-input"
            style={{ flex: 1, padding: '0.75rem 1.1rem', borderRadius: 'var(--radius-pill)' }}
            disabled={loading}
            aria-label="Pregunta sobre la materia"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-pill)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            aria-label="Enviar pregunta al Tutor IA"
          >
            <span>Preguntar</span>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
