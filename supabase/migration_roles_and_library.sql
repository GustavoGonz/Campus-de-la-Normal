-- ==============================================================================
-- CAMPUS: LA NORMAL - MIGRACIÓN INCREMENTAL: 4 ROLES Y BIBLIOTECA DIGITAL PDF
-- Escuela Normal Dr. Pedro Ignacio de Castro Barros • «Aprender mejor, juntos»
-- ==============================================================================

-- 1. Actualizar restricción de roles en la tabla profiles para admitir 'guest'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'teacher', 'admin', 'guest'));

-- 2. Asegurar columna avatar_url en profiles si no existía
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 3. Actualizar función handle_new_user() para soporte de Google OAuth y bloqueo de roles elevados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_role TEXT;
BEGIN
  initial_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  -- Seguridad estricta: sólo permitir 'student' o 'guest' en auto-registro
  IF initial_role NOT IN ('student', 'guest') THEN
    initial_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    initial_role,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función de servidor para comprobar rol invitado
CREATE OR REPLACE FUNCTION public.is_guest()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'guest');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. Permitir inserción del propio perfil si no existía previamente (soporte para primer login con Google)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- 6. Actualizar políticas de biblioteca PDF para proteger archivos ante accesos de invitados
DROP POLICY IF EXISTS "Materials viewable" ON public.materials;
DROP POLICY IF EXISTS "Materials viewable by enrolled students and teachers" ON public.materials;

CREATE POLICY "Materials viewable by enrolled students and teachers" ON public.materials FOR SELECT TO authenticated 
  USING (
    (public.is_enrolled_in(subject_id) AND publication_status = 'published' AND NOT public.is_guest()) 
    OR public.is_teacher_of(subject_id)
  );

-- 7. Crear bucket de almacenamiento en Supabase Storage si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Soporte de fuentes públicas autorizadas para el Tutor IA y Acceso Público
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'is_public') THEN
    ALTER TABLE public.materials ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 9. Política RLS: Permitir consulta pública a documentos explícitamente autorizados por docentes/admin
DROP POLICY IF EXISTS "Public materials viewable by everyone" ON public.materials;
CREATE POLICY "Public materials viewable by everyone" ON public.materials 
  FOR SELECT TO anon, authenticated 
  USING (is_public = TRUE AND publication_status = 'published');

