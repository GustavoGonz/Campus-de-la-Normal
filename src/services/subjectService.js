import { supabase, isRemoteUUID, isRemoteAvailable, markRemoteUnavailable } from '../config/supabaseClient';

const withTimeout = (promise, ms = 800) => {
  if (!isRemoteAvailable()) {
    return Promise.reject(new Error('Remote temporarily unavailable'));
  }
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      markRemoteUnavailable();
      reject(new Error('Query timeout'));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise])
    .catch((err) => {
      markRemoteUnavailable();
      throw err;
    })
    .finally(() => clearTimeout(timeoutId));
};

export const subjectService = {
  // Get all courses and divisions
  async getCourses() {
    try {
      const query = supabase.from('courses').select('*').order('name');
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data || [];
    } catch {
      const local = localStorage.getItem('campus_courses');
      return local ? JSON.parse(local) : [
        { id: 'c1', name: '1° Año', division: '1° División', shift: 'Mañana', year: 2026 },
        { id: 'c2', name: '1° Año', division: '2° División', shift: 'Tarde', year: 2026 },
        { id: 'c3', name: '2° Año', division: '1° División', shift: 'Mañana', year: 2026 },
        { id: 'c4', name: '3° Año', division: '1° División', shift: 'Mañana', year: 2026 },
        { id: 'c5', name: '4° Año', division: 'U', shift: 'Mañana', year: 2026 },
        { id: 'c6', name: '5° Año', division: 'U', shift: 'Mañana', year: 2026 },
        { id: 'c7', name: '5° Año', division: '5° “B” y “F”', shift: 'Mañana y Tarde', year: 2026 },
      ];
    }
  },

  // Create Course
  async createCourse(courseData) {
    try {
      const query = supabase.from('courses').insert(courseData).select().single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      const courses = await this.getCourses();
      const newCourse = { ...courseData, id: 'c-' + Date.now() };
      localStorage.setItem('campus_courses', JSON.stringify([...courses, newCourse]));
      return newCourse;
    }
  },

  // Get all subjects
  async getSubjects() {
    try {
      const query = supabase.from('subjects').select(`
        *,
        courses (id, name, division, shift),
        subject_teachers (
          teacher_id,
          profiles:teacher_id (id, full_name, email)
        )
      `).order('name');
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      if (data && data.length > 0) return data;
      throw new Error('Empty remote subjects');
    } catch {
      const local = localStorage.getItem('campus_subjects');
      if (local) return JSON.parse(local);

      // Espacios curriculares oficiales de la Escuela Normal Superior
      const defaultSubjects = [
        {
          id: 'sub-antrop-5',
          name: 'Antropología',
          code: 'ANT-501',
          description: 'Origen del hombre, teorías de la cultura, diversidad humana y configuraciones familiares.',
          color: '#0284c7',
          status: 'active',
          access_type: 'open',
          is_public: true,
          course_id: 'c7',
          courses: { id: 'c7', name: '5° Año', division: '5° “B” y “F”' },
          syllabus: [
            { unit: 1, title: 'EJE N° 1: La Antropología como disciplina científica', description: 'Definición, ramas, Claude Lévi-Strauss y métodos de investigación.' },
            { unit: 2, title: 'EJE N° 2: La Cultura como modo de explicación de la diversidad humana', description: 'Características de la cultura, UNESCO, configuraciones familiares y alimentación.' }
          ]
        },
        {
          id: 'sub-lengua-1',
          name: 'Lengua y Literatura I',
          code: 'LIT-101',
          description: 'Comprensión lectora, análisis discursivo y literatura clásica y latinoamericana.',
          color: '#1e40af',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c1',
          courses: { id: 'c1', name: '1° Año', division: '1° División' },
          syllabus: [
            { unit: 1, title: 'La comunicación y tipos textuales', description: 'El circuito comunicativo y tramas narrativas.' },
            { unit: 2, title: 'Mitos y leyendas regionales', description: 'Tradición oral riojana y leyendas del NOA.' },
            { unit: 3, title: 'El texto expositivo y académico', description: 'Pautas de síntesis, resúmenes e informes.' }
          ]
        },
        {
          id: 'sub-mate-1',
          name: 'Matemática I',
          code: 'MAT-101',
          description: 'Álgebra básica, geometría plana, proporcionalidad y razonamiento lógico.',
          color: '#047857',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c1',
          courses: { id: 'c1', name: '1° Año', division: '1° División' },
          syllabus: [
            { unit: 1, title: 'Conjuntos numéricos enteros', description: 'Operaciones fundamentales y propiedades.' },
            { unit: 2, title: 'Ecuaciones de primer grado', description: 'Resolución de problemas cotidianos con incógnitas.' },
            { unit: 3, title: 'Geometría y figuras planas', description: 'Perímetros, áreas y Teorema de Pitágoras.' }
          ]
        },
        {
          id: 'sub-hist-1',
          name: 'Historia Argentina y Regional',
          code: 'HIS-101',
          description: 'Historia colonial, luchas por la independencia y caudillos riojanos.',
          color: '#b45309',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c1',
          courses: { id: 'c1', name: '1° Año', division: '1° División' },
          syllabus: [
            { unit: 1, title: 'Proceso emancipador 1810-1820', description: 'Revolución de Mayo y Declaración de la Independencia.' },
            { unit: 2, title: 'Autonomías provinciales y Caudillismo', description: 'Facundo Quiroga y Chacho Peñaloza en La Rioja.' }
          ]
        },
        {
          id: 'sub-filo-5',
          name: 'Filosofía y Formación Ética',
          code: 'FIL-501',
          description: 'Pensamiento crítico, corrientes éticas y filosofía de la educación.',
          color: '#6d28d9',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c6',
          courses: { id: 'c6', name: '5° Año', division: 'U' },
          syllabus: [
            { unit: 1, title: 'El asombro y el origen del pensar', description: 'Filosofía clásica griega y presocráticos.' },
            { unit: 2, title: 'Ética y dilemas contemporáneos', description: 'Bioética, tecnología y responsabilidad moral.' }
          ]
        }
      ];
      localStorage.setItem('campus_subjects', JSON.stringify(defaultSubjects));
      return defaultSubjects;
    }
  },

  // Get Subject By ID
  async getSubjectById(subjectId) {
    const subjects = await this.getSubjects();
    return subjects.find((s) => s.id === subjectId) || null;
  },

  // Get subjects assigned to a teacher
  async getTeacherSubjects(_teacherId) {
    const all = await this.getSubjects();
    return all;
  },

  // Get subjects where student is enrolled
  async getStudentSubjects(studentId) {
    if (
      !studentId ||
      studentId.startsWith('guest') ||
      studentId === 'public' ||
      studentId === '00000000-0000-4000-8000-000000000004'
    ) {
      return [];
    }

    if (isRemoteUUID(studentId)) {
      try {
        const query = supabase
          .from('subject_students')
          .select('subject_id, status, subjects (*, courses (*))')
          .eq('student_id', studentId)
          .eq('status', 'active');
        const { data, error } = await withTimeout(query);

        if (!error && data && data.length > 0) {
          return data.map((d) => d.subjects);
        }
      } catch {
        // Fallback
      }
    }

    const enrollments = JSON.parse(localStorage.getItem(`enroll_${studentId}`) || '[]');
    const all = await this.getSubjects();
    if (enrollments.length > 0) {
      const matched = all.filter((s) => enrollments.includes(s.id));
      if (matched.length > 0) return matched;
    }

    // Para la cuenta institucional de Acceso Rápido Estudiantil, vincular las primeras materias disponibles si los IDs remotos son UUID
    if (studentId === '00000000-0000-4000-8000-000000000001' && all.length > 0) {
      const initialSlice = all.slice(0, Math.min(2, all.length));
      localStorage.setItem(`enroll_${studentId}`, JSON.stringify(initialSlice.map((s) => s.id)));
      return initialSlice;
    }

    // Si no está explícitamente matriculado y no es invitado, no inventar matrícula
    return [];
  },

  // Check enrollment status
  async checkEnrollment(subjectId, studentId) {
    if (
      !studentId ||
      studentId.startsWith('guest') ||
      studentId === 'public' ||
      studentId === '00000000-0000-4000-8000-000000000004'
    ) {
      return false;
    }
    const enrolled = await this.getStudentSubjects(studentId);
    return enrolled.some((s) => s.id === subjectId);
  },

  // Enroll student directly (e.g. by admin or initial matriculation)
  async enrollStudent(subjectId, studentId) {
    if (isRemoteUUID(subjectId) && isRemoteUUID(studentId)) {
      try {
        const query = supabase
          .from('subject_students')
          .insert({ subject_id: subjectId, student_id: studentId, status: 'active' })
          .select()
          .single();
        const { error } = await withTimeout(query);
        if (!error) return true;
      } catch {
        // Fallback local
      }
    }
    const enrollments = JSON.parse(localStorage.getItem(`enroll_${studentId}`) || '[]');
    if (!enrollments.includes(subjectId)) {
      localStorage.setItem(`enroll_${studentId}`, JSON.stringify([...enrollments, subjectId]));
    }
    return true;
  },

  // Request access to a subject
  async requestAccess(subjectId, studentId, message = '') {
    if (isRemoteUUID(subjectId) && isRemoteUUID(studentId)) {
      try {
        const query = supabase
          .from('access_requests')
          .insert({
            subject_id: subjectId,
            student_id: studentId,
            message,
            status: 'pending',
          })
          .select()
          .single();
        const { data, error } = await withTimeout(query);
        if (!error && data) return { success: true, data };
      } catch {
        // Fallback local
      }
    }

    const existing = JSON.parse(localStorage.getItem('campus_access_requests') || '[]');
    const already = existing.find((r) => r.subject_id === subjectId && r.student_id === studentId && r.status === 'pending');
    if (already) {
      return { success: false, error: 'Ya tenés una solicitud pendiente para esta materia.' };
    }
    const newReq = {
      id: 'req-' + Date.now(),
      subject_id: subjectId,
      student_id: studentId,
      message,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('campus_access_requests', JSON.stringify([...existing, newReq]));
    return { success: true, data: newReq };
  },

  // Get pending access requests for subject or teacher
  async getAccessRequests(subjectId = null) {
    if (!subjectId || isRemoteUUID(subjectId)) {
      try {
        let query = supabase
          .from('access_requests')
          .select(`
            *,
            subjects (id, name, code),
            profiles:student_id (id, full_name, email, role)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (subjectId) {
          query = query.eq('subject_id', subjectId);
        }

        const { data, error } = await withTimeout(query);
        if (!error && data) return data;
      } catch {
        // Fallback local
      }
    }
    const local = JSON.parse(localStorage.getItem('campus_access_requests') || '[]');
    return local.filter((r) => r.status === 'pending' && (!subjectId || r.subject_id === subjectId));
  },

  // Review access request (Approve/Reject) and enroll student when approved
  async reviewAccessRequest(requestId, status, reviewerId = null, responseNote = '') {
    if (isRemoteUUID(requestId)) {
      try {
        const query = supabase
          .from('access_requests')
          .update({
            status,
            response_note: responseNote,
            reviewed_by: isRemoteUUID(reviewerId) ? reviewerId : null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', requestId)
          .select()
          .single();
        const { data, error } = await withTimeout(query);
        if (!error && data) {
          if (status === 'approved' && data.subject_id && data.student_id) {
            await this.enrollStudent(data.subject_id, data.student_id);
          }
          return data;
        }
      } catch {
        // Fallback local
      }
    }

    const list = JSON.parse(localStorage.getItem('campus_access_requests') || '[]');
    let targetReq = null;
    const updated = list.map((r) => {
      if (r.id === requestId) {
        targetReq = {
          ...r,
          status,
          reviewed_by: reviewerId,
          response_note: responseNote,
          reviewed_at: new Date().toISOString(),
        };
        return targetReq;
      }
      return r;
    });
    localStorage.setItem('campus_access_requests', JSON.stringify(updated));

    if (status === 'approved' && targetReq?.subject_id && targetReq?.student_id) {
      await this.enrollStudent(targetReq.subject_id, targetReq.student_id);
    }

    return targetReq;
  },

  // Create Subject (Admin)
  async createSubject(subjectData) {
    const cleanPayload = {
      ...subjectData,
      course_id: isRemoteUUID(subjectData.course_id) ? subjectData.course_id : null,
    };

    if (!subjectData.course_id || isRemoteUUID(subjectData.course_id)) {
      try {
        const query = supabase
          .from('subjects')
          .insert(cleanPayload)
          .select()
          .single();
        const { data, error } = await withTimeout(query);
        if (!error && data) return data;
      } catch {
        // Fallback local
      }
    }

    const all = await this.getSubjects();
    const courses = await this.getCourses();
    const matchedCourse = courses.find((c) => c.id === subjectData.course_id) || null;
    const newSub = {
      ...subjectData,
      id: 'sub-' + Date.now(),
      status: subjectData.status || 'active',
      courses: matchedCourse,
      syllabus: subjectData.syllabus || [],
    };
    localStorage.setItem('campus_subjects', JSON.stringify([...all, newSub]));
    return newSub;
  },

  // Update Subject (Admin / Teacher)
  async updateSubject(subjectId, updates) {
    try {
      const query = supabase
        .from('subjects')
        .update(updates)
        .eq('id', subjectId)
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      const all = await this.getSubjects();
      const updated = all.map((s) => (s.id === subjectId ? { ...s, ...updates } : s));
      localStorage.setItem('campus_subjects', JSON.stringify(updated));
      return updated.find((s) => s.id === subjectId) || null;
    }
  }
};
