-- ==============================================================================
-- CAMPUS: LA NORMAL - MIGRACIÓN INCREMENTAL: 4 ROLES, TUTOR IA Y POLÍTICAS RLS
-- Escuela Normal Dr. Pedro Ignacio de Castro Barros • «Aprender mejor, juntos»
-- ==============================================================================

-- 1. Actualizar restricción de roles en la tabla profiles para admitir 'guest'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'admin', 'guest'));

-- 2. Asegurar columnas opcionales en profiles, subjects y materials
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'is_public') THEN
    ALTER TABLE public.subjects ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'materials' AND column_name = 'is_public') THEN
    ALTER TABLE public.materials ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 3. Permitir consultas generales del Tutor IA sin requerir subject_id obligatorio
DO $$
BEGIN
  ALTER TABLE public.ai_conversations ALTER COLUMN subject_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Actualizar función handle_new_user() para registro por correo/contraseña y bloqueo de roles elevados
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

-- 5. Función de servidor para comprobar rol invitado
CREATE OR REPLACE FUNCTION public.is_guest()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'guest');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. Reforzar políticas RLS en profiles evitando auto-escalada de rol
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role IN ('student', 'guest'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = public.get_current_role());

-- 7. Actualizar políticas de biblioteca PDF y Tutor IA
DROP POLICY IF EXISTS "Materials viewable" ON public.materials;
DROP POLICY IF EXISTS "Materials viewable by enrolled students and teachers" ON public.materials;

CREATE POLICY "Materials viewable by enrolled students and teachers" ON public.materials
  FOR SELECT TO authenticated
  USING (
    (public.is_enrolled_in(subject_id) AND publication_status = 'published' AND NOT public.is_guest())
    OR public.is_teacher_of(subject_id)
  );

DROP POLICY IF EXISTS "Public materials viewable by everyone" ON public.materials;
CREATE POLICY "Public materials viewable by everyone" ON public.materials
  FOR SELECT TO anon, authenticated
  USING (is_public = TRUE AND publication_status = 'published');

DROP POLICY IF EXISTS "Users manage own ai conversations" ON public.ai_conversations;
CREATE POLICY "Users manage own ai conversations" ON public.ai_conversations
  FOR ALL TO authenticated
  USING (student_id = auth.uid() OR public.is_admin())
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

-- 8. Crear bucket de almacenamiento en Supabase Storage si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;
