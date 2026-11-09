import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { materialService } from '../../services/materialService';
import { 
  FolderArchive, 
  Search, 
  Download, 
  Eye,
  FileText, 
  Filter
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentLibraryPage = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLibrary = async () => {
      setLoading(true);
      try {
        const studentSubs = await subjectService.getStudentSubjects(user?.id);
        setSubjects(studentSubs);

        // Consultar materiales PDF de todas las materias matriculadas
        const allMats = [];
        for (const sub of studentSubs) {
          const subMats = await materialService.getMaterials(sub.id, true);
          allMats.push(...subMats.map((m) => ({ ...m, subjectName: sub.name, subjectCode: sub.code })));
        }
        setMaterials(allMats);
      } catch (err) {
        console.error('Error cargando biblioteca estudiantil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, [user]);

  if (loading) return <LoadingSpinner text="Consultando biblioteca de archivos PDF..." />;

  const filteredMaterials = materials.filter((m) => {
    const matchesSub = selectedSubjectId === 'all' || m.subject_id === selectedSubjectId;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (m.title && m.title.toLowerCase().includes(q)) || 
      (m.file_name && m.file_name.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q));
    return matchesSub && matchesSearch;
  });

  return (
    <div>
      {/* Cabecera */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
          Biblioteca Digital de Materiales de Estudio
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Consultá, leé en línea y descargá los documentos PDF oficiales publicados por tus docentes de las materias autorizadas.
        </p>
      </div>

      {/* Cartel Institucional de Lectura y Descarga */}
      <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <FolderArchive size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Biblioteca Oficial:</strong> Todos los documentos están en formato PDF y disponibles permanentemente durante todo el ciclo lectivo.
        </span>
      </div>

      {/* Filtro y Barra de Búsqueda */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-surface)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por título, contenido o archivo..."
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="all">Todas mis materias habilitadas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredMaterials.length} documento(s) encontrado(s)
        </div>
      </div>

      {/* Rejilla de Documentos PDF */}
      {filteredMaterials.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-medium)',
        }}>
          <FolderArchive size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', marginBottom: '0.35rem' }}>
            Todavía no hay material disponible para esta selección
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Cuando tus profesores suban lecturas y archivos PDF a sus materias, aparecerán listados aquí.
          </p>
        </div>
      ) : (
        <div className="grid-cards">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="card card-interactive"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{mat.subjectName}</span>
                  <span className="badge badge-neutral">PDF</span>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
                  {mat.title}
                </h3>

                {mat.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                    {mat.description}
                  </p>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  {mat.unit_number && <span>Unidad {mat.unit_number} • </span>}
                  {mat.file_name} • {(mat.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                <a
                  href={mat.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Eye size={14} /> Abrir PDF
                </a>
                <a
                  href={mat.file_url}
                  download={mat.file_name}
                  className="btn btn-secondary btn-sm"
                  title="Descargar archivo PDF"
                >
                  <Download size={14} /> Descargar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
