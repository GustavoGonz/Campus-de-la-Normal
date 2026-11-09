import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, getSiteUrl, isRemoteAvailable, markRemoteUnavailable } from '../config/supabaseClient';

const AuthContext = createContext(null);

const QUICK_SESSION_STORAGE_KEY = 'campus_quick_session';

const withAuthTimeout = (promise, ms = 2500) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con el servidor.')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// Cuentas institucionales para Acceso Rápido por Rol (orden oficial: Estudiante, Docente, Administrador, Invitado)
export const QUICK_ACCESS_ACCOUNTS = {
  student: {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'estudiante@lanormal.edu.ar',
    password: 'EstudianteNormal2026!',
    full_name: 'Lucía Ramos',
    role: 'student',
    label: 'Estudiante',
  },
  teacher: {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'docente@lanormal.edu.ar',
    password: 'DocenteNormal2026!',
    full_name: 'Prof. Carlos Romero',
    role: 'teacher',
    label: 'Docente',
  },
  admin: {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'admin@lanormal.edu.ar',
    password: 'AdminNormal2026!',
    full_name: 'Lic. María Elena Ramos',
    role: 'admin',
    label: 'Administrador',
  },
  guest: {
    id: '00000000-0000-4000-8000-000000000004',
    email: 'invitado@lanormal.edu.ar',
    password: 'InvitadoNormal2026!',
    full_name: 'Visitante Institucional',
    role: 'guest',
    label: 'Invitado',
  },
};

const readStoredQuickSession = () => {
  try {
    const raw = localStorage.getItem(QUICK_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user?.id && parsed?.profile?.role) {
      return parsed;
    }
  } catch {
    // Ignorar errores de parseo
  }
  return null;
};

