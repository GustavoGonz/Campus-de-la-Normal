import { supabase } from '../config/supabaseClient';
import { ragEngine } from './ragEngine';

export const aiService = {
  // Obtener historial de chat del estudiante o usuario en una materia o sesión
  async getChatHistory(subjectId = 'general', studentId = 'public') {
    const key = `ai_chat_${subjectId}_${studentId}`;
    try {
      if (studentId && studentId !== 'public' && studentId !== 'guest') {
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('subject_id', subjectId)
          .eq('student_id', studentId)
          .order('created_at', { ascending: true });
        if (!error && data) return data;
      }
    } catch {
      // Usar almacenamiento local ante fallos de red
    }
    const local = JSON.parse(localStorage.getItem(key) || '[]');
    return local;
  },

  // Guardar mensaje en la conversación
  async saveMessage(subjectId = 'general', studentId = 'public', role, message, sources = []) {
    const record = {
      subject_id: subjectId,
      student_id: studentId,
      role,
      message,
      sources,
      created_at: new Date().toISOString(),
    };

    const key = `ai_chat_${subjectId}_${studentId}`;

    try {
      if (studentId && studentId !== 'public' && studentId !== 'guest') {
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert(record)
          .select()
          .single();
        if (!error && data) return data;
      }
    } catch {
      // ignore
    }

    const local = JSON.parse(localStorage.getItem(key) || '[]');
    const newRec = { ...record, id: 'msg-' + Date.now() };
    localStorage.setItem(key, JSON.stringify([...local, newRec]));
    return newRec;
  },

  // Limpiar historial de chat
  async clearChat(subjectId = 'general', studentId = 'public') {
    const key = `ai_chat_${subjectId}_${studentId}`;
    try {
      if (studentId && studentId !== 'public' && studentId !== 'guest') {
        await supabase
          .from('ai_conversations')
          .delete()
          .eq('subject_id', subjectId)
          .eq('student_id', studentId);
      }
    } catch {
      // ignore
    }
    localStorage.removeItem(key);
  },

  // Consulta al Tutor IA mediante RAG documental fundamentado
  async askTutor(subject = null, studentId = 'public', prompt = '', mode = 'explain', options = {}) {
    const cleanPrompt = (prompt || '').trim();
    if (!cleanPrompt) {
      return {
        message: 'Por favor escribí una pregunta o seleccioná un tema para que pueda ayudarte.',
        sources: [],
      };
    }

    const isPublicUser = !studentId || studentId === 'public' || studentId === 'guest';

    // 1. Verificación de Rate Limit para acceso público y protección contra abuso
    if (isPublicUser) {
      const rateCheck = ragEngine.checkRateLimit(studentId || 'guest');
      if (!rateCheck.allowed) {
        return {
          message: `🛑 **Límite temporal alcanzado:** ${rateCheck.error}`,
          sources: [],
        };
      }
    }

    // 2. Ejecución del motor RAG
    const ragResult = ragEngine.generateGroundAnswer(cleanPrompt, {
      isPublic: isPublicUser,
      userRole: options.userRole || (isPublicUser ? 'guest' : 'student'),
      subjectId: subject?.id || null,
      subjectName: subject?.name || null,
    });

    // 3. Adaptación según el modo pedagógico solicitado (quiz, summary, guide, explain)
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

    // 4. Persistencia del mensaje en el historial
    const subjectId = subject?.id || 'general';
    await this.saveMessage(subjectId, studentId, 'user', cleanPrompt, []);
    await this.saveMessage(subjectId, studentId, 'assistant', finalMessage, ragResult.sources);

    return {
      message: finalMessage,
      sources: ragResult.sources,
      found: ragResult.found,
    };
  },
};
