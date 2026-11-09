import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { classService } from '../../services/classService';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Filter 
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CalendarPage = () => {
  const { user, isTeacher, isGuest, isAdmin } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vistas: 'month', 'week', 'day'
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        let subs = [];
        if (isAdmin || isGuest) {
          subs = await subjectService.getSubjects();
        } else if (isTeacher) {
          subs = await subjectService.getTeacherSubjects(user?.id);
        } else {
          subs = await subjectService.getStudentSubjects(user?.id);
        }
        setSubjects(subs);

        const allEvents = [];
        for (const sub of subs) {
          const classes = await classService.getClasses(sub.id, !isTeacher && !isAdmin);
          classes.forEach((c) => {
            allEvents.push({
              id: c.id,
              type: 'class',
              title: c.title,
              date: c.class_date,
              subjectName: sub.name,
              subjectId: sub.id,
              detail: c.content || c.unit_topic,
              link: isTeacher ? `/profesor/materia/${sub.id}` : `/estudiante/materia/${sub.id}`,
            });
          });
        }

        setEvents(allEvents);
      } catch (err) {
        console.error('Error cargando calendario escolar:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user, isTeacher, isGuest, isAdmin]);

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (currentView === 'month') next.setMonth(next.getMonth() + 1);
    else if (currentView === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    if (currentView === 'month') prev.setMonth(prev.getMonth() - 1);
    else if (currentView === 'week') prev.setDate(prev.getDate() - 7);
    else prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const todayPeriod = () => {
    setCurrentDate(new Date());
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (loading) return <LoadingSpinner text="Cargando calendario escolar..." />;

  const filteredEvents = events.filter((ev) => {
    return selectedSubjectId === 'all' || ev.subjectId === selectedSubjectId;
  });

  return (
    <div>
      {/* Cabecera del Calendario */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
            Calendario y Cronograma Escolar
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Escuela Normal Dr. Pedro Ignacio de Castro Barros • Ciclo Lectivo 2026.
          </p>
        </div>

        {subjects.length > 0 && !isGuest && (
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="all">Todas las materias</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Controles de Navegación del Calendario */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={prevPeriod} className="btn btn-secondary btn-sm" aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </button>
          <button onClick={todayPeriod} className="btn btn-secondary btn-sm">
            Hoy
          </button>
          <button onClick={nextPeriod} className="btn btn-secondary btn-sm" aria-label="Mes siguiente">
            <ChevronRight size={16} />
          </button>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-900)', marginLeft: '0.5rem' }}>
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
        </div>
      </div>

      {/* Listado de Clases y Cronograma del Período */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', marginBottom: '1rem' }}>
          Clases y Novedades Programadas ({filteredEvents.length})
        </h3>

        {filteredEvents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay clases programadas para el período seleccionado.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1.15rem',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '4px solid var(--primary-700)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-primary">{ev.date}</span>
                    <span className="badge badge-neutral">{ev.subjectName}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-900)', fontSize: '1rem' }}>
                    {ev.title}
                  </div>
                  {ev.detail && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {ev.detail}
                    </div>
                  )}
                </div>

                {!isGuest && (
                  <Link to={ev.link} className="btn btn-secondary btn-sm">
                    Ver Clase
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
