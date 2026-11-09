import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { classService } from '../../services/classService';
import { FileText, Check } from 'lucide-react';

export const ClassEditorModal = ({
  isOpen,
  onClose,
  subjectId,
  teacherId,
  classItem = null,
  availableMaterials = [],
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    class_date: new Date().toISOString().split('T')[0],
    unit_topic: '',
    content: '',
    status: 'published',
  });
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classItem) {
      setFormData({
        title: classItem.title || '',
        class_date: classItem.class_date || new Date().toISOString().split('T')[0],
        unit_topic: classItem.unit_topic || '',
        content: classItem.content || '',
        status: classItem.status || 'published',
      });
      const initialIds = classItem.class_materials
        ? classItem.class_materials.map((cm) => cm.material_id)
        : classItem.material_ids || [];
      setSelectedMaterialIds(initialIds);
    } else {
      setFormData({
        title: '',
        class_date: new Date().toISOString().split('T')[0],
        unit_topic: '',
        content: '',
        status: 'published',
      });
      setSelectedMaterialIds([]);
    }
  }, [classItem, isOpen]);

  const toggleMaterial = (id) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (classItem) {
        await classService.updateClass(subjectId, classItem.id, formData, selectedMaterialIds);
      } else {
        await classService.createClass(subjectId, teacherId, formData, selectedMaterialIds);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error al guardar clase:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={classItem ? 'Editar Clase Planificada' : 'Planificar Nueva Clase'}
      maxWidth="640px"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Título de la Clase *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ej: Clase N° 4: Los Caudillos Riojanos"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fecha de la Clase *</label>
            <input
              type="date"
              required
              className="form-input"
              value={formData.class_date}
              onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Eje / Unidad Temática</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: Unidad 2 - La Confederación y el Federalismo"
            value={formData.unit_topic}
            onChange={(e) => setFormData({ ...formData, unit_topic: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Desarrollo y Contenido Pedagógico</label>
          <textarea
            className="form-textarea"
            rows="4"
            placeholder="Detalle de los temas tratados, explicaciones conceptuales e instrucciones de lectura..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

        {/* Reutilización de Materiales PDF de la Biblioteca Anual */}
        <div className="form-group">
          <label className="form-label">
            Vincular Materiales PDF de la Biblioteca ({selectedMaterialIds.length} seleccionados)
          </label>
          <div style={{
            maxHeight: '160px',
            overflowY: 'auto',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-muted)',
            padding: '0.5rem',
          }}>
            {availableMaterials.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No hay materiales cargados en la biblioteca de esta materia aún.
              </div>
            ) : (
              availableMaterials.map((mat) => {
                const isSelected = selectedMaterialIds.includes(mat.id);
                return (
                  <div
                    key={mat.id}
                    onClick={() => toggleMaterial(mat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--primary-500)' : '1px solid var(--border-light)',
                      marginBottom: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <FileText size={16} color="var(--primary-700)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{mat.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(PDF)</span>
                    </div>
                    {isSelected && <Check size={16} color="var(--primary-700)" />}
                  </div>
                );
              })
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
            Los documentos seleccionados se vincularán directamente a esta clase para la lectura de los alumnos.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Estado de la Clase</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="published">Publicada (Visible para alumnos inscriptos)</option>
            <option value="draft">Borrador (Solo visible para docentes)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Clase'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
