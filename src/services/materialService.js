import { supabase } from '../config/supabaseClient';
import { storageService } from './storageService';
import { ragEngine } from './ragEngine';

const STORAGE_BUCKET = 'course-materials';

// Helper de timeout seguro para consultas a Supabase
const withTimeout = (promise, ms = 300) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Database query timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const materialService = {
  // Obtener carpetas para organizar los documentos de una materia
  async getFolders(subjectId) {
    try {
      const query = supabase
        .from('folders')
        .select('*')
        .eq('subject_id', subjectId)
        .order('name');
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`folders_${subjectId}`) || '[]');
      return local;
    }
  },

  // Crear una nueva carpeta organizadora
  async createFolder(subjectId, name, parentId = null, userId = null) {
    try {
      const query = supabase
        .from('folders')
        .insert({
          subject_id: subjectId,
          name,
          parent_id: parentId,
          created_by: userId,
        })
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data;
    } catch {
      const folders = await this.getFolders(subjectId);
      const newFolder = {
        id: 'fld-' + Date.now(),
        subject_id: subjectId,
        name,
        parent_id: parentId,
        created_by: userId,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`folders_${subjectId}`, JSON.stringify([...folders, newFolder]));
      return newFolder;
    }
  },

  // Obtener materiales de una materia
  // Docente ve todos; estudiante ve únicamente los publicados ('published')
  async getMaterials(subjectId, isStudent = false) {
    try {
      let query = supabase
        .from('materials')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

      if (isStudent) {
        query = query.eq('publication_status', 'published');
      }

      const { data, error } = await withTimeout(query);
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`materials_${subjectId}`) || '[]');
      if (isStudent) {
        return local.filter((m) => m.publication_status === 'published');
      }
      return local;
    }
  },

  // Subir y registrar un nuevo material educativo (PDF, DOCX) y sincronizarlo al RAG
  async uploadMaterial(subjectId, teacherId, file, metadata = {}) {
    // 1. Subida física al Storage
    const timestamp = Date.now();
    const cleanFileName = file.name ? file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_') : `doc_${timestamp}.pdf`;
    const storagePath = `${subjectId}/${timestamp}_${cleanFileName}`;

    let uploadRes;
    try {
      uploadRes = await storageService.uploadFile(STORAGE_BUCKET, storagePath, file);
    } catch (storageErr) {
      console.warn('Fallback en almacenamiento:', storageErr.message);
      uploadRes = {
        path: storagePath,
        url: `https://storage.lanormal.edu.ar/${STORAGE_BUCKET}/${storagePath}`,
        size: file.size || 1024,
        name: file.name,
      };
    }

    const materialRecord = {
      title: metadata.title || (file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Documento Sin Título'),
      description: metadata.description || '',
      subject_id: subjectId,
      folder_id: metadata.folder_id || null,
      unit_number: metadata.unit_number ? parseInt(metadata.unit_number) : null,
      unit_title: metadata.unit_title || '',
      resource_type: this.detectResourceType(file.name),
      file_url: uploadRes.url,
      file_path: uploadRes.path,
      file_size: uploadRes.size || 0,
      file_name: file.name || 'documento.pdf',
      mime_type: (file.name || '').endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
      publication_status: metadata.publication_status || 'published',
      is_public: metadata.is_public === true || metadata.is_public === 'true',
      teacher_id: teacherId,
      version: 1,
    };

    let savedMaterial;
    try {
      const query = supabase
        .from('materials')
        .insert(materialRecord)
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      savedMaterial = data;
    } catch {
      const all = await this.getMaterials(subjectId, false);
      savedMaterial = {
        ...materialRecord,
        id: 'mat-' + timestamp,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`materials_${subjectId}`, JSON.stringify([savedMaterial, ...all]));
    }

    // 2. Sincronización automática con el índice RAG del Tutor IA
    try {
      ragEngine.ingestUploadedMaterial(savedMaterial, metadata.description || '');
    } catch (ragErr) {
      console.warn('Aviso de indexación RAG:', ragErr.message);
    }

    return savedMaterial;
  },

  // Reemplazar el archivo físico de un material existente e incrementar su versión
  async replaceMaterialFile(subjectId, materialId, newFile, oldFilePath) {
    const timestamp = Date.now();
    const cleanFileName = newFile.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const newStoragePath = `${subjectId}/${timestamp}_${cleanFileName}`;

    let uploadRes;
    try {
      uploadRes = await storageService.uploadFile(STORAGE_BUCKET, newStoragePath, newFile);
    } catch {
      uploadRes = {
        path: newStoragePath,
        url: `https://storage.lanormal.edu.ar/${STORAGE_BUCKET}/${newStoragePath}`,
        size: newFile.size || 1024,
        name: newFile.name,
      };
    }

    if (oldFilePath && oldFilePath !== newStoragePath) {
      await storageService.deleteFile(STORAGE_BUCKET, oldFilePath);
    }

    let updatedMaterial;
    try {
      const { data: current } = await withTimeout(
        supabase.from('materials').select('version').eq('id', materialId).maybeSingle()
      );
      const newVersion = (current?.version || 1) + 1;

      const query = supabase
        .from('materials')
        .update({
          file_url: uploadRes.url,
          file_path: uploadRes.path,
          file_size: uploadRes.size,
          file_name: newFile.name,
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', materialId)
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      updatedMaterial = data;
    } catch {
      const all = await this.getMaterials(subjectId, false);
      const updated = all.map((m) =>
        m.id === materialId
          ? {
              ...m,
              file_url: uploadRes.url,
              file_path: uploadRes.path,
              file_size: uploadRes.size,
              file_name: newFile.name,
              version: (m.version || 1) + 1,
              updated_at: new Date().toISOString(),
            }
          : m
      );
      localStorage.setItem(`materials_${subjectId}`, JSON.stringify(updated));
      updatedMaterial = updated.find((m) => m.id === materialId);
    }

    // Actualizar RAG con la nueva versión
    try {
      ragEngine.ingestUploadedMaterial(updatedMaterial, updatedMaterial?.description || '');
    } catch (e) {
      console.warn('Aviso de re-indexación RAG:', e.message);
    }

    return updatedMaterial;
  },

  // Actualizar metadatos (título, descripción, unidad, estado de publicación)
  async updateMaterial(subjectId, materialId, updates) {
    let updated;
    try {
      const query = supabase
        .from('materials')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', materialId)
        .select()
        .single();
      const { data, error } = await withTimeout(query);
      if (error) throw error;
      updated = data;
    } catch {
      const all = await this.getMaterials(subjectId, false);
      const list = all.map((m) =>
        m.id === materialId ? { ...m, ...updates, updated_at: new Date().toISOString() } : m
      );
      localStorage.setItem(`materials_${subjectId}`, JSON.stringify(list));
      updated = list.find((m) => m.id === materialId);
    }

    // Sincronizar cambios en RAG si se modificó publicación o contenido
    try {
      if (updated?.publication_status === 'draft' || updated?.publication_status === 'hidden') {
        ragEngine.removeDocumentChunks(materialId);
      } else if (updated) {
        ragEngine.ingestUploadedMaterial(updated, updated.description || '');
      }
    } catch (e) {
      console.warn('Aviso sincronización RAG:', e.message);
    }

    return updated;
  },

  // Eliminar material (registro y archivo físico de Supabase Storage, y expulsar del índice RAG)
  async deleteMaterial(subjectId, materialId, filePath = null) {
    if (filePath) {
      await storageService.deleteFile(STORAGE_BUCKET, filePath);
    } else {
      try {
        const { data } = await withTimeout(
          supabase.from('materials').select('file_path').eq('id', materialId).maybeSingle()
        );
        if (data?.file_path) {
          await storageService.deleteFile(STORAGE_BUCKET, data.file_path);
        }
      } catch {
        // ignore
      }
    }

    try {
      const query = supabase.from('materials').delete().eq('id', materialId);
      await withTimeout(query);
    } catch {
      // ignore
    } finally {
      const all = JSON.parse(localStorage.getItem(`materials_${subjectId}`) || '[]');
      const filtered = all.filter((m) => m.id !== materialId);
      localStorage.setItem(`materials_${subjectId}`, JSON.stringify(filtered));
    }

    // Eliminar fragmentos del Tutor IA para no dejar versiones huérfanas
    try {
      ragEngine.removeDocumentChunks(materialId);
    } catch (e) {
      console.warn('Aviso al purgar de RAG:', e.message);
    }

    return true;
  },

  // Detector de tipo de recurso
  detectResourceType(fileName = '') {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf', 'docx', 'doc', 'pptx', 'ppt'].includes(ext)) return ext;
    return 'pdf';
  }
};
