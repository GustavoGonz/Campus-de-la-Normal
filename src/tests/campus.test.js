import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { supabase, PRODUCTION_SITE_URL, getSiteUrl } from '../config/supabaseClient';
import { AuthProvider, useAuth, QUICK_ACCESS_ACCOUNTS } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { subjectService } from '../services/subjectService';
import { materialService } from '../services/materialService';
import { previousSubjectsService } from '../services/previousSubjectsService';
import { aiService } from '../services/aiService';
import { adminService } from '../services/adminService';
import { storageService } from '../services/storageService';
import { AITutorPage } from '../pages/ai/AITutorPage';
import { LandingPage } from '../pages/public/LandingPage';
import { AuthCallbackPage } from '../pages/public/AuthCallbackPage';
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Mock de localStorage para el entorno de pruebas
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();

const collectProjectFiles = (dir, acc = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectProjectFiles(fullPath, acc);
    } else if (/\.(js|jsx|json|sql|md|html|css|env|example)$/.test(entry.name) || entry.name.startsWith('.env')) {
      acc.push(fullPath);
    }
  }
  return acc;
};

describe('Campus: La Normal — Suite Integral de Auditoría y Validación', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ============================================================================
  // PROBLEMA 1: TUTOR IA UNIFICADO (PÚBLICO Y AUTENTICADO)
  // ============================================================================
  describe('Problema 1: Unificación del Tutor IA en toda la plataforma', () => {
    it('Garantiza un único componente AITutorPage y la eliminación de MainCampusHome duplicado', () => {
      expect(typeof AITutorPage).toBe('function');

      const removedDuplicatePath = path.join(projectRoot, 'src/pages/dashboard/MainCampusHome.jsx');
      expect(fs.existsSync(removedDuplicatePath)).toBe(false);

      const consumers = [
        'src/pages/public/LandingPage.jsx',
        'src/pages/student/StudentDashboard.jsx',
        'src/pages/teacher/TeacherDashboard.jsx',
        'src/pages/guest/GuestDashboard.jsx',
        'src/pages/admin/AdminPanel.jsx',
        'src/App.jsx',
      ];

      for (const relPath of consumers) {
        const content = fs.readFileSync(path.join(projectRoot, relPath), 'utf8');
        expect(content).toContain('AITutorPage');
      }
    });

    it('Funciona idénticamente para visitantes públicos y para los 4 roles autenticados en consulta general', async () => {
      const prompt = '¿Me podés explicar el tema de la segunda unidad de Antropología?';

      // 1. Usuario público no autenticado
      const publicRes = await aiService.askTutor(null, 'public', prompt, 'explain', {
        userRole: 'guest',
      });
      expect(publicRes.found).toBe(true);
      expect(publicRes.message).toContain('EJE N° 2');
      expect(publicRes.sources.length).toBeGreaterThanOrEqual(2);

      // 2. Estudiante autenticado
      const studentRes = await aiService.askTutor(
        null,
        QUICK_ACCESS_ACCOUNTS.student.id,
        prompt,
        'explain',
        { userRole: 'student', userName: QUICK_ACCESS_ACCOUNTS.student.full_name }
      );
      expect(studentRes.found).toBe(true);
      expect(studentRes.message).toContain('EJE N° 2');
      expect(studentRes.sources.length).toBeGreaterThanOrEqual(2);

      // 3. Docente autenticado
      const teacherRes = await aiService.askTutor(
        null,
        QUICK_ACCESS_ACCOUNTS.teacher.id,
        prompt,
        'summary',
        { userRole: 'teacher', userName: QUICK_ACCESS_ACCOUNTS.teacher.full_name }
      );
      expect(teacherRes.found).toBe(true);
      expect(teacherRes.message).toContain('Síntesis Educativa');

      // 4. Administrador autenticado
      const adminRes = await aiService.askTutor(
        null,
        QUICK_ACCESS_ACCOUNTS.admin.id,
        prompt,
        'quiz',
        { userRole: 'admin', userName: QUICK_ACCESS_ACCOUNTS.admin.full_name }
      );
      expect(adminRes.found).toBe(true);
      expect(adminRes.message).toContain('Cuestionario de Repaso');

      // 5. Invitado autenticado
      const guestRes = await aiService.askTutor(
        null,
        QUICK_ACCESS_ACCOUNTS.guest.id,
        prompt,
        'explain',
        { userRole: 'guest', userName: QUICK_ACCESS_ACCOUNTS.guest.full_name }
      );
      expect(guestRes.found).toBe(true);
      expect(guestRes.message).toContain('EJE N° 2');
    });

    it('Responde correctamente incluso cuando hay una materia UUID seleccionada o palabras genéricas como "materia"', async () => {
      const uuidSubject = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Lengua y Literatura I',
      };

      // Consulta explícita sobre otra materia mientras hay un filtro seleccionado
      const crossSubjectRes = await aiService.askTutor(
        uuidSubject,
        QUICK_ACCESS_ACCOUNTS.student.id,
        '¿Cuáles son los 4 tipos de normas en la materia Formación Ética y Ciudadana?',
        'explain',
        { userRole: 'student' }
      );

      expect(crossSubjectRes.found).toBe(true);
      expect(crossSubjectRes.sources.some((s) => s.subject.includes('Ética'))).toBe(true);

      // Historial almacenado y limpiado correctamente
      const history = await aiService.getChatHistory(uuidSubject.id, QUICK_ACCESS_ACCOUNTS.student.id);
      expect(history.length).toBe(2);

      await aiService.clearChat(uuidSubject.id, QUICK_ACCESS_ACCOUNTS.student.id);
      const afterClear = await aiService.getChatHistory(uuidSubject.id, QUICK_ACCESS_ACCOUNTS.student.id);
      expect(afterClear.length).toBe(0);
    });

    it('Reconoce honestamente cuándo no dispone de información suficiente sin inventar datos', async () => {
      const prompt = '¿Cuál es el temario del examen de Física Cuántica Avanzada del año 2045 en La Normal?';
      const res = await aiService.askTutor(null, 'public', prompt, 'explain');

      expect(res.found).toBe(false);
      expect(res.message).toContain('Información institucional no disponible');
      expect(res.message).toContain('no formula suposiciones como si fueran hechos');
      expect(res.sources.length).toBe(0);
    });
  });

  // ============================================================================
  // PROBLEMA 2: ELIMINACIÓN TOTAL DE AUTENTICACIÓN SOCIAL OAUTH
  // ============================================================================
  describe('Problema 2: Eliminación completa de autenticación con Google OAuth', () => {
    it('Verifica que no exista ninguna referencia visual ni en código a Google OAuth', () => {
      const files = collectProjectFiles(path.join(projectRoot, 'src')).filter(
        (f) => !f.endsWith('campus.test.js')
      );

      const forbiddenTokens = [
        ['Continuar con ', 'Google'].join(''),
        ['signInWith', 'OAuth'].join(''),
        ['signInWith', 'Google'].join(''),
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        for (const token of forbiddenTokens) {
          expect(content).not.toContain(token);
        }
      }
    });
  });

  // ============================================================================
  // PROBLEMA 3: REDIRECCIÓN DE CONFIRMACIÓN DE CORREO AL DOMINIO DE PRODUCCIÓN
  // ============================================================================
  describe('Problema 3: URL oficial de producción y ausencia total de referencias locales', () => {
    it('Configura el dominio oficial de producción https://campus-de-la-normal.vercel.app', () => {
      expect(PRODUCTION_SITE_URL).toBe('https://campus-de-la-normal.vercel.app');
      expect(getSiteUrl()).toBe('https://campus-de-la-normal.vercel.app');
      expect(getSiteUrl().startsWith('https://')).toBe(true);
    });

    it('Verifica que no exista ninguna referencia a servidor local en todo el repositorio', () => {
      const forbiddenLoopbackDomain = ['local', 'host'].join('');
      const allFiles = collectProjectFiles(projectRoot).filter(
        (f) => !f.endsWith('package-lock.json')
      );

      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8').toLowerCase();
        expect(content).not.toContain(forbiddenLoopbackDomain);
      }
    });

    it('Registra la ruta /auth/callback y las reglas SPA en vercel.json para validación de correo y recuperación', () => {
      expect(typeof AuthCallbackPage).toBe('function');

      const appSource = fs.readFileSync(path.join(projectRoot, 'src/App.jsx'), 'utf8');
      expect(appSource).toContain('path="/auth/callback"');
      expect(appSource).toContain('path="/reset-password"');

      const authSource = fs.readFileSync(path.join(projectRoot, 'src/context/AuthContext.jsx'), 'utf8');
      expect(authSource).toContain('emailRedirectTo: redirectUrl');
      expect(authSource).toContain('`${getSiteUrl()}/auth/callback`');
      expect(authSource).toContain('`${getSiteUrl()}/reset-password`');

      const vercelConfig = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'vercel.json'), 'utf8')
      );
      expect(vercelConfig.rewrites).toEqual([
        { source: '/(.*)', destination: '/index.html' },
      ]);
    });
  });

  // ============================================================================
  // PROBLEMA 4: ACCESOS RÁPIDOS POR ROL Y PERMISOS DE LOS 4 ROLES
  // ============================================================================
  describe('Problema 4: Accesos rápidos para Estudiante, Docente, Administrador e Invitado', () => {
    it('Define las 4 cuentas institucionales de Acceso Rápido en orden oficial con UUID válidos', () => {
      const keys = Object.keys(QUICK_ACCESS_ACCOUNTS);
      expect(keys).toEqual(['student', 'teacher', 'admin', 'guest']);

      expect(QUICK_ACCESS_ACCOUNTS.student.label).toBe('Estudiante');
      expect(QUICK_ACCESS_ACCOUNTS.student.role).toBe('student');

      expect(QUICK_ACCESS_ACCOUNTS.teacher.label).toBe('Docente');
      expect(QUICK_ACCESS_ACCOUNTS.teacher.role).toBe('teacher');

      expect(QUICK_ACCESS_ACCOUNTS.admin.label).toBe('Administrador');
      expect(QUICK_ACCESS_ACCOUNTS.admin.role).toBe('admin');

      expect(QUICK_ACCESS_ACCOUNTS.guest.label).toBe('Invitado');
      expect(QUICK_ACCESS_ACCOUNTS.guest.role).toBe('guest');

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const roleKey of keys) {
        expect(uuidRegex.test(QUICK_ACCESS_ACCOUNTS[roleKey].id)).toBe(true);
      }
    });

    it('Valida permisos y datos de cada uno de los 4 roles (Estudiante, Docente, Administrador, Invitado)', async () => {
      // 1. Estudiante: recibe sus materias matriculadas iniciales
      const studentSubs = await subjectService.getStudentSubjects(QUICK_ACCESS_ACCOUNTS.student.id);
      expect(studentSubs.length).toBeGreaterThan(0);

      // 2. Docente: accede a sus cátedras y aprueba solicitudes matriculando al alumno
      const teacherSubs = await subjectService.getTeacherSubjects(QUICK_ACCESS_ACCOUNTS.teacher.id);
      expect(teacherSubs.length).toBeGreaterThan(0);

      const reqResult = await subjectService.requestAccess('sub-hist-1', 'std-nuevo-1', 'Solicito matriculación');
      expect(reqResult.success).toBe(true);
      await subjectService.reviewAccessRequest(
        reqResult.data.id,
        'approved',
        QUICK_ACCESS_ACCOUNTS.teacher.id,
        'Bienvenido a Historia'
      );
      const isNowEnrolled = await subjectService.checkEnrollment('sub-hist-1', 'std-nuevo-1');
      expect(isNowEnrolled).toBe(true);

      // 3. Administrador: administra los 4 roles y crea materias y cursos
      const allUsers = await adminService.getUsers();
      expect(allUsers.length).toBeGreaterThanOrEqual(4);

      for (const targetRole of ['student', 'teacher', 'admin', 'guest']) {
        const updated = await adminService.updateUser('u3', { role: targetRole });
        expect(updated.role).toBe(targetRole);
      }

      const createdSubject = await subjectService.createSubject({
        name: 'Biología General',
        code: 'BIO-201',
        description: 'Sistemas vivos y ecología.',
        course_id: 'c3',
        access_type: 'request_only',
      });
      expect(createdSubject.name).toBe('Biología General');

      // 4. Invitado: no posee matrícula en materias privadas ni permisos de edición
      const guestSubs = await subjectService.getStudentSubjects(QUICK_ACCESS_ACCOUNTS.guest.id);
      expect(guestSubs).toEqual([]);
      const guestEnrolled = await subjectService.checkEnrollment('sub-lengua-1', QUICK_ACCESS_ACCOUNTS.guest.id);
      expect(guestEnrolled).toBe(false);
    });

    it('Verifica que DashboardRouter cargue el panel específico para cada uno de los 4 roles', () => {
      const routerSource = fs.readFileSync(
        path.join(projectRoot, 'src/pages/dashboard/DashboardRouter.jsx'),
        'utf8'
      );
      expect(routerSource).toContain('AdminPanel');
      expect(routerSource).toContain('TeacherDashboard');
      expect(routerSource).toContain('GuestDashboard');
      expect(routerSource).toContain('StudentDashboard');
    });
  });

  // ============================================================================
  // BIBLIOTECA DIGITAL PDF Y MÓDULOS PEDAGÓGICOS COMPLEMENTARIOS
  // ============================================================================
  describe('Biblioteca Digital de Archivos PDF y Materias Previas', () => {
    it('Valida exclusivamente archivos PDF menores a 50 MB y soporta subida, reemplazo y baja docente', async () => {
      expect(storageService.validateFile({ name: 'Programa.pdf', size: 1024 * 500, type: 'application/pdf' }).valid).toBe(true);
      expect(storageService.validateFile({ name: 'Trabajo.docx', size: 1024 * 200, type: 'application/msword' }).valid).toBe(false);
      expect(storageService.validateFile({ name: 'Pesado.pdf', size: 60 * 1024 * 1024, type: 'application/pdf' }).valid).toBe(false);

      const created = await materialService.uploadMaterial(
        'sub-historia-1',
        QUICK_ACCESS_ACCOUNTS.teacher.id,
        { name: 'Guia_v1.pdf', size: 100, type: 'application/pdf' },
        { title: 'Guía Unidad 1', publication_status: 'published' }
      );
      expect(created.version).toBe(1);

      const replaced = await materialService.replaceMaterialFile(
        'sub-historia-1',
        created.id,
        { name: 'Guia_v2.pdf', size: 200, type: 'application/pdf' },
        created.file_path
      );
      expect(replaced.version).toBe(2);

      await materialService.deleteMaterial('sub-historia-1', created.id, replaced.file_path);
      const remaining = await materialService.getMaterials('sub-historia-1', false);
      expect(remaining.some((m) => m.id === created.id)).toBe(false);
    });

    it('Módulo de Materias Previas actualiza el progreso por unidades', async () => {
      await previousSubjectsService.addSubjectPrep('std-prep-1', 'sub-mate-1', '2026-07-20', 'Mesa de julio');
      const updated = await previousSubjectsService.toggleUnitCompletion('std-prep-1', 'sub-mate-1', 1, 4);
      expect(updated.completed_units).toContain(1);
      expect(updated.progress_percent).toBe(25);
    });
  });

  // ============================================================================
  // PRUEBAS END-TO-END DE FLUJOS DE AUTH Y RENDERIZADO DE PÁGINAS
  // ============================================================================
  describe('Validación Final: Login, Registro, Confirmación Email, Recuperación, Accesos Rápidos y UI', () => {
    it('Renderiza LandingPage, AITutorPage, AuthCallbackPage y ResetPasswordPage sin errores ni referencias a Google', () => {
      const wrap = (node, route = '/') =>
        renderToStaticMarkup(
          React.createElement(
            AuthProvider,
            null,
            React.createElement(
              NotificationProvider,
              null,
              React.createElement(MemoryRouter, { initialEntries: [route] }, node)
            )
          )
        );

      const landingHtml = wrap(React.createElement(LandingPage));
      expect(landingHtml).toContain('Tutor IA — Asistente Pedagógico Institucional');
      expect(landingHtml).toContain('Estudiante');
      expect(landingHtml).toContain('Docente');
      expect(landingHtml).toContain('Administrador');
      expect(landingHtml).toContain('Invitado');
      expect(landingHtml).not.toContain(['Continuar con ', 'Google'].join(''));

      const tutorHtml = wrap(React.createElement(AITutorPage), '/tutor-ia');
      expect(tutorHtml).toContain('Tutor IA — Asistente Pedagógico Institucional');

      const callbackHtml = wrap(React.createElement(AuthCallbackPage), '/auth/callback');
      expect(callbackHtml).toContain('Verificando tu cuenta institucional');

      const resetHtml = wrap(React.createElement(ResetPasswordPage), '/reset-password');
      expect(resetHtml).toContain('Restablecer Contraseña');
    });

    it('Ejecuta flujos completos de signUp, verifyAuthCallback, signIn, resetPassword y los 4 quickLoginByRole', async () => {
      let capturedAuth = null;
      const CaptureConsumer = ({ onCapture }) => {
        onCapture(useAuth());
        return null;
      };

      renderToStaticMarkup(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(CaptureConsumer, {
            onCapture: (ctx) => {
              capturedAuth = ctx;
            },
          })
        )
      );
      expect(capturedAuth).toBeDefined();

      // 1. Registro (signUp) envía emailRedirectTo al dominio oficial de producción y exige confirmación si session === null
      const signUpSpy = vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: { id: '11111111-1111-4111-8111-111111111111', email: 'nuevo@gmail.com' }, session: null },
        error: null,
      });

      const signUpRes = await capturedAuth.signUp('  Nuevo@gmail.com ', 'ClaveSegura123', 'Juan Pérez', 'student');
      expect(signUpRes.success).toBe(true);
      expect(signUpRes.confirmed).toBe(false);
      expect(signUpRes.requiresEmailConfirmation).toBe(true);
      expect(signUpSpy).toHaveBeenCalledWith({
        email: 'nuevo@gmail.com',
        password: 'ClaveSegura123',
        options: {
          emailRedirectTo: 'https://campus-de-la-normal.vercel.app/auth/callback',
          data: { full_name: 'Juan Pérez', role: 'student' },
        },
      });

      // 2. Validación de correo (verifyAuthCallback con token_hash) crea la sesión
      const verifyOtpSpy = vi.spyOn(supabase.auth, 'verifyOtp').mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'jwt-confirmed',
            user: {
              id: '11111111-1111-4111-8111-111111111111',
              email: 'nuevo@gmail.com',
              user_metadata: { full_name: 'Juan Pérez', role: 'student' },
            },
          },
        },
        error: null,
      });

      const callbackRes = await capturedAuth.verifyAuthCallback('?token_hash=abc123hash&type=signup', '');
      expect(callbackRes.success).toBe(true);
      expect(callbackRes.user.email).toBe('nuevo@gmail.com');
      expect(verifyOtpSpy).toHaveBeenCalledWith({ token_hash: 'abc123hash', type: 'signup' });

      // 3. Login (signIn) con correo y contraseña
      const signInSpy = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: {
          user: {
            id: '11111111-1111-4111-8111-111111111111',
            email: 'nuevo@gmail.com',
            user_metadata: { full_name: 'Juan Pérez', role: 'student' },
          },
          session: { access_token: 'jwt-login' },
        },
        error: null,
      });

      const loginRes = await capturedAuth.signIn(' Nuevo@gmail.com ', 'ClaveSegura123');
      expect(loginRes.success).toBe(true);
      expect(loginRes.profile.role).toBe('student');
      expect(signInSpy).toHaveBeenCalledWith({ email: 'nuevo@gmail.com', password: 'ClaveSegura123' });

      // 4. Recuperación de contraseña (resetPassword + updatePassword) apunta al dominio de producción
      const resetSpy = vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValueOnce({
        data: {},
        error: null,
      });
      const resetRes = await capturedAuth.resetPassword(' Nuevo@gmail.com ');
      expect(resetRes.success).toBe(true);
      expect(resetSpy).toHaveBeenCalledWith('nuevo@gmail.com', {
        redirectTo: 'https://campus-de-la-normal.vercel.app/reset-password',
      });

      const updatePwdSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValueOnce({
        data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
        error: null,
      });
      const updatePwdRes = await capturedAuth.updatePassword('NuevaClave2026!');
      expect(updatePwdRes.success).toBe(true);
      expect(updatePwdSpy).toHaveBeenCalledWith({ password: 'NuevaClave2026!' });

      // 5. Accesos rápidos individuales para los 4 roles: Estudiante, Docente, Administrador, Invitado
      vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });
      signInSpy.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } });

      for (const roleKey of ['student', 'teacher', 'admin', 'guest']) {
        const quickRes = await capturedAuth.quickLoginByRole(roleKey);
        expect(quickRes.success).toBe(true);
        expect(quickRes.profile.role).toBe(roleKey);
        expect(quickRes.profile.is_active).toBe(true);

        const storedSession = JSON.parse(localStorage.getItem('campus_quick_session'));
        expect(storedSession.profile.role).toBe(roleKey);
      }

      vi.restoreAllMocks();
    });
  });
});
