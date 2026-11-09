-- ==============================================================================
-- CAMPUS: LA NORMAL - «Aprender mejor, juntos»
-- Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros - La Rioja, Argentina
-- Script de Base de Datos PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: PROFILES (Perfiles de usuarios vinculados a Auth)
-- Almacena los datos y el rol:
-- 1. Estudiante ('student')
-- 2. Docente ('teacher')
-- 3. Administrador ('admin')
-- 4. Invitado ('guest')
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'guest')) DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía con la restricción anterior de 3 roles, actualizamos el CHECK:
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'admin', 'guest'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 3. TABLA: COURSES (Cursos y Divisiones institucionales)
-- Ej: "1° Año - 1° División - Turno Mañana"
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,            -- Ej: '1° Año', '2° Año', etc.
  division TEXT NOT NULL,        -- Ej: '1° División', '2° División', 'A'
  shift TEXT DEFAULT 'Mañana',   -- 'Mañana', 'Tarde', 'Noche'
  year INT DEFAULT 2026,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABLA: SUBJECTS (Materias / Espacios curriculares)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  access_type TEXT CHECK (access_type IN ('open', 'request_only', 'invite_only')) DEFAULT 'request_only',
  color TEXT DEFAULT '#1e3a8a',
  syllabus JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABLA: SUBJECT_TEACHERS (Asignación de docentes a materias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, teacher_id)
);

-- ==============================================================================
-- 6. TABLA: SUBJECT_STUDENTS (Matriculaciones autorizadas de alumnos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subject_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, student_id)
);

-- ==============================================================================
-- 7. TABLA: ACCESS_REQUESTS (Solicitudes de acceso de estudiantes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  message TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  response_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABLA: FOLDERS (Estructura de carpetas de la biblioteca docente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. TABLA: MATERIALS (Biblioteca Digital de Archivos PDF)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  unit_number INT,
  unit_title TEXT,
  resource_type TEXT CHECK (resource_type IN ('pdf', 'other')) DEFAULT 'pdf',
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_name TEXT NOT NULL,
  mime_type TEXT DEFAULT 'application/pdf',
  version INT DEFAULT 1,
  publication_status TEXT CHECK (publication_status IN ('draft', 'published', 'hidden', 'archived')) DEFAULT 'published',
  is_public BOOLEAN DEFAULT FALSE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. TABLA: CLASSES (Clases y cronograma docente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  class_date DATE NOT NULL,
  title TEXT NOT NULL,
  unit_topic TEXT,
  content TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. TABLA: CLASS_MATERIALS (Vinculación de documentos PDF de la biblioteca a clases)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  UNIQUE(class_id, material_id)
);

-- ==============================================================================
-- 12. TABLA: PREVIOUS_SUBJECTS_PREP (Módulo de Materias Previas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.previous_subjects_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  target_exam_date DATE,
  notes TEXT,
  progress_percent INT DEFAULT 0,
  completed_units JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ==============================================================================
-- 13. TABLA: NOTIFICATIONS (Sistema interno de avisos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. TABLA: AI_CONVERSATIONS (Interacciones del Tutor de IA por materia)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 15. FUNCIONES Y DISPARADORES DE SEGURIDAD
-- ==============================================================================

-- Disparador automático al registrarse un usuario en Supabase Auth
-- SEGURIDAD: Los nuevos registros se asignan siempre como 'student' o 'guest',
-- NUNCA como 'teacher' ni 'admin' sin autorización explícita.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_role TEXT;
BEGIN
  initial_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  -- Seguridad estricta: bloquear auto-asignación de roles privilegiados
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funciones de verificación de rol en el servidor
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_teacher_of(sub_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.subject_teachers st
    WHERE st.subject_id = sub_id AND st.teacher_id = auth.uid()
  ) OR public.is_admin();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_enrolled_in(sub_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.subject_students ss
    WHERE ss.subject_id = sub_id AND ss.student_id = auth.uid() AND ss.status = 'active'
  ) OR public.is_teacher_of(sub_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Comprobar si el usuario actual es invitado (guest)
CREATE OR REPLACE FUNCTION public.is_guest()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'guest');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 16. SEGURIDAD A NIVEL DE FILA (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_subjects_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas en Profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles viewable by authenticated users') THEN
    CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access on profiles') THEN
    CREATE POLICY "Admins full access on profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());
  END IF;
END $$;

-- Políticas en Materials (Biblioteca Digital de Archivos PDF)
DO $$
BEGIN
  -- Docentes ven todos los materiales de sus materias; estudiantes matriculados ven únicamente los publicados ('published')
  -- Invitados (guest) NO pueden acceder a los materiales protegidos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Materials viewable by enrolled students and teachers') THEN
    CREATE POLICY "Materials viewable by enrolled students and teachers" ON public.materials FOR SELECT TO authenticated 
      USING (
        (public.is_enrolled_in(subject_id) AND publication_status = 'published' AND NOT public.is_guest()) 
        OR public.is_teacher_of(subject_id)
      );
  END IF;

  -- Consulta pública al Tutor IA: cualquier persona (incluido anónimo o invitado) puede consultar documentos marcados como públicos autorizados
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public materials viewable by everyone') THEN
    CREATE POLICY "Public materials viewable by everyone" ON public.materials FOR SELECT TO anon, authenticated
      USING (is_public = TRUE AND publication_status = 'published');
  END IF;

  -- Solo docentes a cargo y administradores pueden subir, modificar o eliminar materiales
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers and admin manage materials') THEN
    CREATE POLICY "Teachers and admin manage materials" ON public.materials FOR ALL TO authenticated 
      USING (public.is_teacher_of(subject_id))
      WITH CHECK (public.is_teacher_of(subject_id));
  END IF;
END $$;

-- Políticas en Subjects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Subjects viewable by authenticated') THEN
    CREATE POLICY "Subjects viewable by authenticated" ON public.subjects FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers and admin manage subjects') THEN
    CREATE POLICY "Teachers and admin manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_teacher_of(id) OR public.is_admin());
  END IF;
END $$;

-- Políticas de Storage para el bucket 'course-materials'
-- Configurar desde la consola de Supabase Storage:
-- 1. Crear el bucket 'course-materials' como público para lectura autorizada o con políticas RLS:
-- INSERT: solo docentes autenticados: (role IN ('teacher', 'admin'))
-- SELECT: usuarios autenticados matriculados o docentes
-- DELETE: docentes de la materia o admin
