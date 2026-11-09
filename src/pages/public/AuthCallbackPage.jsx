import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AuthCallbackPage = () => {
  const { verifyAuthCallback } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const processVerification = async () => {
      const res = await verifyAuthCallback(location.search, window.location.hash);
      if (!active) return;

      if (res.success) {
        setStatus('success');
        if (res.type === 'recovery') {
          showToast('Identidad verificada. Ingresá tu nueva contraseña.', 'info');
          navigate('/reset-password', { replace: true });
        } else {
          showToast('¡Correo electrónico confirmado! Sesión iniciada correctamente.', 'success');
          navigate('/panel', { replace: true });
        }
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'No se pudo completar la validación del enlace.');
      }
    };

    processVerification();

    return () => {
      active = false;
    };
  }, [location.search, navigate, showToast, verifyAuthCallback]);

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
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.25rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <InstitutionalLogo variant="symbol" size="lg" />
        </div>

        {status === 'verifying' && (
          <>
            <h1 style={{ fontSize: '1.35rem', color: 'var(--primary-900)', marginBottom: '0.75rem' }}>
              Verificando tu cuenta institucional
            </h1>
            <LoadingSpinner text="Confirmando correo y creando sesión segura..." />
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} color="var(--success-600)" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '1.35rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
              ¡Cuenta confirmada!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Redirigiendo automáticamente a tu panel de Campus: La Normal...
            </p>
            <button onClick={() => navigate('/panel', { replace: true })} className="btn btn-primary" style={{ width: '100%' }}>
              Ir al Campus <ArrowRight size={16} />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} color="var(--danger-600)" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '1.35rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
              Enlace de verificación no válido
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            <Link to="/" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
              Volver al Inicio de Sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

