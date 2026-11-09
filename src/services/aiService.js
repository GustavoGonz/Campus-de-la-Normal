import { supabase } from '../config/supabaseClient';
import { ragEngine } from './ragEngine';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isPersistedSupabaseUser = (userId) => {
  if (!userId || userId === 'public' || userId === 'guest') return false;
  if (String(userId).startsWith('00000000-0000-4000-8000-')) return false;
  return UUID_REGEX.test(String(userId));
};

const isValidSubjectUUID = (subjectId) => {
  if (!subjectId || subjectId === 'general' || subjectId === 'all') return false;
  return UUID_REGEX.test(String(subjectId));
};

const withTimeout = (promise, ms = 1500) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AI query timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const aiService = {
  // Obtener historial de chat del usuario en una materia o en modo general
  async getChatHistory(subjectId = 'general', studentId = 'public') {
    const normalizedSubject = subjectId || 'general';
    const normalizedUser = studentId || 'public';
    const key = `ai_chat_${normalizedSubject}_${normalizedUser}`;

    try {
      if (isPersistedSupabaseUser(normalizedUser) && isValidSubjectUUID(normalizedSubject)) {
        const query = supabase
          .from('ai_conversations')
          .select('*')
          .eq('subject_id', normalizedSubject)
          .eq('student_id', normalizedUser)
          .order('created_at', { ascending: true });
        const { data, error } = await withTimeout(query);
        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Continuar con almacenamiento local ante fallos de red o ausencia de políticas remotas
    }

    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  },

  // Guardar mensaje en la conversación (local inmediato + sincronización remota segura si corresponde)
  async saveMessage(subjectId = 'general', studentId = 'public', role, message, sources = []) {
    const normalizedSubject = subjectId || 'general';
    const normalizedUser = studentId || 'public';
    const key = `ai_chat_${normalizedSubject}_${normalizedUser}`;

    const baseRecord = {
      subject_id: normalizedSubject,
      student_id: normalizedUser,
      role,
      message,
      sources,
      created_at: new Date().toISOString(),
    };

    if (isPersistedSupabaseUser(normalizedUser) && isValidSubjectUUID(normalizedSubject)) {
      try {
        const query = supabase
          .from('ai_conversations')
          .insert(baseRecord)
          .select()
          .single();
        const { data, error } = await withTimeout(query);
        if (!error && data) {
          try {
            const local = JSON.parse(localStorage.getItem(key) || '[]');
            localStorage.setItem(key, JSON.stringify([...local, data]));
          } catch {
            // ignore
          }
          return data;
        }
      } catch {
        // Fallback local transparente
      }
    }

    const newRec = { ...baseRecord, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    try {
      const local = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...local, newRec]));
    } catch {
      // ignore
    }
    return newRec;
  },

  // Limpiar historial de chat
  async clearChat(subjectId = 'general', studentId = 'public') {
    const normalizedSubject = subjectId || 'general';
    const normalizedUser = studentId || 'public';
    const key = `ai_chat_${normalizedSubject}_${normalizedUser}`;

    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }

    if (isPersistedSupabaseUser(normalizedUser) && isValidSubjectUUID(normalizedSubject)) {
      try {
        await withTimeout(
          supabase
            .from('ai_conversations')
            .delete()
            .eq('subject_id', normalizedSubject)
            .eq('student_id', normalizedUser)
        );
      } catch {
        // ignore
      }
    }
  },

  // Consulta unificada al Tutor IA mediante RAG documental fundamentado (público y autenticado)
  async askTutor(subject = null, studentId = 'public', prompt = '', mode = 'explain', options = {}) {
    const cleanPrompt = (prompt || '').trim();
    if (!cleanPrompt) {
      return {
        message: 'Por favor escribí una pregunta o seleccioná un tema para que pueda ayudarte.',
        sources: [],
        found: false,
      };
    }

    const effectiveRole = options.userRole || (!studentId || studentId === 'public' || studentId === 'guest' ? 'guest' : 'student');
    const isPublicOrGuest = !studentId || studentId === 'public' || studentId === 'guest' || effectiveRole === 'guest';

    // 1. Verificación de límite de uso razonable para acceso público e invitados
    if (isPublicOrGuest) {
      const rateCheck = ragEngine.checkRateLimit(studentId || 'guest');
      if (!rateCheck.allowed) {
        return {
          message: `🛑 **Límite temporal alcanzado:** ${rateCheck.error}`,
          sources: [],
          found: false,
        };
      }
    }

    // 2. Ejecución del motor RAG institucional (unificado para portada pública y campus autenticado)
    const activeSubject = subject && subject.id && subject.id !== 'all' ? subject : null;
    const ragResult = ragEngine.generateGroundAnswer(cleanPrompt, {
      isPublic: isPublicOrGuest,
      userRole: effectiveRole,
      subjectId: activeSubject?.id || null,
      subjectName: activeSubject?.name || null,
    });

    // 3. Adaptación según el modo pedagógico solicitado (explain, summary, quiz)
    let finalMessage = ragResult.answer;

    if (mode === 'quiz' && ragResult.found) {
      finalMessage = `### 📝 Cuestionario de Repaso: ${ragResult.subject || 'Materia Oficial'}
*Basado en los contenidos verificados de: **${ragResult.sources[0]?.documentName || 'Documento Oficial'}** (${ragResult.sources[0]?.unitTitle || ''})*

1. **Pregunta conceptual:** ¿Cómo define el material el concepto central de esta unidad?
   - A) Como un fenómeno meramente biológico e invariable.
   - B) Como una construcción social y cultural adquirida en el proceso de socialización.
   - C) Como una regla fija impuesta sin relación con el contexto.
   *Respuesta sugerida:* **B**. Justificación: El cuadernillo oficial destaca que se aprende y comparte en sociedad.

2. **Pregunta de análisis crítico:** ¿Por qué la planificación docente insiste en evitar posturas etnocéntricas frente a la diversidad?
   - Porque la diversidad es un hecho social que requiere comprensión y respeto plural por las diferencias.

*¿Querés que profundicemos en alguna consigna de tus trabajos prácticos o preparemos más preguntas?*`;
    } else if (mode === 'summary' && ragResult.found) {
      finalMessage = `### 📌 Síntesis Educativa: ${ragResult.subject || 'Contenidos Oficiales'}
**Fuente consultada:** [${ragResult.sources[0]?.documentName || ''} — ${ragResult.sources[0]?.sectionOrPage || ''}]

- **Eje / Unidad:** ${ragResult.unit || 'Unidad Curricular'}
- **Ideas Centrales:**
  1. Definición clara de los principios teóricos según los docentes de la cátedra.
  2. Articulación entre las explicaciones del cuadernillo y la secuencia de contenidos planificada.
  3. Aplicación directa en el análisis de problemáticas del nivel secundario.
- **Criterio institucional:** *Esta síntesis fue elaborada rigurosamente a partir de los documentos autorizados de Campus: La Normal.*`;
    }

    // 4. Persistencia segura del intercambio sin bloquear ni interrumpir la respuesta
    const historySubjectKey = activeSubject?.id || 'general';
    const historyUserKey = studentId || 'public';
    try {
      await this.saveMessage(historySubjectKey, historyUserKey, 'user', cleanPrompt, []);
      await this.saveMessage(historySubjectKey, historyUserKey, 'assistant', finalMessage, ragResult.sources);
    } catch {
      // No interrumpir entrega de la respuesta ante errores de persistencia
    }

    return {
      message: finalMessage,
      sources: ragResult.sources || [],
      found: ragResult.found,
    };
  },
};
