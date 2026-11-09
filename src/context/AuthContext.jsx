import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext(null);

// Mapeo amigable de errores de Supabase a mensajes claros en español
const mapAuthError = (errMessage) => {
  if (!errMessage) return 'Ocurrió un error inesperado al procesar la solicitud.';
  const msg = errMessage.toLowerCase();
  
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos. Verificá que los datos ingresados sean correctos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Tu cuenta de correo no ha sido confirmada todavía. Por favor revisá tu casilla de Gmail (incluida la carpeta de correo no deseado/spam) y hacé clic en el enlace de confirmación.';
  }
  if (msg.includes('user already registered') || msg.includes('user already exists')) {
    return 'Ya existe una cuenta registrada con este correo electrónico. Si olvidaste tu clave, podés recuperarla.';
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Demasiados intentos en poco tiempo. Por seguridad, por favor esperá unos instantes antes de volver a intentar.';
  }
  if (msg.includes('signup disabled')) {
    return 'El registro de nuevos usuarios se encuentra temporalmente deshabilitado.';
  }
  if (msg.includes('provider is not enabled')) {
    return 'El acceso con Google OAuth aún no se encuentra activado en el panel de Supabase. Podés iniciar sesión con correo y contraseña, o habilitar el proveedor Google en el panel institucional.';
  }
  return errMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener o crear perfil del usuario autenticado
  const fetchProfile = async (userId, userEmail, userMetadata = null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error al consultar perfil:', error);
      }

      if (data) {
        setProfile(data);
        return data;
      }

      // Si no existe perfil en la tabla (por ejemplo, primer login con Google OAuth o demora de trigger)
      const defaultName = userMetadata?.full_name || 
                          userMetadata?.name || 
                          (userEmail ? userEmail.split('@')[0] : 'Usuario');
      const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture || null;
      
      // Seguridad: el rol inicial es 'student' por defecto
      const requestedRole = (userMetadata?.role === 'guest') ? 'guest' : 'student';

      const newProfile = {
        id: userId,
        email: (userEmail || '').trim().toLowerCase(),
        full_name: defaultName,
        role: requestedRole,
        avatar_url: avatarUrl,
        is_active: true,
      };

      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.warn('Upsert de perfil local:', insertError.message);
        setProfile(newProfile);
        return newProfile;
      }

      setProfile(created || newProfile);
      return created || newProfile;
    } catch (err) {
      console.error('Error en fetchProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Inicializar sesión con Supabase Auth
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error al obtener sesión inicial:', error.message);
        }
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar eventos de autenticación de Supabase (login, logout, refresh, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 1. Inicio de sesión con correo (Gmail u otro) y contraseña
  const signIn = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Por favor completá tu correo y contraseña.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }

      if (data?.user) {
        setUser(data.user);
        const userProf = await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
        return { success: true, user: data.user, profile: userProf };
      }

      return { success: false, error: 'No se pudo iniciar sesión.' };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 2. Inicio de sesión directo con Google OAuth (Gmail)
  const signInWithGoogle = async () => {
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/panel`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 3. Registro de usuario con email, contraseña y nombre
  // SEGURIDAD: Solo permite roles 'student' o 'guest'. Nunca 'admin' ni 'teacher'.
  const signUp = async (email, password, fullName, requestedRole = 'student') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (fullName || '').trim();

    if (!cleanEmail || !password || !cleanName) {
      return { success: false, error: 'Por favor completá todos los campos requeridos.' };
    }

    // Regla de seguridad: los usuarios no pueden asignarse roles docentes ni administrativos por sí mismos
    const safeRole = requestedRole === 'guest' ? 'guest' : 'student';

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: safeRole,
          },
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }

      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id, data.user.email, { full_name: cleanName, role: safeRole });
        return { success: true, user: data.user, session: data.session };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 4. Cierre de sesión real en Supabase
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  // 5. Recuperación de contraseña por email (Gmail)
  const resetPassword = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Ingresá tu correo electrónico para recibir las instrucciones.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err.message) };
    }
  };

  // 6. Actualizar contraseña (cuando el usuario llega desde el link de recuperación)
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

  // 7. Actualizar datos de perfil (nombre, biografía, teléfono - sin permitir cambiar de rol directamente)
  const updateProfile = async (updates) => {
    if (!profile) return { success: false, error: 'No hay usuario autenticado.' };
    
    // Proteger contra alteración no autorizada de rol
    const { role: forbiddenRole, ...safeUpdates } = updates;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        const updated = { ...profile, ...safeUpdates };
        setProfile(updated);
        return { success: true, profile: updated };
      }

      setProfile(data);
      return { success: true, profile: data };
    } catch (err) {
      const updated = { ...profile, ...safeUpdates };
      setProfile(updated);
      return { success: true, profile: updated };
    }
  };

  // Determinación de roles en orden oficial:
  // 1. Estudiante ('student')
  // 2. Docente ('teacher')
  // 3. Administrador ('admin')
  // 4. Invitado ('guest')
  const currentRole = profile?.role || 'student';
  const isStudent = currentRole === 'student';
  const isTeacher = currentRole === 'teacher';
  const isAdmin = currentRole === 'admin';
  const isGuest = currentRole === 'guest';

  const value = {
    user,
    profile,
    loading,
    role: currentRole,
    isStudent,
    isTeacher,
    isAdmin,
    isGuest,
    signIn,
    signInWithGoogle,
    signUp,
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
