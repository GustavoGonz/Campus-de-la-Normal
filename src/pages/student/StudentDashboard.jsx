import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { 
  BookOpen, 
  FolderArchive, 
  Calendar, 
  Sparkles, 
  BookmarkCheck, 
  ArrowRight,
  Lock
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';

export const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true);
      try {
        const [enrolled, all] = await Promise.all([
          subjectService.getStudentSubjects(user?.id),
          subjectService.getSubjects(),
        ]);
        setEnrolledSubjects(enrolled);
        setAllSubjects(all);
      } catch (err) {
        console.error('Error en espacio estudiantil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [user]);

  if (loading) return <LoadingSpinner text="Abriendo tu espacio estudiantil..." />;

  const enrolledIds = enrolledSubjects.map((s) => s.id);
  const otherSubjects = allSubjects.filter((s) => !enrolledIds.includes(s.id));

  return (
    <div>
      {/* Banner de Bienvenida Estudiantil */}
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
              <span>Espacio Estudiantil</span>
              <span>•</span>
              <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>Campus: La Normal</span>
              <span>•</span>
              <span style={{ opacity: 0.85 }}>«Aprender mejor, juntos»</span>
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '1.85rem', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
              ¡Hola, {profile?.full_name || 'Estudiante'}!
            </h1>
            <p style={{ opacity: 0.92, fontSize: '0.93rem', maxWidth: '640px', lineHeight: 1.5, margin: 0 }}>
              Escuela Normal Dr. Pedro Ignacio de Castro Barros • La Rioja. Accedé a la biblioteca digital de archivos PDF de tus materias, consultá las clases y prepará tus materias con el tutor inteligente.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/estudiante/biblioteca')}
            className="btn btn-accent"
          >
            <FolderArchive size={16} /> Biblioteca de Archivos PDF
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

      {/* Materias Habilitadas / Inscriptas */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-900)' }}>Mis Materias Habilitadas</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Espacios curriculares en los que contás con matrícula y acceso a la biblioteca de documentos.
            </p>
          </div>
        </div>

        {enrolledSubjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aún no estás matriculado/a en ninguna materia"
            description="Revisá la lista de materias disponibles abajo y solicitá acceso a tus profesores."
          />
        ) : (
          <div className="grid-cards">
            {enrolledSubjects.map((sub) => (
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
                    <span className="badge badge-success">Matriculado</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {sub.courses?.name || '1° Año'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
                    {sub.name}
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1.25rem' }}>
                    {sub.description || 'Biblioteca de lecturas en formato PDF y contenidos oficiales.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <Link
                    to={`/estudiante/materia/${sub.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Ver Biblioteca PDF <ArrowRight size={14} />
                  </Link>
                  <Link
                    to={`/tutor-ia?subject=${sub.id}`}
                    className="btn btn-secondary btn-sm"
                    title="Consultar al Tutor IA sobre esta materia"
                  >
                    <Sparkles size={14} color="var(--primary-600)" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Otras Materias Disponibles para Solicitar Acceso */}
      {otherSubjects.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)' }}>
              Otras Materias de la Institución
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Espacios curriculares disponibles. Si cursás alguna de estas materias, ingresá para solicitar acceso al docente responsable.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {otherSubjects.map((sub) => (
              <div key={sub.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{sub.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.courses?.name || 'Secundario'}</div>
                </div>
                <Link
                  to={`/estudiante/materia/${sub.id}`}
                  className="btn btn-secondary btn-sm"
                >
                  <Lock size={12} /> Solicitar Acceso
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos Rápidos Estudiantiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <Link to="/estudiante/biblioteca" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-800)' }}>
            <FolderArchive size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Biblioteca General</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Leé y descargá documentos en PDF</div>
          </div>
        </Link>

        <Link to="/materias-previas" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--amber-100)', color: 'var(--amber-700)' }}>
            <BookmarkCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Materias Previas</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Planificá y repasá unidades adeudadas</div>
          </div>
        </Link>

        <Link to="/calendario" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Calendario Escolar</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consultá clases y fechas institucionales</div>
          </div>
        </Link>
      </div>
    </div>
  );
};
