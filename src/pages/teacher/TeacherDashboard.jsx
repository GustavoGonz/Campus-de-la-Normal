import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';
import { AITutorPage } from '../ai/AITutorPage';

export const TeacherDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMainPanel = location.pathname === '/panel';
  const [subjects, setSubjects] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [subs, reqs] = await Promise.all([
          subjectService.getTeacherSubjects(user?.id),
          subjectService.getAccessRequests(),
        ]);
        setSubjects(subs);
        setPendingRequests(reqs);
      } catch (err) {
        console.error('Error cargando panel docente:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) return <LoadingSpinner text="Cargando tu panel docente..." />;

  return (
    <div>
      {/* Banner de Bienvenida Docente */}
      <div
        className="institutional-banner"
        style={{
          padding: '2rem 2.25rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <InstitutionalLogo variant="symbol" size="lg" theme="dark" />
          <div>
            <div style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              color: '#ffffff',
              opacity: 0.9,
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}>
              <span>Panel de Gestión Docente</span>
              <span>•</span>
              <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>Campus: La Normal</span>
              <span>•</span>
              <span style={{ opacity: 0.85 }}>«Aprender mejor, juntos»</span>
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '1.85rem', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
              Hola, {profile?.full_name || 'Profesor/a'}
            </h1>
            <p style={{ opacity: 0.92, fontSize: '0.93rem', maxWidth: '640px', lineHeight: 1.5, margin: 0 }}>
              Escuela Normal Dr. Pedro Ignacio de Castro Barros • La Rioja. Administrá la biblioteca digital de archivos PDF de tus materias y planificá tus clases del ciclo lectivo.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/tutor-ia')}
            className="btn btn-accent"
          >
            <Sparkles size={16} /> Tutor IA Pedagógico
          </button>
          <button
            onClick={() => navigate('/profesor/materias')}
            className="btn"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#ffffff', backdropFilter: 'blur(4px)' }}
          >
            <BookOpen size={16} /> Mis Materias
          </button>
          <button
            onClick={() => navigate('/calendario')}
            className="btn"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', backdropFilter: 'blur(4px)' }}
          >
            <Calendar size={16} /> Calendario Escolar
          </button>
        </div>
      </div>

      {/* Alerta de solicitudes pendientes de alumnos */}
      {pendingRequests.length > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={18} />
            <span>
              Tenés <strong>{pendingRequests.length} solicitud(es) de acceso de alumnos</strong> pendientes de revisión.
            </span>
          </div>
          <button
            onClick={() => {
              if (subjects.length > 0) navigate(`/profesor/materia/${subjects[0].id}`);
            }}
            className="btn btn-secondary btn-sm"
          >
            Revisar en el Aula
          </button>
        </div>
      )}

      {/* Tutor IA Unificado Integrado en el Panel Principal Docente */}
      {isMainPanel && (
        <section style={{ marginBottom: '2.5rem' }} aria-label="Tutor IA Pedagógico">
          <AITutorPage embedded={true} fullWidth={true} />
        </section>
      )}

      {/* Mis Materias Asignadas */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-900)' }}>
              Mis Materias y Bibliotecas Digitales
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Espacios curriculares a tu cargo para subir y actualizar documentos PDF.
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No tenés materias asignadas aún"
            description="La administración del campus vinculará tus espacios curriculares correspondientes."
          />
        ) : (
          <div className="grid-cards">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${sub.color || 'var(--primary-800)'}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="badge badge-primary">{sub.courses?.name || '1° Año'}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Código: {sub.code || 'S/C'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
                    {sub.name}
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1.25rem' }}>
                    {sub.description || 'Biblioteca digital de documentos PDF y planificación.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <Link
                    to={`/profesor/materia/${sub.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Gestionar Biblioteca PDF <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accesos Rápidos Docentes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <Link to="/materias-previas" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--amber-100)', color: 'var(--amber-700)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Materias Previas</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Módulo de preparación de materias adeudadas</div>
          </div>
        </Link>

        <Link to="/calendario" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Calendario Escolar</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cronograma de clases y fechas del ciclo</div>
          </div>
        </Link>

        <Link to="/tutor-ia" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-800)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Tutor Pedagógico IA</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Asistente inteligente de consulta pedagógica</div>
          </div>
        </Link>
      </div>
    </div>
  );
};
