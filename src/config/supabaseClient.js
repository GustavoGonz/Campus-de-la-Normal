import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ezrtknrpwutdxhdhanvb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cnRrbnJwd3V0ZHhoZGhhbnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzczOTQsImV4cCI6MjEwODYxMzM5NH0.UxXcE_qZ5k4d1or16hpr2lvGb0duRyGdUwOThlx_X5o';

export const PRODUCTION_SITE_URL = 'https://campus-de-la-normal.vercel.app';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isRemoteUUID = (id) => {
  if (!id) return false;
  const str = String(id);
  if (str.startsWith('00000000-0000-4000-8000-')) return false;
  return UUID_REGEX.test(str);
};

let remoteUnavailableUntil = 0;

export const isRemoteAvailable = () => Date.now() >= remoteUnavailableUntil;

export const markRemoteUnavailable = (cooldownMs = 8000) => {
  remoteUnavailableUntil = Date.now() + cooldownMs;
};

/**
 * Obtiene la URL oficial de redirección para flujos de autenticación por correo
 * (registro, confirmación de cuenta, recuperación de contraseña y enlaces mágicos).
 * Garantiza que nunca se redirija a entornos locales por error.
 */
export const getSiteUrl = () => {
  const configuredUrl = (import.meta.env.VITE_SITE_URL || '').trim();
  if (configuredUrl && configuredUrl.startsWith('https://')) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.trim();
    if (origin.startsWith('https://')) {
      return origin.replace(/\/+$/, '');
    }
  }

  return PRODUCTION_SITE_URL;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};
