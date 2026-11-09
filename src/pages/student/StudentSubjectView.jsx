import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { subjectService } from '../../services/subjectService';
import { materialService } from '../../services/materialService';
import { classService } from '../../services/classService';
import { 
  BookOpen, 
  FolderArchive, 
  Calendar, 
  Sparkles, 
  Download, 
  Eye,
  Lock, 
  FileText, 
  Clock, 
  Send,
  AlertCircle
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentSubjectView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [subject, setSubject] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'classes'
  const [loading, setLoading] = useState(true);

  // Estados de contenido
  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const sub = await subjectService.getSubjectById(id);
      setSubject(sub);

      // Verificar matriculación del estudiante
      const enrolled = await subjectService.checkEnrollment(id, user?.id);
      setIsEnrolled(enrolled);

      if (!enrolled) {
        // Consultar si tiene solicitud pendiente
        const reqs = await subjectService.getAccessRequests(id);
        const myReq = reqs.find((r) => r.student_id === user?.id && r.status === 'pending');
        setHasPendingRequest(!!myReq);
      } else {
        // Cargar únicamente contenidos publicados
        const [cls, mats] = await Promise.all([
          classService.getClasses(id, true),
          materialService.getMaterials(id, true),
        ]);
        setClasses(cls);
        setMaterials(mats);
      }
    } catch (err) {
      console.error(err);
      showToast('Error cargando el aula de la materia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const handleSendAccessRequest = async (e) => {
    e.preventDefault();
    setSendingRequest(true);
    const res = await subjectService.requestAccess(id, user?.id, requestMessage);
    setSendingRequest(false);
    if (res.success) {
      showToast('Solicitud enviada al profesor responsable.', 'success');
      setHasPendingRequest(true);
      setRequestMessage('');
    } else {
      showToast(res.error || 'Error al enviar la solicitud.', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Consultando aula virtual..." />;
  if (!subject) return <EmptyState title="Materia no encontrada" description="El espacio curricular solicitado no existe." />;

  // VISTA PARA ESTUDIANTE NO MATRICULADO
  if (!isEnrolled) {
    return (
      <div style={{ maxWidth: '680px', margin: '2rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--amber-100)',
            color: 'var(--amber-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <Lock size={32} />
          </div>

          <div className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
            {subject.courses?.name || '1° Año'} - {subject.courses?.division || '1° División'}
          </div>

          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
            {subject.name}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Este espacio curricular se encuentra protegido. Para acceder a las clases y a la biblioteca de documentos PDF oficiales, enviá una solicitud al docente a cargo.
          </p>

          {hasPendingRequest ? (
            <div className="alert alert-info" style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Solicitud en Revisión</div>
              <div>Ya registramos tu pedido de acceso para esta materia. Recibirás acceso en cuanto el profesor confirme tu matriculación.</div>
            </div>
          ) : (
            <form onSubmit={handleSendAccessRequest} style={{ textAlign: 'left', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Mensaje para el Docente (Opcional)</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Ej: Hola profesor/a, soy alumno/a del curso y solicito acceso a los materiales de su materia..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={sendingRequest}
              >
                <Send size={16} /> {sendingRequest ? 'Enviando petición...' : 'Solicitar Acceso a la Materia'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // VISTA PARA ESTUDIANTE MATRICULADO
  const filteredMaterials = materials.filter((m) => {
    return selectedUnit === 'all' || m.unit_number === parseInt(selectedUnit);
  });

  return (
    <div>
      {/* Cabecera del Aula Estudiantil */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        borderTop: `6px solid ${subject.color || 'var(--primary-800)'}`,
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-success">Matriculado</span>
              <span className="badge badge-primary">{subject.courses?.name || '1° Año'}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {subject.code || 'S/C'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {subject.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.5, margin: 0 }}>
              {subject.description || 'Biblioteca digital de lecturas oficiales y clases publicadas por tu docente.'}
            </p>
          </div>

          <Link to={`/tutor-ia?subject=${subject.id}`} className="btn btn-secondary">
            <Sparkles size={16} color="var(--primary-600)" /> Tutor IA de esta Materia
          </Link>
        </div>
      </div>

      {/* Pestañas: Biblioteca de Archivos PDF y Clases Publicadas */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <FolderArchive size={18} /> Biblioteca de Archivos PDF ({materials.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <Calendar size={18} /> Clases Publicadas ({classes.length})
        </button>
      </div>

      {/* PESTAÑA 1: BIBLIOTECA DIGITAL DE ARCHIVOS PDF */}
      {activeTab === 'library' && (
        <div>
          {materials.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-medium)',
            }}>
              <FolderArchive size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', marginBottom: '0.35rem' }}>
                Todavía no hay material disponible para esta materia
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Cuando tu docente publique documentos PDF de lectura o bibliografía, aparecerán aquí para su lectura y descarga.
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span className="badge badge-primary">PDF</span>
                      {mat.unit_number && <span className="badge badge-neutral">Unidad {mat.unit_number}</span>}
                    </div>

                    <h4 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
                      {mat.title}
                    </h4>

                    {mat.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                        {mat.description}
                      </p>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      {mat.file_name} • {(mat.file_size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>

                  {/* Acciones para el Estudiante: Abrir PDF y Descargar */}
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
                      title="Descargar PDF"
                    >
                      <Download size={14} /> Descargar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CLASES PUBLICADAS */}
      {activeTab === 'classes' && (
        <div>
          {classes.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay clases publicadas aún"
              description="Tu profesor aún no ha publicado clases en esta materia. Consultá periódicamente las novedades."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {classes.map((cls) => (
                <div key={cls.id} className="card" style={{ borderLeft: '4px solid var(--primary-700)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span className="badge badge-primary">{cls.class_date}</span>
                        {cls.unit_topic && <span className="badge badge-neutral">{cls.unit_topic}</span>}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)' }}>{cls.title}</h3>
                    </div>
                  </div>

                  {cls.content && (
                    <p style={{ color: 'var(--text-main)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                      {cls.content}
                    </p>
                  )}

                  {/* Materiales PDF vinculados a la clase */}
                  {cls.class_materials && cls.class_materials.length > 0 && (
                    <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Materiales de lectura y consulta de la clase:
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {cls.class_materials.map((cm) => (
                          <a
                            key={cm.material_id}
                            href={cm.materials?.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <FileText size={14} /> {cm.materials?.title || 'Documento PDF'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
