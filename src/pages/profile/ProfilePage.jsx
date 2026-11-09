import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { User, Shield, Key, Mail, CheckCircle, Save, BookOpen, GraduationCap, UserCheck } from 'lucide-react';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';

export const ProfilePage = () => {
  const { user, profile, updateProfile, isGuest, isAdmin, isTeacher, isStudent } = useAuth();
  const { showToast } = useNotifications();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      full_name: fullName.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    if (res.success) {
      showToast('Perfil actualizado correctamente.', 'success');
    } else {
      showToast(res.error || 'Error al actualizar perfil.', 'error');
    }
  };

  const getRoleDisplay = () => {
    if (isAdmin) return { name: 'Administrador', badgeClass: 'badge-danger', icon: Shield };
    if (isTeacher) return { name: 'Docente', badgeClass: 'badge-primary', icon: BookOpen };
    if (isGuest) return { name: 'Invitado', badgeClass: 'badge-neutral', icon: UserCheck };
    return { name: 'Estudiante', badgeClass: 'badge-success', icon: GraduationCap };
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
            Mi Perfil y Configuración
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Información personal y datos de tu cuenta en Campus: La Normal.
          </p>
        </div>
        <InstitutionalLogo variant="symbol" size="sm" />
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
          }}>
            {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--primary-900)', margin: '0 0 0.2rem' }}>
              {profile?.full_name || 'Usuario'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge ${roleInfo.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <RoleIcon size={12} /> {roleInfo.name}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user?.email || profile?.email}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Nombre y Apellido</label>
            <input
              type="text"
              required
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico (No modificable)</label>
            <input
              type="email"
              disabled
              className="form-input"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}
              value={user?.email || profile?.email || ''}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol en la Plataforma (Asignado institucionalmente)</label>
            <input
              type="text"
              disabled
              className="form-input"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', fontWeight: 600 }}
              value={roleInfo.name}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Por seguridad, la modificación de roles sólo puede ser realizada por el Administrador.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono de Contacto</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Ej: +54 380 4123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Biografía o Presentación</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Breve reseña sobre tus intereses o materias..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando cambios...' : 'Guardar Información'}
          </button>
        </form>
      </div>
    </div>
  );
};
