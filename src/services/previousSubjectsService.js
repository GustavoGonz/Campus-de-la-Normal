import { supabase } from '../config/supabaseClient';

const withTimeout = (promise, ms = 2000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Query timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const previousSubjectsService = {
  // Get student's previous subjects preparations
  async getStudentPreps(studentId) {
    try {
      const query = supabase
        .from('previous_subjects_prep')
        .select(`
          *,
          subjects (*, courses (*))
        `)
        .eq('student_id', studentId);
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`prev_prep_${studentId}`) || '[]');
      return local;
    }
  },

  // Enroll in a previous subject preparation plan
  async addSubjectPrep(studentId, subjectId, targetExamDate = null, notes = '') {
    const record = {
      student_id: studentId,
      subject_id: subjectId,
      target_exam_date: targetExamDate,
      notes,
      progress_percent: 0,
      completed_units: [],
    };

    try {
      const query = supabase
        .from('previous_subjects_prep')
        .upsert(record, { onConflict: 'student_id,subject_id' })
        .select(`*, subjects (*, courses (*))`)
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      const all = await this.getStudentPreps(studentId);
      const filtered = all.filter((p) => p.subject_id !== subjectId);
      const newPlan = {
        ...record,
        id: 'prep-' + Date.now(),
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`prev_prep_${studentId}`, JSON.stringify([...filtered, newPlan]));
      return newPlan;
    }
  },

  // Toggle unit completion status
  async toggleUnitCompletion(studentId, subjectId, unitNumber, totalUnits = 1) {
    const preps = await this.getStudentPreps(studentId);
    const plan = preps.find((p) => p.subject_id === subjectId);
    if (!plan) return null;

    let completed = Array.isArray(plan.completed_units) ? [...plan.completed_units] : [];
    if (completed.includes(unitNumber)) {
      completed = completed.filter((u) => u !== unitNumber);
    } else {
      completed.push(unitNumber);
    }

    const progress = totalUnits > 0 ? Math.round((completed.length / totalUnits) * 100) : 0;

    try {
      const query = supabase
        .from('previous_subjects_prep')
        .update({
          completed_units: completed,
          progress_percent: progress,
        })
        .eq('student_id', studentId)
        .eq('subject_id', subjectId)
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      const updated = preps.map((p) =>
        p.subject_id === subjectId
          ? { ...p, completed_units: completed, progress_percent: progress }
          : p
      );
      localStorage.setItem(`prev_prep_${studentId}`, JSON.stringify(updated));
      return updated.find((p) => p.subject_id === subjectId);
    }
  },

  // Update target date or personal study notes
  async updateStudyPlan(studentId, subjectId, { targetExamDate, notes }) {
    try {
      const query = supabase
        .from('previous_subjects_prep')
        .update({
          target_exam_date: targetExamDate,
          notes,
        })
        .eq('student_id', studentId)
        .eq('subject_id', subjectId)
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      const preps = await this.getStudentPreps(studentId);
      const updated = preps.map((p) =>
        p.subject_id === subjectId
          ? { ...p, target_exam_date: targetExamDate, notes }
          : p
      );
      localStorage.setItem(`prev_prep_${studentId}`, JSON.stringify(updated));
      return updated.find((p) => p.subject_id === subjectId);
    }
  }
};
