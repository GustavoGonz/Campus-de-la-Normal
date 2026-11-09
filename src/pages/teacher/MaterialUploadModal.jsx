import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { materialService } from '../../services/materialService';
import { storageService } from '../../services/storageService';
import { Upload, FileText, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';

export const MaterialUploadModal = ({
  isOpen,
  onClose,
  subjectId,
  teacherId,
  folders = [],
  units = [],
  onUploaded,
}) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('published');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selected = e.target.files ? e.target.files[0] : null;
    setErrorMsg('');

    if (!selected) return;

    // Validación estricta de PDF
    const val = storageService.validateFile(selected);
    if (!val.valid) {
      setErrorMsg(val.error);
      setFile(null);
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Por favor seleccioná un archivo PDF para subir a la biblioteca.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setProgress(30);

    try {
      const selectedUnitObj = units.find((u) => u.unit === parseInt(unitNumber));

      setProgress(60);
      await materialService.uploadMaterial(subjectId, teacherId, file, {
        title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
        description: description.trim(),
        folder_id: folderId || null,
        unit_number: unitNumber ? parseInt(unitNumber) : null,
        unit_title: selectedUnitObj?.title || '',
        publication_status: publicationStatus,
        is_public: isPublic,
      });

      setProgress(100);
      onUploaded();
      onClose();

      // Limpiar formulario
      setFile(null);
      setTitle('');
      setDescription('');
      setFolderId('');
      setUnitNumber('');
      setPublicationStatus('published');
    } catch (err) {
      setErrorMsg(err.message || 'Error durante la subida del documento PDF.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subir Documento PDF a la Biblioteca"
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Zona de selección de archivo PDF */}
        <div style={{
          border: '2px dashed var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          textAlign: 'center',
          backgroundColor: file ? 'var(--primary-50)' : 'var(--bg-muted)',
          marginBottom: '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          {file ? (
            <div>
              <FileCheck size={36} color="var(--primary-700)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Tamaño: {(file.size / (1024 * 1024)).toFixed(2)} MB • Formato PDF verificado
              </div>
              <label htmlFor="file-upload-input" style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--primary-700)', textDecoration: 'underline', cursor: 'pointer' }}>
                Cambiar archivo PDF
              </label>
            </div>
          ) : (
            <div>
              <Upload size={32} color="var(--primary-800)" style={{ margin: '0 auto 0.75rem' }} />
              <label htmlFor="file-upload-input" style={{ cursor: 'pointer' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary-800)', textDecoration: 'underline' }}>
                  Hacé clic para seleccionar el archivo PDF
                </span>{' '}
                o arrastralo aquí
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Formato admitido: <strong>Documentos PDF (.pdf)</strong>. Tamaño máximo: 50MB.
              </div>
            </div>
          )}
          <input
            id="file-upload-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Título del documento */}
        <div className="form-group">
          <label className="form-label">Título del Documento PDF *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="Ej: Guía de Lectura N° 1 - Mitos Riojanos"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Descripción pedagógica */}
        <div className="form-group">
          <label className="form-label">Descripción Breve / Indicaciones Pedagógicas (Opcional)</label>
          <textarea
            className="form-textarea"
            rows="2"
            placeholder="Indicaciones para los alumnos sobre cómo abordar esta lectura..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Carpeta y Unidad temática */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Carpeta Organizadora</label>
            <select
              className="form-select"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">(Raíz de la materia)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tema / Unidad Correspondiente</label>
            <select
              className="form-select"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
            >
              <option value="">(Sin asignar)</option>
              {units.map((u) => (
                <option key={u.unit} value={u.unit}>Unidad {u.unit}: {u.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estado de Publicación */}
        <div className="form-group">
          <label className="form-label">Estado de Publicación</label>
          <select
            className="form-select"
            value={publicationStatus}
            onChange={(e) => setPublicationStatus(e.target.value)}
          >
            <option value="published">Publicado (Visible y descargable para alumnos inscriptos)</option>
            <option value="draft">Borrador (Solo visible para docentes)</option>
            <option value="hidden">Oculto temporalmente</option>
          </select>
        </div>

        {/* Autorización como fuente pública del Tutor IA */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--brand-blue)' }}
            />
            <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
              Habilitar como fuente pública del Tutor IA (permite consultas libres a visitantes e invitados)
            </span>
          </label>
        </div>

        {/* Barra de progreso durante la subida */}
        {uploading && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              <span>Subiendo documento PDF a Supabase Storage...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-light)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-800)', transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={uploading}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
            {uploading ? 'Guardando en Supabase...' : 'Guardar en la Biblioteca'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
