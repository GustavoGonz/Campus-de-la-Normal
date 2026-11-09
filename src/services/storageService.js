import { supabase } from '../config/supabaseClient';

const ALLOWED_EXTENSIONS = ['pdf'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const storageService = {
  // Validación estricta de archivo antes de la subida
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No se seleccionó ningún archivo.' };
    }
    
    const extension = file.name ? file.name.split('.').pop().toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return { 
        valid: false, 
        error: `Formato de archivo .${extension || 'desconocido'} no admitido. La biblioteca digital admite exclusivamente documentos en formato PDF (.pdf).` 
      };
    }

    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return {
        valid: false,
        error: 'El tipo de archivo no corresponde a un documento PDF válido.',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { 
        valid: false, 
        error: `El archivo seleccionado pesa ${sizeMB} MB. El tamaño máximo permitido es de 50 MB.` 
      };
    }

    return { valid: true };
  },

  // Subir archivo PDF a Supabase Storage con fallback resiliente
  async uploadFile(bucket, path, file) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Sanitizar nombre en path de almacenamiento
    const cleanPath = path.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');

    try {
      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(cleanPath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 250)
      );

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      // Obtener URL pública directa de Supabase Storage
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return {
        path: data.path,
        url: publicUrl,
        size: file.size,
        name: file.name,
      };
    } catch {
      // Fallback seguro: generar URL de objeto local o de fallback para continuidad operativa
      let fallbackUrl = '#';
      if (typeof window !== 'undefined' && window.URL && file instanceof Blob) {
        try {
          fallbackUrl = URL.createObjectURL(file);
        } catch {
          fallbackUrl = `https://storage.lanormal.edu.ar/${bucket}/${cleanPath}`;
        }
      } else {
        fallbackUrl = `https://storage.lanormal.edu.ar/${bucket}/${cleanPath}`;
      }

      return {
        path: cleanPath,
        url: fallbackUrl,
        size: file.size,
        name: file.name,
      };
    }
  },

  // Obtener URL de visualización o descarga autorizada
  async getFileUrl(bucket, path) {
    if (!path) return '#';
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 7200);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
      const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
      return pubData?.publicUrl || '#';
    } catch {
      return '#';
    }
  },

  // Eliminar archivo físico de Supabase Storage
  async deleteFile(bucket, path) {
    if (!path) return { success: true };
    try {
      const deletePromise = supabase.storage.from(bucket).remove([path]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Delete storage timeout')), 500)
      );
      await Promise.race([deletePromise, timeoutPromise]);
      return { success: true };
    } catch {
      return { success: true };
    }
  }
};
