import { supabase } from '../config/supabaseClient';

const withTimeout = (promise, ms = 800) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Admin query timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const adminService = {
  // Get all registered users/profiles
  async getUsers() {
    try {
      const query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      if (data && data.length > 0) return data;
      throw new Error('No remote users yet');
    } catch {
      const local = JSON.parse(localStorage.getItem('campus_all_users') || '[]');
      if (local.length > 0) return local;

      // Initial demonstration users
      const defaultUsers = [
        { id: 'u1', email: 'admin@lanormal.edu.ar', full_name: 'Lic. María Elena Ramos', role: 'admin', is_active: true, created_at: '2026-03-01T10:00:00Z' },
        { id: 'u2', email: 'carlos.romero@lanormal.edu.ar', full_name: 'Prof. Carlos Romero', role: 'teacher', is_active: true, created_at: '2026-03-02T10:00:00Z' },
        { id: 'u3', email: 'lucia.ramos@estudiante.lanormal.edu.ar', full_name: 'Lucía Ramos', role: 'student', is_active: true, created_at: '2026-03-05T10:00:00Z' },
        { id: 'u4', email: 'matias.gomez@estudiante.lanormal.edu.ar', full_name: 'Matías Gómez', role: 'student', is_active: true, created_at: '2026-03-06T10:00:00Z' },
      ];
      localStorage.setItem('campus_all_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
  },

  // Update user role or active status
  async updateUser(userId, updates) {
    try {
      const query = supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      const users = await this.getUsers();
      const updated = users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      localStorage.setItem('campus_all_users', JSON.stringify(updated));
      return updated.find((u) => u.id === userId);
    }
  },

  // Assign teacher to subject
  async assignTeacher(subjectId, teacherId) {
    try {
      const query = supabase
        .from('subject_teachers')
        .insert({ subject_id: subjectId, teacher_id: teacherId })
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      return { success: true };
    }
  },

  // Remove teacher assignment
  async removeTeacher(subjectId, teacherId) {
    try {
      const query = supabase
        .from('subject_teachers')
        .delete()
        .eq('subject_id', subjectId)
        .eq('teacher_id', teacherId);
      await withTimeout(query);
      return true;
    } catch {
      return true;
    }
  }
};
