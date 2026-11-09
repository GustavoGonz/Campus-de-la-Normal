import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { materialService } from '../../services/materialService';
import { storageService } from '../../services/storageService';
import { RefreshCw, FileText, AlertCircle, FileCheck } from 'lucide-react';

export const MaterialReplaceModal = ({
  isOpen,
  onClose,
  subjectId,
  material,
  onReplaced,
}) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(material?.title || '');
  const [description, setDescription] = useState(material?.description || '');
  const [replacing, setReplacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (material) {
      setTitle(material.title || '');
      setDescription(material.description || '');
      setFile(null);
      setErrorMsg('');
    }
  }, [material, isOpen]);

  const handleFileSelect = (e) => {
    const selected = e.target.files ? e.target.files[0] : null;
    setErrorMsg('');
    if (!selected) return;

    const val = storageService.validateFile(selected);
    if (!val.valid) {
      setErrorMsg(val.error);
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!material) return;

    setReplacing(true);
    setErrorMsg('');

    try {
      if (file) {
        // Reemplazo físico del PDF en Supabase Storage
        await materialService.replaceMaterialFile(
          subjectId,
          material.id,
          file,
          material.file_path
        );
      }

      // Actualizar metadatos si cambiaron
      if (title !== material.title || description !== material.description) {
        await materialService.updateMaterial(subjectId, material.id, {
          title: title.trim(),
          description: description.trim(),
        });
      }

      onReplaced();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar el material.');
    } finally {
      setReplacing(false);
    }
  };

  if (!material) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reemplazar / Actualizar Archivo PDF"
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Documento actual en biblioteca:
          </div>
          <div style={{ fontWeight: 600, color: 'var(--primary-900)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
            {material.file_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Versión actual: v{material.version || 1} • {(material.file_size / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Título del Material</label>
          <input
            type="text"
            required
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción Breve</label>
          <textarea
            className="form-textarea"
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Carga del nuevo archivo PDF opcional */}
        <div className="form-group">
          <label className="form-label">Nuevo Archivo PDF (Opcional - solo si deseás sustituir el archivo existente)</label>
          <div style={{
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            textAlign: 'center',
            backgroundColor: file ? 'var(--primary-50)' : 'var(--bg-surface)',
          }}>
            {file ? (
              <div>
                <FileCheck size={28} color="var(--primary-700)" style={{ margin: '0 auto 0.35rem' }} />
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  Nuevo archivo seleccionado: {file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <label htmlFor="replace-pdf-input" style={{ cursor: 'pointer', display: 'block' }}>
                <RefreshCw size={24} color="var(--primary-700)" style={{ margin: '0 auto 0.4rem' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)', textDecoration: 'underline' }}>
                  Seleccionar nuevo archivo PDF para reemplazar
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  El archivo anterior será sustituido en Supabase Storage y la versión se incrementará a v{(material.version || 1) + 1}.
                </div>
              </label>
            )}
            <input
              id="replace-pdf-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={replacing}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={replacing}>
            {replacing ? 'Actualizando...' : 'Confirmar Actualización'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

