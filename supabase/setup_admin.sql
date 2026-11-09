-- ==============================================================================
-- CAMPUS: LA NORMAL - Configuración de Roles y Administrador
-- Escuela Normal Dr. Pedro Ignacio de Castro Barros • «Aprender mejor, juntos»
-- ==============================================================================
--
-- Orden de Roles Institucionales:
-- 1. Estudiante ('student')
-- 2. Docente ('teacher')
-- 3. Administrador ('admin')
-- 4. Invitado ('guest')
--
-- Instrucciones para asignar el primer Administrador:
-- 1. Registrate normalmente desde la pantalla de inicio con tu correo de Gmail.
-- 2. En la consola SQL de Supabase (SQL Editor), ejecutá:

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tu_correo@gmail.com';

-- Para verificar los usuarios y sus roles asignados:
SELECT id, email, full_name, role, is_active FROM public.profiles ORDER BY role;
