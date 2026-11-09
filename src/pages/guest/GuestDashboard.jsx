import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { 
  UserCheck, 
  BookOpen, 
  Calendar, 
  ShieldAlert, 
  Info, 
  Lock, 
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';

export const GuestDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuestData = async () => {
      setLoading(true);
      try {
        const [cList, sList] = await Promise.all([
          subjectService.getCourses(),
          subjectService.getSubjects(),
        ]);
        setCourses(cList);
        setSubjects(sList);
      } catch (err) {
        console.error('Error cargando información pública para invitados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGuestData();
  }, []);

  if (loading) return <LoadingSpinner text="Abriendo espacio institucional de invitado..." />;

  return (
    <div>
      {/* Banner de Bienvenida Institucional */}
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
              <span>Perfil de Invitado</span>
              <span>•</span>
              <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>Campus: La Normal</span>
              <span>•</span>
              <span style={{ opacity: 0.85 }}>«Aprender mejor, juntos»</span>
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '1.85rem', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
              ¡Bienvenido/a, {profile?.full_name || 'Invitado/a'}!
            </h1>
            <p style={{ opacity: 0.92, fontSize: '0.93rem', maxWidth: '640px', lineHeight: 1.5 }}>
              Escuela Normal Dr. Pedro Ignacio de Castro Barros • La Rioja. Como invitado, podés consultar la propuesta académica general, los cursos disponibles y el cronograma del calendario escolar.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/calendario')}
            className="btn btn-accent"
          >
            <Calendar size={16} /> Ver Calendario Escolar
          </button>
        </div>
      </div>

      {/* Cartel Informativo de Permisos de Invitado */}
      <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '2rem' }}>
        <Info size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.95rem' }}>
            Acceso Limitado a Espacios Públicos
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
            Tu cuenta posee el <strong>Rol de Invitado</strong>. Por políticas de seguridad institucional, las aulas virtuales, los documentos privados y las bibliotecas digitales están restringidas exclusivamente a los estudiantes matriculados y docentes autorizados. Si sos alumno o docente de la Escuela Normal, comunicate con la administración para asignar tu rol correspondiente.
          </div>
        </div>
      </div>

      {/* Resumen de Cursos y Oferta Curricular */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-900)' }}>
            Oferta Curricular y Cursos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Divisiones y espacios formativos de la Escuela Normal para el Ciclo Lectivo 2026.
          </p>
        </div>

        <div className="grid-cards">
          {courses.map((c) => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-primary">{c.shift || 'Mañana'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ciclo {c.year || 2026}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
                {c.name}
              </h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {c.division}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Catálogo de Materias Informativo */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-900)' }}>
            Espacios Curriculares de la Institución
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Materias dictadas en la escuela. Los contenidos pedagógicos internos y los archivos PDF se encuentran protegidos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${sub.color || 'var(--primary-800)'}`,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Lock size={12} /> Materia Privada
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {sub.courses?.name || 'Secundario'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.35rem' }}>
                  {sub.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1rem' }}>
                  {sub.description || 'Espacio curricular oficial de la Escuela Normal.'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-muted)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                <ShieldAlert size={14} color="var(--amber-600)" />
                <span>Biblioteca PDF restringida a estudiantes inscriptos.</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos Disponibles para el Invitado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <Link to="/calendario" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Calendario Escolar</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consultá las fechas institucionales del ciclo</div>
          </div>
        </Link>

        <Link to="/perfil" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-800)' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>Mi Perfil de Invitado</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Verificá tus datos y estado de cuenta</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

