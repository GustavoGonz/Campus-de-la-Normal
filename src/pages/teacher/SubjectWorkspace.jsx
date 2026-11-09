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
  Upload, 
  Plus, 
  Eye, 
  Download, 
  Trash2, 
  RefreshCw,
  Clock, 
  Check, 
  X, 
  Users, 
  Search,
  FileText,
  AlertCircle
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { MaterialUploadModal } from './MaterialUploadModal';
import { MaterialReplaceModal } from './MaterialReplaceModal';
import { ClassEditorModal } from './ClassEditorModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SubjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [subject, setSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'classes', 'requests'
  const [loading, setLoading] = useState(true);

  // Estados de datos
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [classes, setClasses] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);

  // Filtros de biblioteca
  const [searchMaterial, setSearchMaterial] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');

  // Modales
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [replaceTargetMaterial, setReplaceTargetMaterial] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'material' | 'class', id, title, filePath }
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const sub = await subjectService.getSubjectById(id);
      setSubject(sub);

      const [mats, flds, cls, reqs] = await Promise.all([
        materialService.getMaterials(id, false),
        materialService.getFolders(id),
        classService.getClasses(id, false),
        subjectService.getAccessRequests(id),
      ]);

      setMaterials(mats);
      setFolders(flds);
      setClasses(cls);
      setAccessRequests(reqs);
    } catch (err) {
      console.error(err);
      showToast('Error cargando los datos de la materia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  // Creación de carpetas organizadoras
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await materialService.createFolder(id, newFolderName.trim(), null, user?.id);
      setNewFolderName('');
      setShowNewFolderInput(false);
      showToast('Carpeta creada con éxito.', 'success');
      const flds = await materialService.getFolders(id);
      setFolders(flds);
    } catch (err) {
      showToast('Error al crear carpeta.', 'error');
    }
  };

  // Alternar publicación de material (publicado / borrador)
  const handleTogglePublication = async (mat) => {
    const nextStatus = mat.publication_status === 'published' ? 'draft' : 'published';
    try {
      await materialService.updateMaterial(id, mat.id, { publication_status: nextStatus });
      showToast(`Material ${nextStatus === 'published' ? 'publicado para los estudiantes' : 'en estado borrador'}.`, 'info');
      const mats = await materialService.getMaterials(id, false);
      setMaterials(mats);
    } catch (err) {
      showToast('Error al actualizar estado del material.', 'error');
    }
  };

  // Confirmación de eliminación
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'material') {
        await materialService.deleteMaterial(id, deleteConfirm.id, deleteConfirm.filePath);
        showToast('Documento PDF eliminado de la biblioteca y del almacenamiento.', 'info');
        setMaterials((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'class') {
        await classService.deleteClass(id, deleteConfirm.id);
        showToast('Clase eliminada.', 'info');
        setClasses((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      }
    } catch (err) {
      showToast('Error al eliminar.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Revisión de solicitud de acceso
  const handleReviewRequest = async (reqId, status, studentId) => {
    try {
      await subjectService.reviewAccessRequest(reqId, status, user?.id);
      showToast(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'}.`, 'success');
      setAccessRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err) {
      showToast('Error al procesar solicitud.', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Cargando biblioteca y contenidos de la materia..." />;
  if (!subject) return <EmptyState title="Materia no encontrada" description="El espacio solicitado no existe." />;

  // Filtrado de materiales PDF
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = !searchMaterial || 
      m.title.toLowerCase().includes(searchMaterial.toLowerCase()) || 
      (m.file_name && m.file_name.toLowerCase().includes(searchMaterial.toLowerCase()));
    const matchesUnit = selectedUnit === 'all' || m.unit_number === parseInt(selectedUnit);
    return matchesSearch && matchesUnit;
  });

  const unitsList = subject.syllabus || [
    { unit: 1, title: 'Unidad 1: Introducción y Fundamentos' },
    { unit: 2, title: 'Unidad 2: Desarrollo y Aplicaciones' },
    { unit: 3, title: 'Unidad 3: Eje Integrador' }
  ];

  return (
    <div>
      {/* Cabecera de la Materia */}
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
              <span className="badge badge-primary">{subject.courses?.name || '1° Año'}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Código: {subject.code || 'S/C'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {subject.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.5, margin: 0 }}>
              {subject.description || 'Gestión de la biblioteca digital de archivos PDF y planificación pedagógica.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              <Upload size={16} /> Subir Documento PDF
            </button>
            <button
              onClick={() => {
                setEditingClass(null);
                setShowClassModal(true);
              }}
              className="btn btn-secondary"
            >
              <Calendar size={16} /> Planificar Clase
            </button>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas: Biblioteca Digital, Clases, Solicitudes */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <FolderArchive size={18} /> Biblioteca Digital de PDF ({materials.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <Calendar size={18} /> Clases y Cronograma ({classes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Users size={18} /> Solicitudes de Alumnos ({accessRequests.length})
        </button>
      </div>

      {/* PESTAÑA 1: BIBLIOTECA DIGITAL DE ARCHIVOS PDF */}
      {activeTab === 'library' && (
        <div>
          {/* Barra de Filtros y Creación de Carpetas */}
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
                  placeholder="Buscar en la biblioteca por título o nombre..."
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="all">Todas las unidades temáticas</option>
                {unitsList.map((u) => (
                  <option key={u.unit} value={u.unit}>Unidad {u.unit}: {u.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {!showNewFolderInput ? (
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus size={14} /> Nueva Carpeta
                </button>
              ) : (
                <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Nombre de la carpeta..."
                    className="form-input"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Crear</button>
                  <button type="button" onClick={() => setShowNewFolderInput(false)} className="btn btn-ghost btn-sm">
                    <X size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Carpetas existentes */}
          {folders.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {folders.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.9rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--primary-900)',
                  }}
                >
                  <FolderArchive size={16} color="var(--primary-700)" />
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Listado de Documentos PDF */}
          {filteredMaterials.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-medium)',
            }}>
              <FolderArchive size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.35rem' }}>
                Todavía no hay material disponible para esta materia
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Hacé clic en el botón de abajo para subir el primer archivo PDF a la biblioteca.
              </p>
              <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
                <Upload size={16} /> Subir Documento PDF
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="card"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span className="badge badge-primary">PDF</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className={`badge ${mat.publication_status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                          {mat.publication_status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                        {mat.version > 1 && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            v{mat.version}
                          </span>
                        )}
                      </div>
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
                      {mat.unit_number && <span>Unidad {mat.unit_number} • </span>}
                      {mat.file_name} • {(mat.file_size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>

                  {/* Acciones de gestión para el docente */}
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                        title="Descargar archivo"
                      >
                        <Download size={14} />
                      </a>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setReplaceTargetMaterial(mat)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        title="Reemplazar archivo PDF o actualizar título"
                      >
                        <RefreshCw size={14} /> Reemplazar
                      </button>
                      <button
                        onClick={() => handleTogglePublication(mat)}
                        className="btn btn-secondary btn-sm"
                        title={mat.publication_status === 'published' ? 'Pasar a borrador' : 'Publicar'}
                      >
                        {mat.publication_status === 'published' ? 'Ocultar' : 'Publicar'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'material', id: mat.id, title: mat.title, filePath: mat.file_path })}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger-600)' }}
                        title="Eliminar de la biblioteca"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CLASES Y CRONOGRAMA */}
      {activeTab === 'classes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
            <button
              onClick={() => {
                setEditingClass(null);
                setShowClassModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} /> Planificar Nueva Clase
            </button>
          </div>

          {classes.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay clases planificadas aún"
              description="Podés registrar las clases y asociar documentos PDF de tu biblioteca anual."
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
                        <span className={`badge ${cls.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                          {cls.status === 'published' ? 'Publicada' : 'Borrador'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)' }}>{cls.title}</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setEditingClass(cls);
                          setShowClassModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'class', id: cls.id, title: cls.title })}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger-600)' }}
                      >
                        <Trash2 size={16} />
                      </button>
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
                        Materiales vinculados de la biblioteca:
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

      {/* PESTAÑA 3: SOLICITUDES DE ACCESO DE ALUMNOS */}
      {activeTab === 'requests' && (
        <div>
          {accessRequests.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay solicitudes de acceso pendientes"
              description="Cuando un alumno solicite ingreso a tu materia, aparecerá en esta lista para su aprobación."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {accessRequests.map((req) => (
                <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-900)' }}>
                      {req.profiles?.full_name || 'Estudiante'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {req.profiles?.email}
                    </div>
                    {req.message && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        "{req.message}"
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleReviewRequest(req.id, 'approved', req.student_id)}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={14} /> Aprobar Matriculación
                    </button>
                    <button
                      onClick={() => handleReviewRequest(req.id, 'rejected', req.student_id)}
                      className="btn btn-secondary btn-sm"
                    >
                      <X size={14} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <MaterialUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        subjectId={id}
        teacherId={user?.id}
        folders={folders}
        units={unitsList}
        onUploaded={loadAllData}
      />

      <MaterialReplaceModal
        isOpen={!!replaceTargetMaterial}
        onClose={() => setReplaceTargetMaterial(null)}
        subjectId={id}
        material={replaceTargetMaterial}
        onReplaced={loadAllData}
      />

      <ClassEditorModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        subjectId={id}
        teacherId={user?.id}
        classItem={editingClass}
        availableMaterials={materials}
        onSaved={loadAllData}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseás eliminar "${deleteConfirm?.title}"? Esta acción borrará el archivo de Supabase.`}
      />
    </div>
  );
};
