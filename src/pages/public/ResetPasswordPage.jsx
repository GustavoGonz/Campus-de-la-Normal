import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ResetPasswordPage = () => {
  const { updatePassword, verifyAuthCallback } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Si la redirección de correo incluye código PKCE o token_hash de recuperación, validarlo automáticamente
  useEffect(() => {
    let active = true;
    const hasRecoveryParams =
      location.search.includes('code=') ||
      location.search.includes('token_hash=') ||
      window.location.hash.includes('access_token=');

    if (!hasRecoveryParams) return;

    const validateRecoverySession = async () => {
      setVerifyingToken(true);
      const res = await verifyAuthCallback(location.search, window.location.hash);
      if (!active) return;
      setVerifyingToken(false);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    };

    validateRecoverySession();
    return () => {
      active = false;
    };
  }, [location.search, verifyAuthCallback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verificá ambos campos.');
      return;
    }

    setLoading(true);
    const res = await updatePassword(password);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      showToast('¡Contraseña restablecida con éxito!', 'success');
      setTimeout(() => {
        navigate('/panel', { replace: true });
      }, 2000);
    } else {
      setErrorMsg(res.error || 'No se pudo actualizar la contraseña. El enlace puede haber caducado.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--bg-page)',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <InstitutionalLogo variant="symbol" size="lg" />
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-900)', marginTop: '1rem', fontFamily: 'var(--font-display)' }}>
            Restablecer Contraseña
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Campus: La Normal • «Aprender mejor, juntos»
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {verifyingToken ? (
            <LoadingSpinner text="Validando enlace seguro de recuperación..." />
          ) : success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={48} color="var(--success-600)" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.3rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
                ¡Contraseña Actualizada!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Tu contraseña fue cambiada exitosamente. Redirigiendo a tu panel...
              </p>
              <button onClick={() => navigate('/panel', { replace: true })} className="btn btn-primary" style={{ width: '100%' }}>
                Ingresar al Campus
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Ingresá tu nueva contraseña segura para tu cuenta institucional.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-new-password">Nueva Contraseña</label>
                <input
                  id="reset-new-password"
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm-password">Confirmar Nueva Contraseña</label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Repetí la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading ? 'Guardando nueva contraseña...' : 'Actualizar Contraseña'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <Link to="/" style={{ color: 'var(--primary-700)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                  <ArrowLeft size={14} /> Volver al inicio
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