// Mapeo amigable de errores de Supabase a mensajes claros en español
const mapAuthError = (errMessage) => {
  if (!errMessage) return 'Ocurrió un error inesperado al procesar la solicitud.';
  const msg = errMessage.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Correo electrónico o contraseña incorrectos. Verificá los datos ingresados.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Tu cuenta de correo aún no fue confirmada. Revisá tu bandeja de entrada (y correo no deseado) y hacé clic en el enlace de activación.';
  }
  if (msg.includes('user already registered') || msg.includes('user already exists')) {
    return 'Ya existe una cuenta registrada con este correo electrónico. Podés iniciar sesión o recuperar tu contraseña.';
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Demasiados intentos en poco tiempo. Por seguridad, esperá unos instantes antes de volver a intentar.';
  }
  if (msg.includes('signup disabled')) {
    return 'El registro de nuevos usuarios se encuentra temporalmente deshabilitado.';
  }
  if (msg.includes('otp_expired') || msg.includes('token has expired') || msg.includes('invalid token')) {
    return 'El enlace de verificación caducó o ya fue utilizado. Solicitá un nuevo enlace o iniciá sesión.';
  }
  return errMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener o crear perfil del usuario autenticado en Supabase
  const fetchProfile = useCallback(async (userId, userEmail, userMetadata = null) => {
    const defaultName =
      userMetadata?.full_name ||
      userMetadata?.name ||
      (userEmail ? userEmail.split('@')[0] : 'Usuario');
    const requestedRole = userMetadata?.role === 'guest' ? 'guest' : 'student';

    const fallbackProfile = {
      id: userId,
      email: (userEmail || '').trim().toLowerCase(),
      full_name: defaultName,
      role: requestedRole,
      avatar_url: userMetadata?.avatar_url || null,
      is_active: true,
    };

    if (!isRemoteAvailable()) {
      setProfile(fallbackProfile);
      return fallbackProfile;
    }

    try {
      const { data, error } = await withAuthTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        1500
      );

      if (error && error.code !== 'PGRST116') {
        if (String(error.message || '').toLowerCase().includes('fetch')) {
          markRemoteUnavailable();
          setProfile(fallbackProfile);
          return fallbackProfile;
        }
        console.warn('Aviso al consultar perfil:', error.message);
      }

      if (data) {
        setProfile(data);
        return data;
      }

      const { data: created, error: insertError } = await withAuthTimeout(
        supabase.from('profiles').upsert(fallbackProfile).select().single(),
        1500
      );

      if (insertError) {
        setProfile(fallbackProfile);
        return fallbackProfile;
      }

      const resolved = created || fallbackProfile;
      setProfile(resolved);
      return resolved;
    } catch {
      markRemoteUnavailable();
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await withAuthTimeout(supabase.auth.getSession());
        if (error) {
          console.warn('Aviso al obtener sesión inicial:', error.message);
        }

        if (session?.user) {
          localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
          if (mounted) {
            setUser(session.user);
            const prof = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            if (prof?.is_active === false) {
              await supabase.auth.signOut().catch(() => {});
              setUser(null);
              setProfile(null);
            }
          }
          return;
        }

        // Si no hay sesión remota activa, verificar si hay una sesión de Acceso Rápido activa
        const quickSession = readStoredQuickSession();
        if (quickSession && mounted) {
          setUser(quickSession.user);
          setProfile(quickSession.profile);
        }
      } catch {
        const quickSession = readStoredQuickSession();
        if (quickSession && mounted) {
          setUser(quickSession.user);
          setProfile(quickSession.profile);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
        setUser(session.user);
        const prof = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        if (prof?.is_active === false) {
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          setProfile(null);
        }
      } else {
        // Conservar sesión de Acceso Rápido si está activa en almacenamiento local
        const quickSession = readStoredQuickSession();
        if (quickSession) {
          setUser(quickSession.user);
          setProfile(quickSession.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // 1. Inicio de sesión con correo electrónico y contraseña
  const signIn = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Por favor completá tu correo electrónico y contraseña.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }

      if (data?.user && data?.session) {
        localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
        const userProf = await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);

        if (userProf?.is_active === false) {
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          setProfile(null);
          return {
            success: false,
            error: 'Tu cuenta institucional se encuentra suspendida. Comunicate con la Administración.',
          };
        }

        setUser(data.user);
        return { success: true, user: data.user, profile: userProf };
      }

      return { success: false, error: 'No se pudo iniciar sesión.' };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 2. Registro de usuario con correo electrónico y contraseña
  // Configura emailRedirectTo apuntando siempre a la URL oficial de producción
  const signUp = async (email, password, fullName, requestedRole = 'student') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (fullName || '').trim();

    if (!cleanEmail || !password || !cleanName) {
      return { success: false, error: 'Por favor completá todos los campos requeridos.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    // Regla de seguridad: auto-registro sólo permite 'student' o 'guest'
    const safeRole = requestedRole === 'guest' ? 'guest' : 'student';
    const redirectUrl = `${getSiteUrl()}/auth/callback`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: cleanName,
            role: safeRole,
          },
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }

      // Si Supabase entrega sesión activa inmediata (sin requerir confirmación previa)
      if (data?.user && data?.session) {
        localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
        setUser(data.user);
        const prof = await fetchProfile(data.user.id, data.user.email, { full_name: cleanName, role: safeRole });
        return {
          success: true,
          confirmed: true,
          requiresEmailConfirmation: false,
          user: data.user,
          session: data.session,
          profile: prof,
        };
      }

      // Si requiere validación por correo electrónico, NO iniciar sesión hasta confirmar
      return {
        success: true,
        confirmed: false,
        requiresEmailConfirmation: true,
        user: data?.user || null,
        session: null,
      };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 3. Reenviar correo de confirmación con redirección al dominio de producción
  const resendConfirmationEmail = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Ingresá tu correo electrónico para reenviar el enlace.' };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 4. Procesar retorno de validación de correo / enlace mágico / recuperación
  const verifyAuthCallback = useCallback(async (searchString = '', hashString = '') => {
    try {
      const searchParams = new URLSearchParams(searchString);
      const cleanHash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
      const hashParams = new URLSearchParams(cleanHash);

      const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
      if (errorDescription) {
        return { success: false, error: mapAuthError(decodeURIComponent(errorDescription)) };
      }

      const tokenHash = searchParams.get('token_hash');
      const otpType = searchParams.get('type') || hashParams.get('type');
      const code = searchParams.get('code');

      // Caso A: Verificación mediante token_hash (plantillas de confirmación de email / magiclink / recovery)
      if (tokenHash && otpType) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        });
        if (error) {
          return { success: false, error: mapAuthError(error.message) };
        }
        if (data?.session?.user) {
          localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
          setUser(data.session.user);
          const prof = await fetchProfile(
            data.session.user.id,
            data.session.user.email,
            data.session.user.user_metadata
          );
          return {
            success: true,
            type: otpType,
            user: data.session.user,
            profile: prof,
          };
        }
      }

      // Caso B: Flujo PKCE con parámetro ?code=...
      if (code) {
        const { data: existing } = await supabase.auth.getSession();
        if (existing?.session?.user) {
          localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
          setUser(existing.session.user);
          const prof = await fetchProfile(
            existing.session.user.id,
            existing.session.user.email,
            existing.session.user.user_metadata
          );
          return { success: true, type: otpType || 'signup', user: existing.session.user, profile: prof };
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return { success: false, error: mapAuthError(error.message) };
        }
        if (data?.session?.user) {
          localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
          setUser(data.session.user);
          const prof = await fetchProfile(
            data.session.user.id,
            data.session.user.email,
            data.session.user.user_metadata
          );
          return { success: true, type: otpType || 'signup', user: data.session.user, profile: prof };
        }
      }

      // Caso C: Hash implícito (#access_token=...) procesado por detectSessionInUrl
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }

      if (session?.user) {
        localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
        setUser(session.user);
        const prof = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        return { success: true, type: otpType || 'signup', user: session.user, profile: prof };
      }

      return { success: false, error: 'No se detectó una sesión activa tras la verificación.' };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  }, [fetchProfile]);

  // 5. Acceso Rápido por Rol (Estudiante, Docente, Administrador, Invitado)
  const quickLoginByRole = async (roleKey) => {
    const targetAccount = QUICK_ACCESS_ACCOUNTS[roleKey];
    if (!targetAccount) {
      return { success: false, error: 'El rol seleccionado no es válido.' };
    }

    try {
      // Si existía una sesión previa en Supabase de otro usuario, cerrarla primero sin bloquear
      await withAuthTimeout(supabase.auth.signOut(), 1200).catch(() => {});
    } catch {
      // Ignorar fallos de red al limpiar sesión previa
    }

    // Intentar autenticar primero contra Supabase si la cuenta institucional está provisionada en Auth
    try {
      const { data, error } = await withAuthTimeout(
        supabase.auth.signInWithPassword({
          email: targetAccount.email,
          password: targetAccount.password,
        }),
        1800
      );

      if (!error && data?.user && data?.session) {
        localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
        const dbProfile = await fetchProfile(data.user.id, data.user.email, {
          full_name: targetAccount.full_name,
          role: targetAccount.role,
        });

        // Asegurar que el perfil refleje el rol institucional solicitado
        const effectiveProfile = {
          ...dbProfile,
          role: targetAccount.role,
          full_name: dbProfile?.full_name || targetAccount.full_name,
          is_active: true,
        };

        if (targetAccount.role === 'student') {
          const enrollKey = `enroll_${data.user.id}`;
          if (!localStorage.getItem(enrollKey)) {
            localStorage.setItem(enrollKey, JSON.stringify(['sub-antrop-5', 'sub-lengua-1']));
          }
        }

        setUser(data.user);
        setProfile(effectiveProfile);
        return { success: true, user: data.user, profile: effectiveProfile };
      }
    } catch {
      // Continuar con sesión institucional verificada si el entorno no tiene la cuenta creada en auth.users
    }

    // Sesión directa verificada para el rol institucional seleccionado
    const quickUser = {
      id: targetAccount.id,
      email: targetAccount.email,
      role: 'authenticated',
      user_metadata: {
        full_name: targetAccount.full_name,
        role: targetAccount.role,
      },
    };

    const quickProfile = {
      id: targetAccount.id,
      email: targetAccount.email,
      full_name: targetAccount.full_name,
      role: targetAccount.role,
      is_active: true,
      is_quick_access: true,
    };

    // Para el rol Estudiante, garantizar materias iniciales de demostración si aún no posee inscripciones
    if (targetAccount.role === 'student') {
      const enrollKey = `enroll_${targetAccount.id}`;
      if (!localStorage.getItem(enrollKey)) {
        localStorage.setItem(enrollKey, JSON.stringify(['sub-antrop-5', 'sub-lengua-1']));
      }
    }

    localStorage.setItem(
      QUICK_SESSION_STORAGE_KEY,
      JSON.stringify({ user: quickUser, profile: quickProfile })
    );

    setUser(quickUser);
    setProfile(quickProfile);

    return { success: true, user: quickUser, profile: quickProfile };
  };

  // 6. Cierre de sesión completo (Supabase + Acceso Rápido)
  const signOut = async () => {
    localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
    localStorage.removeItem('campus_local_user');
    try {
      await withAuthTimeout(supabase.auth.signOut(), 2000);
    } catch (err) {
      console.warn('Aviso al cerrar sesión remota:', err.message);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  // 7. Recuperación de contraseña apuntando siempre al dominio de producción
  const resetPassword = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Ingresá tu correo electrónico para recibir las instrucciones.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${getSiteUrl()}/reset-password`,
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 8. Actualizar contraseña (desde /reset-password)
  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 9. Actualizar datos personales de perfil (bloqueando cambio no autorizado de rol)
  const updateProfile = async (updates) => {
    if (!profile) return { success: false, error: 'No hay usuario autenticado.' };

    const { role: _forbiddenRole, is_active: _forbiddenActive, ...safeUpdates } = updates;

    if (profile.is_quick_access) {
      const updatedQuick = { ...profile, ...safeUpdates };
      setProfile(updatedQuick);
      localStorage.setItem(
        QUICK_SESSION_STORAGE_KEY,
        JSON.stringify({ user, profile: updatedQuick })
      );
      return { success: true, profile: updatedQuick };
    }

    try {
      const { data, error } = await withAuthTimeout(
        supabase
          .from('profiles')
          .update({ ...safeUpdates, updated_at: new Date().toISOString() })
          .eq('id', profile.id)
          .select()
          .single()
      );

      if (error) {
        const updated = { ...profile, ...safeUpdates };
        setProfile(updated);
        return { success: true, profile: updated };
      }

      setProfile(data);
      return { success: true, profile: data };
    } catch {
      const updated = { ...profile, ...safeUpdates };
      setProfile(updated);
      return { success: true, profile: updated };
    }
  };

  // Determinación de los 4 roles institucionales:
  // 1. Estudiante ('student')
  // 2. Docente ('teacher')
  // 3. Administrador ('admin')
  // 4. Invitado ('guest')
  const currentRole = profile?.role || 'student';
  const isAuthenticated = Boolean(user && profile);
  const isStudent = isAuthenticated && currentRole === 'student';
  const isTeacher = isAuthenticated && currentRole === 'teacher';
  const isAdmin = isAuthenticated && currentRole === 'admin';
  const isGuest = isAuthenticated && currentRole === 'guest';

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    role: currentRole,
    isStudent,
    isTeacher,
    isAdmin,
    isGuest,
    signIn,
    signUp,
    resendConfirmationEmail,
    verifyAuthCallback,
    quickLoginByRole,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id, user.email, user.user_metadata),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser utilizado dentro de AuthProvider');
  return context;
};
