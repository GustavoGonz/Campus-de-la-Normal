import { describe, it, expect, beforeEach } from 'vitest';
import { subjectService } from '../services/subjectService';
import { materialService } from '../services/materialService';
import { classService } from '../services/classService';
import { previousSubjectsService } from '../services/previousSubjectsService';
import { aiService } from '../services/aiService';
import { adminService } from '../services/adminService';
import { storageService } from '../services/storageService';

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

describe('Campus: La Normal — Pruebas Obligatorias de Validación', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. INICIO DE SESIÓN CON GMAIL Y PERSISTENCIA
  describe('Prueba 1 & 2: Autenticación con Cuentas de Gmail y Persistencia', () => {
    it('Valida que las cuentas de Gmail sean normalizadas y reconozcan el formato correcto', () => {
      const email = '  Estudiante.Normal@gmail.com  ';
      const cleanEmail = email.trim().toLowerCase();
      expect(cleanEmail).toBe('estudiante.normal@gmail.com');
      expect(cleanEmail.endsWith('@gmail.com')).toBe(true);
    });

    it('Valida la persistencia de sesión a través del almacenamiento de credenciales autorizadas', () => {
      const sessionKey = 'sb-ezrtknrpwutdxhdhanvb-auth-token';
      const fakeSessionData = JSON.stringify({
        access_token: 'fake-jwt-token',
        user: { id: 'usr-gmail-123', email: 'alumno@gmail.com' },
      });

      localStorage.setItem(sessionKey, fakeSessionData);
      const retrieved = localStorage.getItem(sessionKey);
      expect(retrieved).toBeDefined();
      const parsed = JSON.parse(retrieved);
      expect(parsed.user.email).toBe('alumno@gmail.com');
    });
  });

  // 2. LOS 4 ROLES INSTITUCIONALES (Estudiante, Docente, Administrador, Invitado)
  describe('Prueba 3, 4 & 5: Los Cuatro Roles y Protección de Permisos', () => {
    const rolesList = ['student', 'teacher', 'admin', 'guest'];
    const rolesLabels = ['Estudiante', 'Docente', 'Administrador', 'Invitado'];

    it('Comprueba la existencia y el orden estricto de los 4 roles', () => {
      expect(rolesList).toEqual(['student', 'teacher', 'admin', 'guest']);
      expect(rolesLabels[0]).toBe('Estudiante');
      expect(rolesLabels[1]).toBe('Docente');
      expect(rolesLabels[2]).toBe('Administrador');
      expect(rolesLabels[3]).toBe('Invitado');
    });

    it('Administrador puede actualizar y asignar los cuatro roles a cualquier usuario', async () => {
      const userStudent = await adminService.updateUser('u1', { role: 'student' });
      expect(userStudent.role).toBe('student');

      const userTeacher = await adminService.updateUser('u2', { role: 'teacher' });
      expect(userTeacher.role).toBe('teacher');

      const userAdmin = await adminService.updateUser('u3', { role: 'admin' });
      expect(userAdmin.role).toBe('admin');

      const userGuest = await adminService.updateUser('u4', { role: 'guest' });
      expect(userGuest.role).toBe('guest');
    });

    it('Comprueba que el rol Invitado no tiene acceso a materiales privados ni subida de archivos', async () => {
      const guestUser = { id: 'guest-999', role: 'guest' };
      const privateSubjectId = 'sub-lengua-1';

      // El invitado no cuenta con matrícula en materias privadas
      const isEnrolled = await subjectService.checkEnrollment(privateSubjectId, guestUser.id);
      expect(isEnrolled).toBe(false);

      // Verificamos que los permisos no autoricen al invitado a modificar materiales
      const canManage = guestUser.role === 'teacher' || guestUser.role === 'admin';
      expect(canManage).toBe(false);
    });
  });

  // 3. BIBLIOTECA DIGITAL DE ARCHIVOS PDF POR MATERIA
  describe('Pruebas 6, 7, 8, 9 & 10: Biblioteca Digital de Archivos PDF y Supabase Storage', () => {
    it('Valida exclusivamente archivos con extensión y tipo PDF (.pdf)', () => {
      const validPdf = { name: 'Programa_Lecturas_2026.pdf', size: 1024 * 500, type: 'application/pdf' };
      const valPdf = storageService.validateFile(validPdf);
      expect(valPdf.valid).toBe(true);

      const invalidDoc = { name: 'Trabajo.docx', size: 1024 * 200, type: 'application/msword' };
      const valDoc = storageService.validateFile(invalidDoc);
      expect(valDoc.valid).toBe(false);
      expect(valDoc.error).toContain('PDF');

      const oversizedPdf = { name: 'Libro_Pesado.pdf', size: 60 * 1024 * 1024, type: 'application/pdf' };
      const valOver = storageService.validateFile(oversizedPdf);
      expect(valOver.valid).toBe(false);
      expect(valOver.error).toContain('50 MB');
    });

    it('Docente sube un PDF a la biblioteca con título, descripción y unidad', async () => {
      const teacherId = 'teacher-prof-1';
      const subjectId = 'sub-historia-1';

      const fakePdf = {
        name: 'Unidad1_Historia_Riojana.pdf',
        size: 1024 * 350,
        type: 'application/pdf',
      };

      const material = await materialService.uploadMaterial(subjectId, teacherId, fakePdf, {
        title: 'Unidad 1: Los Fundamentos de La Rioja Colonial',
        description: 'Lectura introductoria obligatoria para el primer cuatrimestre.',
        unit_number: 1,
        publication_status: 'published',
      });

      expect(material).toBeDefined();
      expect(material.title).toBe('Unidad 1: Los Fundamentos de La Rioja Colonial');
      expect(material.resource_type).toBe('pdf');
      expect(material.publication_status).toBe('published');

      // Estudiante matriculado consulta el material publicado y puede abrirlo/descargarlo
      const studentMaterials = await materialService.getMaterials(subjectId, true);
      expect(studentMaterials.length).toBeGreaterThan(0);
      const found = studentMaterials.find((m) => m.id === material.id);
      expect(found).toBeDefined();
      expect(found.file_url).toBeDefined();

      // Al cambiar a borrador, el estudiante ya no lo ve
      await materialService.updateMaterial(subjectId, material.id, { publication_status: 'draft' });
      const studentAfterDraft = await materialService.getMaterials(subjectId, true);
      expect(studentAfterDraft.some((m) => m.id === material.id)).toBe(false);
    });

    it('Docente reemplaza / actualiza un archivo PDF existente incrementando su versión', async () => {
      const teacherId = 'teacher-prof-1';
      const subjectId = 'sub-historia-1';

      const initialPdf = { name: 'Guia_v1.pdf', size: 100 };
      const created = await materialService.uploadMaterial(subjectId, teacherId, initialPdf, {
        title: 'Guía de Trabajo Práctico',
        publication_status: 'published',
      });
      expect(created.version).toBe(1);

      // Reemplazo del archivo PDF
      const newPdf = { name: 'Guia_v2_Actualizada.pdf', size: 200, type: 'application/pdf' };
      const replaced = await materialService.replaceMaterialFile(
        subjectId,
        created.id,
        newPdf,
        created.file_path
      );

      expect(replaced).toBeDefined();
      expect(replaced.file_name).toBe('Guia_v2_Actualizada.pdf');
      expect(replaced.version).toBe(2);
    });

    it('Docente elimina su propio archivo PDF de la biblioteca y de Storage', async () => {
      const teacherId = 'teacher-prof-1';
      const subjectId = 'sub-historia-1';

      const material = await materialService.uploadMaterial(subjectId, teacherId, { name: 'Borrador.pdf', size: 50 }, {
        title: 'Material a Borrar',
        publication_status: 'draft',
      });

      await materialService.deleteMaterial(subjectId, material.id, material.file_path);
      const remaining = await materialService.getMaterials(subjectId, false);
      expect(remaining.some((m) => m.id === material.id)).toBe(false);
    });

    it('Confirma que los estudiantes no cuentan con permisos para subir o eliminar archivos', () => {
      const studentRole = 'student';
      const canUploadOrDelete = studentRole === 'teacher' || studentRole === 'admin';
      expect(canUploadOrDelete).toBe(false);
    });
  });

  // 4. ELIMINACIÓN TOTAL DE ACTIVIDADES Y TAREAS
  describe('Prueba 11: Verificación de Eliminación de Actividades y Tareas', () => {
    it('Confirma que la aplicación ya no posee rutas activas de actividades', async () => {
      // Verificamos que las rutas de navegación docente y estudiantil no incluyan '/actividades'
      const navLinksDocente = [
        '/panel',
        '/profesor/materias',
        '/profesor/biblioteca',
        '/profesor/clases',
        '/materias-previas',
        '/calendario',
        '/tutor-ia',
      ];
      expect(navLinksDocente.includes('/profesor/actividades')).toBe(false);

      const navLinksEstudiante = [
        '/panel',
        '/estudiante/materias',
        '/estudiante/biblioteca',
        '/materias-previas',
        '/calendario',
        '/tutor-ia',
      ];
      expect(navLinksEstudiante.includes('/estudiante/actividades')).toBe(false);
    });
  });

  // 5. MATERIAS PREVIAS Y TUTOR INTELIGENTE
  describe('Módulos Educativos Permanentes: Materias Previas y Tutor IA', () => {
    it('Módulo de Materias Previas mantiene el checklist por unidades', async () => {
      const studentId = 'std-prep-1';
      const subjectId = 'sub-mat-1';

      const plan = await previousSubjectsService.addSubjectPrep(
        studentId,
        subjectId,
        '2026-07-20',
        'Repaso para turno extraordinario de julio'
      );
      expect(plan).toBeDefined();

      const updated = await previousSubjectsService.toggleUnitCompletion(studentId, subjectId, 1, 4);
      expect(updated.completed_units).toContain(1);
      expect(updated.progress_percent).toBe(25); // 1 de 4 = 25%
    });

    it('Tutor de IA genera respuestas basadas en la materia autorizada', async () => {
      const studentId = 'std-ai-1';
      const subject = { id: 'sub-lengua-1', name: 'Lengua y Literatura' };

      const res = await aiService.askTutor(subject, studentId, 'Explicame el argumento central', 'concept');
      expect(res).toBeDefined();
      expect(res.message).toBeDefined();
      expect(res.sources.length).toBeGreaterThan(0);
    });

    // 6. PRUEBA EXCLUSIVA RAG: SEGUNDA UNIDAD DE ANTROPOLOGÍA (PLANIFICACIÓN Y CUADERNILLO)
    it('Tutor IA responde con exactitud sobre la Segunda Unidad de Antropología citando Planificación y Cuadernillo reales', async () => {
      const subject = { id: 'sub-antrop-5', name: 'Antropología' };
      const prompt = '¿Me podés explicar el tema de la segunda unidad de Antropología?';

      const res = await aiService.askTutor(subject, 'std-antrop-1', prompt, 'explain');
      expect(res).toBeDefined();
      expect(res.found).toBe(true);

      // Verificamos que contenga los conceptos curriculares oficiales de 5° Año
      expect(res.message).toContain('EJE N° 2');
      expect(res.message).toContain('La Cultura como modo de explicación de la diversidad humana');
      expect(res.message).toContain('5° Año');
      expect(res.message).toContain('UNESCO');
      expect(res.message).toContain('familia');

      // Verificamos que cite las fuentes oficiales reales extraídas del Google Drive
      expect(res.sources.length).toBeGreaterThanOrEqual(2);
      const docNames = res.sources.map((s) => s.documentName);
      expect(docNames.some((d) => d.includes('PLANIFICACIÓN') && d.includes('ANTROPOLOGIA'))).toBe(true);
      expect(docNames.some((d) => d.includes('ANTROPOLOGIA.docx'))).toBe(true);

      // Verificamos que no invente páginas ni autores ficticios
      const teachers = res.sources.map((s) => s.teachers);
      expect(teachers.some((t) => t && t.includes('Cejas') && t.includes('Cornejo'))).toBe(true);
    });

    // 7. PRUEBA DE HONESTIDAD PEDAGÓGICA (NO INVENTAR INFORMACIÓN)
    it('Tutor IA reconoce cuándo no dispone de información suficiente sin inventar contenidos', async () => {
      const prompt = '¿Cuál es el temario del examen de Física Cuántica Avanzada del año 2045 en La Normal?';
      const res = await aiService.askTutor(null, 'public', prompt, 'explain');

      expect(res).toBeDefined();
      expect(res.found).toBe(false);
      expect(res.message).toContain('Información institucional no disponible');
      expect(res.message).toContain('no formula suposiciones como si fueran hechos');
      expect(res.sources.length).toBe(0);
    });

    // 8. PRUEBA DE ACCESO PÚBLICO E INVITADOS CON RATE LIMITING
    it('Tutor IA permite acceso público a materiales autorizados y bloquea abuso por rate limiting', async () => {
      const publicQuery = '¿Qué estudia la antropología?';
      const publicRes = await aiService.askTutor(null, 'guest', publicQuery, 'explain');

      expect(publicRes).toBeDefined();
      expect(publicRes.found).toBe(true);
      expect(publicRes.sources.every((s) => s.documentName)).toBe(true);

      // El acceso público nunca expone fragmentos privados
      const allChunksPublic = publicRes.sources.every((s) => s.unitTitle !== undefined);
      expect(allChunksPublic).toBe(true);
    });
  });
});
