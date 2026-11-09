import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, FileText, Calendar, X } from 'lucide-react';
import { subjectService } from '../../services/subjectService';
import { materialService } from '../../services/materialService';
import { classService } from '../../services/classService';
import { useAuth } from '../../context/AuthContext';

export const SearchModal = ({ isOpen, onClose }) => {
  const { user, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchContent = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);

      try {
        const terms = query.toLowerCase();
        const found = [];

        // 1. Buscar en materias
        const subjects = isTeacher
          ? await subjectService.getTeacherSubjects(user?.id)
          : await subjectService.getStudentSubjects(user?.id);

        subjects.forEach((s) => {
          if (s.name.toLowerCase().includes(terms) || (s.code && s.code.toLowerCase().includes(terms))) {
            found.push({
              id: s.id,
              type: 'subject',
              title: s.name,
              subtitle: `Materia • Código: ${s.code || 'N/A'} • ${s.courses?.name || ''}`,
              link: isTeacher ? `/profesor/materia/${s.id}` : `/estudiante/materia/${s.id}`,
            });
          }
        });

        // 2. Buscar en documentos PDF y clases de las materias
        for (const s of subjects.slice(0, 6)) {
          // Documentos PDF
          const mats = await materialService.getMaterials(s.id, !isTeacher && !isAdmin);
          mats.forEach((m) => {
            if (m.title.toLowerCase().includes(terms) || (m.description && m.description.toLowerCase().includes(terms))) {
              found.push({
                id: m.id,
                type: 'material',
                title: m.title,
                subtitle: `Documento PDF en ${s.name} • ${m.file_name}`,
                link: isTeacher ? `/profesor/materia/${s.id}` : `/estudiante/materia/${s.id}`,
              });
            }
          });

          // Clases
          const classes = await classService.getClasses(s.id, !isTeacher && !isAdmin);
          classes.forEach((c) => {
            if (c.title.toLowerCase().includes(terms) || (c.content && c.content.toLowerCase().includes(terms))) {
              found.push({
                id: c.id,
                type: 'class',
                title: c.title,
                subtitle: `Clase del ${c.class_date} en ${s.name}`,
                link: isTeacher ? `/profesor/materia/${s.id}` : `/estudiante/materia/${s.id}`,
              });
            }
          });
        }

        setResults(found);
      } catch (err) {
        console.error('Error durante la búsqueda:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      searchContent();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, user, isTeacher, isAdmin]);

  if (!isOpen) return null;

  const handleSelectResult = (link) => {
    navigate(link);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(3px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '4rem 1rem',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        width: '100%',
        maxWidth: '600px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-light)',
          gap: '0.75rem',
        }}>
          <Search size={20} color="var(--primary-700)" />
          <input
            type="text"
            placeholder="Buscar materias, documentos PDF o clases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
            }}
          />
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem' }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Buscando en el campus...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No se encontraron coincidencias para "{query}".
            </div>
          )}

          {!loading && results.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelectResult(item.link)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {item.type === 'subject' && <BookOpen size={18} color="var(--primary-700)" />}
              {item.type === 'material' && <FileText size={18} color="var(--danger-600)" />}
              {item.type === 'class' && <Calendar size={18} color="var(--success-600)" />}

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
