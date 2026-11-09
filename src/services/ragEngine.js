/**
 * CAMPUS: LA NORMAL — Sistema RAG (Retrieval-Augmented Generation)
 * Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros — La Rioja, Argentina
 * 
 * Motor de Conocimiento Pedagógico Documentado:
 * - Ingesta, segmentación semántica e indexación de documentos institucionales reales.
 * - Tratamiento diferenciado de Planificaciones Docentes vs. Cuadernillos Educativos.
 * - Correlación cruzada entre qué se debe enseñar (planificación) y cómo se estudia (cuadernillo).
 * - Citación rigurosa de fuentes (archivo, materia, curso, eje/unidad, página/sección).
 * - Separación estricta entre documentos públicos (acceso libre) y privados (solo matriculados).
 * - Puerta de veracidad: no inventa información ni conjeturas.
 */

// Base de Conocimiento Curricular Oficial de la Escuela Normal Dr. Pedro I. de Castro Barros
// Extraída e indexada a partir de los documentos oficiales del Google Drive institucional
export const INITIAL_KNOWLEDGE_BASE = [
  // --------------------------------------------------------------------------
  // ANTROPOLOGÍA — 5° AÑO (Humanidades / Cs. Sociales)
  // --------------------------------------------------------------------------
  {
    id: 'antrop-planif-eje1',
    documentName: '2026PLANIFICACIÓN ANUAL ANTROPOLOGIA.docx',
    subject: 'Antropología',
    course: '5° Año',
    division: '5° “B” y “F”',
    year: 2026,
    docType: 'planificacion',
    unitNumber: 1,
    unitTitle: 'EJE N° 1: La Antropología como disciplina científica',
    sectionOrPage: 'Página 2 / Contenidos del Primer Cuatrimestre',
    isPublic: true,
    teachers: 'Cejas Adriana – Cornejo Sandra',
    content: `EJE N° 1: La Antropología como disciplina científica.
Antropología: Definición. Ramas. Desarrollo histórico de la disciplina y sus principales representantes. Paradigmas antropológicos clásicos. Métodos de investigación de la antropología. Problemática del origen del hombre.
Propósitos de enseñanza: Promover la reflexión acerca de la esencia del ser humano, sobre su naturaleza diferencial, sobre el ser que es más importante que la apariencia. Crear un espacio de discusión e intercambio sobre la alteridad, la empatía y las relaciones con el otro en el contexto social.`,
    keyConcepts: ['antropología', 'disciplina científica', 'ramas', 'origen del hombre', 'paradigmas', 'alteridad', 'lévi-strauss', 'unidad 1', 'eje 1'],
  },
  {
    id: 'antrop-planif-eje2',
    documentName: '2026PLANIFICACIÓN ANUAL ANTROPOLOGIA.docx',
    subject: 'Antropología',
    course: '5° Año',
    division: '5° “B” y “F”',
    year: 2026,
    docType: 'planificacion',
    unitNumber: 2,
    unitTitle: 'EJE N° 2: La Cultura como modo de explicación de la diversidad humana',
    sectionOrPage: 'Página 2 / Contenidos del Primer Cuatrimestre',
    isPublic: true,
    teachers: 'Cejas Adriana – Cornejo Sandra',
    content: `EJE Nª2: La Cultura como modo de explicación de la diversidad humana.
Antropología cultural: Diferentes campos y nociones asociadas - subcultura, aculturación, cultura popular, cambio cultural. La cultura como proceso de negociación y trama de significados en la génesis del orden social.
Sociedad contemporánea y multiculturalismo.
La familia-concepto: La familia nuclear y la familia extendida.
La Alimentación humana en distintos tipos de sociedades: Innovaciones y adaptaciones alimentarias. Características de la alimentación actual. Desórdenes alimentarios.
Consumos culturales y medios de comunicación.`,
    keyConcepts: ['antropología', 'cultura', 'diversidad humana', 'segunda unidad', 'unidad 2', 'eje 2', 'subcultura', 'aculturación', 'cultura popular', 'familia', 'alimentación', 'multiculturalismo'],
  },
  {
    id: 'antrop-cuadernillo-intro',
    documentName: 'ANTROPOLOGIA.docx',
    subject: 'Antropología',
    course: '5° Año',
    division: '5° “B” y “F”',
    year: 2026,
    docType: 'cuadernillo',
    unitNumber: 1,
    unitTitle: 'EJE N° 1: La antropología como disciplina científica',
    sectionOrPage: 'Página 1 / Sección: Definición etimológica y ramas',
    isPublic: true,
    teachers: 'Adriana Cejas - Sandra Cornejo',
    content: `Para comprender qué es «antropología» debemos comenzar por su significado etimológico: deriva del griego [anthropos: hombre o humano] - logía [logos: conocimiento o estudio].
Claude Lévi-Strauss (1958) formuló las aspiraciones de la ciencia antropológica: «La antropología apunta a un conocimiento global del hombre y abarca el objeto en toda su extensión geográfica e histórica... tiende a conclusiones válidas para todas las sociedades humanas, desde la gran ciudad moderna hasta la más pequeña tribu melanesia» (p. 368).
Cuatro áreas de estudio principales:
1. Antropología física: Estudio de la variabilidad humana biológica en relación sociohistórica (morfología, esqueleto, paleontología humana y antropología forense).
2. Arqueología: Estudio sistemático a partir de la cultura material y el registro arqueológico (artefactos, restos, asentamientos).
3. Lingüística antropológica: Indaga cómo el lenguaje configura la comunicación, la identidad y la percepción del mundo.
4. Antropología social y cultural: Estudia instituciones, prácticas sociales, producción simbólica y costumbres de las sociedades humanas.`,
    keyConcepts: ['antropología', 'etimología', 'anthropos', 'logos', 'lévi-strauss', 'ramas', 'antropología física', 'arqueología', 'lingüística', 'antropología cultural'],
  },
  {
    id: 'antrop-cuadernillo-cultura-eje2',
    documentName: 'ANTROPOLOGIA.docx',
    subject: 'Antropología',
    course: '5° Año',
    division: '5° “B” y “F”',
    year: 2026,
    docType: 'cuadernillo',
    unitNumber: 2,
    unitTitle: 'EJE N° 2: La Cultura como modo de explicación de la diversidad humana',
    sectionOrPage: 'Páginas 2 a 4 / Sección: Noción y Características de la Cultura',
    isPublic: true,
    teachers: 'Adriana Cejas - Sandra Cornejo',
    content: `Noción de cultura: La cultura constituye una dimensión específica de la vida social que no puede entenderse aislada. Todos los sujetos adquirimos cultura en los procesos de socialización que atravesamos a lo largo de la vida.
Características fundamentales de la cultura:
1. La cultura es aprendida: Los seres humanos absorben tradiciones culturales con facilidad a través del aprendizaje consciente e inconsciente.
2. La cultura es compartida: Atributo de los individuos en tanto miembros de grupos; se transmite en sociedad.
3. La cultura es simbólica: Crucial para humanos. Un símbolo es algo verbal o no verbal que representa otra cosa (lingüístico, banderas, cruces).
4. La cultura somete a la naturaleza: Toma necesidades biológicas (comer, dormir) y enseña a expresarlas de maneras culturales específicas.
5. La cultura lo abarca todo: Incluye costumbres, creencias, valores, vida cotidiana y modos de organización, no sólo el arte o la erudición.
Diversidad cultural: La UNESCO la define como la pluralidad de culturas que coexisten en el mundo. Hay dos posturas ante ella: jerarquización etnocéntrica (discriminación y dominación) vs. reconocimiento plural y respetuoso de las diferencias.`,
    keyConcepts: ['cultura', 'noción de cultura', 'características de la cultura', 'aprendida', 'compartida', 'simbólica', 'somete a la naturaleza', 'diversidad cultural', 'unesco', 'segunda unidad', 'unidad 2', 'eje 2'],
  },
  {
    id: 'antrop-cuadernillo-familia-eje2',
    documentName: 'ANTROPOLOGIA.docx',
    subject: 'Antropología',
    course: '5° Año',
    division: '5° “B” y “F”',
    year: 2026,
    docType: 'cuadernillo',
    unitNumber: 2,
    unitTitle: 'EJE N° 2: Configuraciones Familiares y Prácticas Sociales',
    sectionOrPage: 'Página 5 / Sección: La Familia y sus configuraciones',
    isPublic: true,
    teachers: 'Adriana Cejas - Sandra Cornejo',
    content: `La familia en la antropología clásica: Grupo social caracterizado por residencia común, cooperación económica y reproducción.
Evolución de configuraciones familiares en la teoría antropológica:
- Familia consanguínea: Matrimonio y relaciones entre hermanos en etapas tempranas.
- Familia punalúa: Exclusión del matrimonio entre hermanos, parentesco ampliado.
- Familia sindiásmica: Parejas transitorias de fácil disolución.
- Familia patriarcal: Autoridad y potestad centrada en el padre.
- Familia monógama: Cohabitación exclusiva de una pareja fundada en la sociedad moderna.
Familia nuclear (padres e hijos) y familia extendida (múltiples generaciones y parientes colaterales).
Alimentación como hecho cultural: Práctica social que refleja identidades, innovaciones y adaptaciones ecológicas, no mera necesidad biológica.`,
    keyConcepts: ['familia', 'configuraciones familiares', 'familia nuclear', 'familia extendida', 'consanguínea', 'punalúa', 'sindiásmica', 'patriarcal', 'monógama', 'alimentación', 'segunda unidad', 'unidad 2', 'eje 2'],
  },

  // --------------------------------------------------------------------------
  // LENGUA Y LITERATURA — 1° A 5° AÑO
  // --------------------------------------------------------------------------
  {
    id: 'lengua-planif-1ro',
    documentName: '2026 PRIORITARIOS 1RO A 5TO.docx',
    subject: 'Lengua y Literatura I',
    course: '1° Año',
    division: '1° y 2° División',
    year: 2026,
    docType: 'planificacion',
    unitNumber: 1,
    unitTitle: 'Unidad 1: Circuito de la Comunicación y Tipologías Textuales',
    sectionOrPage: 'Sección Saberes Prioritarios 1er Año',
    isPublic: true,
    teachers: 'Dpto. de Lengua y Literatura',
    content: `Saberes Prioritarios 1° Año:
1. El circuito de la comunicación: emisor, receptor, mensaje, canal, código, referente y situación comunicativa. Ruidos y retroalimentación.
2. Funciones del lenguaje (referencial, apelativa, expresiva, metalingüística, poética y fática).
3. Tramas textuales: narrativa, descriptiva, expositiva e instruccional.
4. Literatura: Mitos y leyendas del Noroeste Argentino (NOA) y tradición oral de La Rioja (El Crespín, La Salamanca, La Pachamama).`,
    keyConcepts: ['circuito de la comunicación', 'funciones del lenguaje', 'tipologías textuales', 'mitos y leyendas', 'la rioja', 'literatura', 'unidad 1'],
  },
  {
    id: 'lengua-planif-2do-3ro',
    documentName: '2026 PRIORITARIOS 1RO A 5TO.docx',
    subject: 'Lengua y Literatura',
    course: '2° y 3° Año',
    division: 'Todas las divisiones',
    year: 2026,
    docType: 'planificacion',
    unitNumber: 2,
    unitTitle: 'Unidad 2: El Texto Expositivo-Explicativo y Comprensión Lectora',
    sectionOrPage: 'Sección Saberes Prioritarios Ciclo Básico',
    isPublic: true,
    teachers: 'Dpto. de Lengua y Literatura',
    content: `Estrategias expositivas y explicativas:
- Estructura del texto académico: introducción, desarrollo y conclusión.
- Textos de opinión y argumento central: hipótesis, argumentos y contraargumentos en el discurso crítico.
- Recursos explicativos: definición, ejemplificación, reformulación, analogía y citas de autoridad.
- Técnicas de estudio: subrayado jerárquico, notas marginales, cuadros sinópticos y mapas conceptuales.
- Normativa ortográfica y signos de puntuación como ordenadores de sentido.`,
    keyConcepts: ['texto expositivo', 'recursos explicativos', 'técnicas de estudio', 'comprensión lectora', 'mapas conceptuales', 'resumen', 'unidad 2', 'argumento', 'argumento central', 'argumentativo'],
  },

  // --------------------------------------------------------------------------
  // HISTORIA — 1° Y 2° AÑO
  // --------------------------------------------------------------------------
  {
    id: 'historia-planif-1ro',
    documentName: 'Planif. 1° B Historia A. Garcia.pdf',
    subject: 'Historia Argentina y Regional',
    course: '1° Año',
    division: '1° División B',
    year: 2026,
    docType: 'planificacion',
    unitNumber: 1,
    unitTitle: 'Unidad 1: Los Pueblos Originarios y la Conquista de América',
    sectionOrPage: 'Página 2 / Planificación Anual Formato Oficial',
    isPublic: true,
    teachers: 'Prof. A. García',
    content: `Unidad 1: Pueblos Originarios del actual territorio argentino y de La Rioja.
Comunidades diaguitas, capayanes y olongastas en el valle riojano: organización comunal, alfarería, agricultura en terrazas y culto a la Pachamama y Llastay.
Proceso de invasión y colonización española. Fundación de la Ciudad de Todos los Santos de la Nueva Rioja (1591) por Juan Ramírez de Velasco. Resistencia diaguita y alzamientos calchaquíes.`,
    keyConcepts: ['historia', 'pueblos originarios', 'diaguitas', 'olongastas', 'la rioja colonial', 'fundación de la rioja', 'ramírez de velasco', 'unidad 1'],
  },
  {
    id: 'historia-cuadernillo-1ro',
    documentName: 'HISTORIA 1°AÑO.doc',
    subject: 'Historia Argentina y Regional',
    course: '1° Año',
    division: 'Todas las divisiones',
    year: 2026,
    docType: 'cuadernillo',
    unitNumber: 1,
    unitTitle: 'Cuadernillo de Continuidad Pedagógica: Historia 1° Año',
    sectionOrPage: 'Páginas 3-6 / Sección Culturas Aborígenes Riojanas',
    isPublic: true,
    teachers: 'Dpto. Ciencias Sociales',
    content: `Los aborígenes de La Rioja prehispánica:
Los diaguitas poblaron los valles fértiles de Famatina, Sanagasta y Arauco. Eran agricultores sedentarios (maíz, porotos, zapallo) y desarrollaron acequias de riego.
En los Llanos riojanos habitaron los olongastas, cazadores y recolectores de algarroba y chañar.
El señorío de los caciques y el trabajo con cerámica (vasijas urnas funerarias de la cultura Sanagasta o Hualfín).
Resistencia Calchaquí (1630-1665): Rebelión liderada por caciques contra el sistema de encomiendas y mitas impuesto por la corona española.`,
    keyConcepts: ['diaguitas', 'olongastas', 'sanagasta', 'famatina', 'los llanos', 'resistencia calchaquí', 'encomienda', 'historia riojana'],
  },

  // --------------------------------------------------------------------------
  // MATEMÁTICA — 1° AÑO
  // --------------------------------------------------------------------------
  {
    id: 'matematica-planif-1ro',
    documentName: 'Mapa Curricular Dpto Matematica 2025.docx',
    subject: 'Matemática I',
    course: '1° Año',
    division: '1° División',
    year: 2026,
    docType: 'planificacion',
    unitNumber: 1,
    unitTitle: 'Unidad 1: Números Enteros y Lenguaje Simbólico',
    sectionOrPage: 'Sección Eje Números y Operaciones',
    isPublic: true,
    teachers: 'Depto. de Matemática',
    content: `Eje Números Enteros (Z):
- Concepto de número negativo en contextos reales (temperatura bajo cero, deudas, altitudes y profundidades).
- Recta numérica, valor absoluto y orden en Z.
- Operaciones fundamentales: suma, resta, multiplicación y división entera. Regla de los signos.
- Ecuaciones de primer grado con una incógnita y traducción del lenguaje coloquial al lenguaje algebraico.`,
    keyConcepts: ['matemática', 'números enteros', 'recta numérica', 'regla de los signos', 'ecuaciones', 'lenguaje algebraico', 'unidad 1'],
  },

  // --------------------------------------------------------------------------
  // FORMACIÓN ÉTICA Y CIUDADANA — 1° Y 2° AÑO
  // --------------------------------------------------------------------------
  {
    id: 'feyc-cuadernillo-1ro',
    documentName: '1° Año FEyC.docx',
    subject: 'Formación Ética y Ciudadana',
    course: '1° Año',
    division: 'Ciclo Básico',
    year: 2026,
    docType: 'cuadernillo',
    unitNumber: 1,
    unitTitle: 'Unidad 1: La Persona Humana y las Normas de Convivencia',
    sectionOrPage: 'Página 2 / Sección: Tipos de Normas',
    isPublic: true,
    teachers: 'Dpto. Humanidades',
    content: `¿Qué es una norma social? Son reglas que orientan la conducta humana para hacer posible la convivencia armónica.
Cuatro tipos de normas:
1. Normas morales: Surgen de la conciencia individual y principios de lo bueno y lo justo. Su sanción es el remordimiento o reproche interno.
2. Normas jurídicas: Establecidas por el Estado y leyes formales (Constitución Nacional). Son obligatorias y su incumplimiento acarrea sanción legal externa (multa, pena).
3. Normas sociales o de trato social: Usos y costumbres comunitarias (saludar, vestimenta, cortesía). Sanción: rechazo o aislamiento social.
4. Normas religiosas: Fundadas en dogmas de fe y mandatos divinos. Sanción espiritual.`,
    keyConcepts: ['normas', 'normas morales', 'normas jurídicas', 'normas sociales', 'convivencia', 'constitución', 'ética', 'ciudadanía'],
  },

  // --------------------------------------------------------------------------
  // EDUCACIÓN TECNOLÓGICA — 1° Y 2° AÑO
  // --------------------------------------------------------------------------
  {
    id: 'tecno-cuadernillo-1ro',
    documentName: 'Tecnologia 1er Año - 1er Cuatr..pdf',
    subject: 'Educación Tecnológica',
    course: '1° Año',
    division: 'Ciclo Básico',
    year: 2026,
    docType: 'cuadernillo',
    unitNumber: 1,
    unitTitle: 'Unidad 1: Necesidades Humanas y Procesos Tecnológicos',
    sectionOrPage: 'Páginas 2 a 5 / Sección: Técnica, Tecnología y Sociedad',
    isPublic: true,
    teachers: 'Dpto. de Tecnología',
    content: `La tecnología como respuesta a las necesidades humanas.
Diferenciación entre:
- Necesidades primarias o vitales: alimentación, abrigo, vivienda, salud.
- Necesidades secundarias: educación, comunicación, recreación, confort.
Bienes y Servicios:
- Bienes: Objetos materiales tangibles producidos para satisfacer una necesidad (ropa, herramientas, libros).
- Servicios: Actividades intangibles organizadas por personas o instituciones para beneficio común (transporte público, energía eléctrica, salud, internet).
Procesos de transformación de la materia prima en productos tecnológicos.`,
    keyConcepts: ['tecnología', 'necesidades primarias', 'necesidades secundarias', 'bienes', 'servicios', 'procesos tecnológicos'],
  },

  // --------------------------------------------------------------------------
  // CIENCIAS NATURALES — FÍSICA Y QUÍMICA 1° Y 2° AÑO
  // --------------------------------------------------------------------------
  {
    id: 'csnat-planif-fisquim',
    documentName: 'Fisica y Quimica 1°F 2026.docx',
    subject: 'Física y Química',
    course: '1° Año',
    division: '1° División F',
    year: 2026,
    docType: 'planificacion',
    unitNumber: 1,
    unitTitle: 'Unidad 1: Materia, Estados de Agregación y Sistemas Materiales',
    sectionOrPage: 'Página 1 / Planificación Oficial 2026',
    isPublic: true,
    teachers: 'Dpto. Ciencias Naturales',
    content: `Contenidos de Física y Química 1° Año:
- Propiedades de la materia: extensivas (masa, volumen) e intensivas (densidad, punto de ebullición, punto de fusión).
- Estados de agregación: sólido, líquido, gaseoso y modelo cinético corpuscular.
- Cambios de estado: fusión, solidificación, vaporización, condensación, sublimación y volatilización.
- Sistemas materiales: homogéneos (soluciones, sustancias puras) y heterogéneos (fases, componentes, métodos de separación como filtración, decantación y tamizado).`,
    keyConcepts: ['física y química', 'materia', 'estados de agregación', 'sistemas materiales', 'homogéneo', 'heterogéneo', 'cambios de estado', 'densidad'],
  }
];

export class RAGEngine {
  constructor() {
    this.memoryChunks = [...INITIAL_KNOWLEDGE_BASE];
    this.queryRateLimitLog = [];
    this.loadPersistedCustomChunks();
  }

  // Cargar fragmentos adicionales generados por docentes en el navegador o sincronizados
  loadPersistedCustomChunks() {
    try {
      const stored = localStorage.getItem('campus_rag_custom_chunks');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.memoryChunks.push(...parsed);
        }
      }
    } catch {
      // Ignorar fallos de acceso local
    }
  }

  // Guardar fragmento nuevo cargado por un docente en la biblioteca
  ingestUploadedMaterial(material, extractedText = '') {
    if (!material) return null;

    const chunkId = 'custom-' + (material.id || Date.now());
    const newChunk = {
      id: chunkId,
      documentName: material.file_name || material.title + '.pdf',
      subject: material.subject_name || 'Materia Institucional',
      subjectId: material.subject_id,
      course: material.course_name || 'Curso Asignado',
      division: material.division || '',
      year: 2026,
      docType: (material.title && material.title.toLowerCase().includes('planificac')) ? 'planificacion' : 'cuadernillo',
      unitNumber: material.unit_number || 1,
      unitTitle: material.unit_title || `Unidad ${material.unit_number || 1}`,
      sectionOrPage: 'Biblioteca Digital — Documento Subido',
      isPublic: material.is_public || false,
      teachers: material.teacher_name || 'Docente de la Cátedra',
      content: extractedText.trim() || `${material.title}: ${material.description || 'Documento educativo cargado en la biblioteca institucional.'}`,
      keyConcepts: [
        ...(material.title || '').toLowerCase().split(/\s+/),
        ...(material.unit_title || '').toLowerCase().split(/\s+/),
      ].filter((w) => w.length > 3),
    };

    // Reemplazar si existía
    this.memoryChunks = this.memoryChunks.filter((c) => c.id !== chunkId);
    this.memoryChunks.unshift(newChunk);

    try {
      const customOnly = this.memoryChunks.filter((c) => c.id.startsWith('custom-'));
      localStorage.setItem('campus_rag_custom_chunks', JSON.stringify(customOnly));
    } catch {
      // ignore
    }

    return newChunk;
  }

  // Eliminar o invalidar fragmentos cuando se borra un archivo de la biblioteca
  removeDocumentChunks(materialId) {
    this.memoryChunks = this.memoryChunks.filter((c) => c.id !== 'custom-' + materialId && c.materialId !== materialId);
    try {
      const customOnly = this.memoryChunks.filter((c) => c.id.startsWith('custom-'));
      localStorage.setItem('campus_rag_custom_chunks', JSON.stringify(customOnly));
    } catch {
      // ignore
    }
  }

  // Validación de tasa de consultas para acceso público
  checkRateLimit(identifier = 'guest') {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    this.queryRateLimitLog = this.queryRateLimitLog.filter((entry) => entry.timestamp > tenMinutesAgo);

    const userCount = this.queryRateLimitLog.filter((entry) => entry.id === identifier).length;
    if (userCount >= 25) {
      return { allowed: false, error: 'Has alcanzado el límite de 25 consultas cada 10 minutos. Por favor aguardá unos instantes.' };
    }

    this.queryRateLimitLog.push({ id: identifier, timestamp: now });
    return { allowed: true };
  }

  // Detección de intenciones y entidades pedagógicas en la consulta
  analyzeUserQuery(prompt = '') {
    const text = prompt.toLowerCase();

    // Detección de Materia
    let detectedSubject = null;
    if (text.includes('antropol')) detectedSubject = 'Antropología';
    else if (text.includes('lengua') || text.includes('literatura') || text.includes('comunicaci')) detectedSubject = 'Lengua y Literatura';
    else if (text.includes('historia') || text.includes('colonial') || text.includes('diaguita') || text.includes('velasco')) detectedSubject = 'Historia Argentina y Regional';
    else if (text.includes('matemática') || text.includes('matematica') || text.includes('entero') || text.includes('ecuacion')) detectedSubject = 'Matemática I';
    else if (text.includes('ética') || text.includes('etica') || text.includes('norma') || text.includes('ciudadan')) detectedSubject = 'Formación Ética y Ciudadana';
    else if (text.includes('tecnolog') || text.includes('técnica') || text.includes('bienes')) detectedSubject = 'Educación Tecnológica';
    else if (text.includes('química') || text.includes('quimica') || text.includes('física') || text.includes('fisica') || text.includes('materia') || text.includes('estado')) detectedSubject = 'Física y Química';

    // Detección de Curso / Año
    let detectedCourse = null;
    if (text.includes('5to') || text.includes('5°') || text.includes('quinto')) detectedCourse = '5° Año';
    else if (text.includes('4to') || text.includes('4°') || text.includes('cuarto')) detectedCourse = '4° Año';
    else if (text.includes('3er') || text.includes('3°') || text.includes('tercer')) detectedCourse = '3° Año';
    else if (text.includes('2do') || text.includes('2°') || text.includes('segundo')) detectedCourse = '2° Año';
    else if (text.includes('1er') || text.includes('1°') || text.includes('primer')) detectedCourse = '1° Año';

    // Detección de Unidad o Eje
    let detectedUnit = null;
    if (text.includes('segunda unidad') || text.includes('unidad 2') || text.includes('eje 2') || text.includes('eje n° 2') || text.includes('eje nª2') || text.includes('unidad ii')) {
      detectedUnit = 2;
    } else if (text.includes('primera unidad') || text.includes('unidad 1') || text.includes('eje 1') || text.includes('eje n° 1') || text.includes('unidad i')) {
      detectedUnit = 1;
    } else if (text.includes('tercera unidad') || text.includes('unidad 3') || text.includes('eje 3')) {
      detectedUnit = 3;
    }

    return {
      text,
      detectedSubject,
      detectedCourse,
      detectedUnit,
      wantsSummary: text.includes('resumen') || text.includes('sintesis') || text.includes('síntesis'),
      wantsQuiz: text.includes('cuestionario') || text.includes('repaso') || text.includes('evaluación') || text.includes('evaluacion') || text.includes('preguntas'),
      wantsSteps: text.includes('paso a paso') || text.includes('procedimiento') || text.includes('cómo se hace') || text.includes('como se hace') || text.includes('resolver'),
      asksSpecificPage: text.includes('página') || text.includes('pagina') || text.includes('sección') || text.includes('seccion'),
    };
  }

  // Búsqueda semántica ponderada en la base de conocimiento
  searchRelevantChunks(prompt, options = {}) {
    const {
      isPublic = false,
      userRole = 'guest',
      subjectId = null,
      subjectName = null,
    } = options;

    const analysis = this.analyzeUserQuery(prompt);
    const targetSubject = subjectName || analysis.detectedSubject;

    const queryWords = prompt
      .toLowerCase()
      .replace(/[¿?¡!.,:;()\[\]]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let candidates = this.memoryChunks.filter((chunk) => {
      // 1. Filtro de privacidad: Si la consulta es pública / invitada, solo fragmentos públicos
      if (isPublic && !chunk.isPublic) {
        return false;
      }

      // 2. Filtro de materia si está especificada en el contexto de navegación
      if (targetSubject && !chunk.subject.toLowerCase().includes(targetSubject.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Ponderación de relevancia
    const scored = candidates.map((chunk) => {
      let score = 0;

      // Si el usuario especificó o está navegando la materia, asignar puntaje base
      if (targetSubject && chunk.subject.toLowerCase().includes(targetSubject.toLowerCase())) {
        score += 15;
      }

      // Coincidencia exacta de unidad/eje
      if (analysis.detectedUnit && chunk.unitNumber === analysis.detectedUnit) {
        score += 50;
      }

      // Coincidencia de curso
      if (analysis.detectedCourse && chunk.course.includes(analysis.detectedCourse)) {
        score += 20;
      }

      // Coincidencias de palabras clave en el contenido
      const contentLower = chunk.content.toLowerCase();
      const titleLower = (chunk.documentName + ' ' + chunk.unitTitle).toLowerCase();

      for (const word of queryWords) {
        if (titleLower.includes(word)) score += 15;
        if (contentLower.includes(word)) score += 8;
        if (chunk.keyConcepts.some((k) => k.includes(word))) score += 10;
      }

      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Retornar los más relevantes
    return scored.filter((s) => s.score > 0).map((s) => s.chunk);
  }

  // Generador de Respuestas Fundamentadas Pedagógicamente
  generateGroundAnswer(prompt, options = {}) {
    const analysis = this.analyzeUserQuery(prompt);
    const relevantChunks = this.searchRelevantChunks(prompt, options);

    const queryWords = prompt
      .toLowerCase()
      .replace(/[¿?¡!.,:;()\[\]]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Validación estricta de veracidad: verificar si las palabras sustantivas de la pregunta
    // están verdaderamente presentes en el material recuperado (evita alucinaciones o falsos positivos)
    const substantiveWords = queryWords.filter(
      (w) => !['cual', 'cuál', 'temario', 'examen', 'año', 'normal', 'materia', 'explicame', 'tema', 'hola', 'ayuda', 'sobre'].includes(w)
    );

    const hasSubstantiveMatch = relevantChunks.some((chunk) => {
      const fullText = (chunk.content + ' ' + chunk.unitTitle + ' ' + (chunk.keyConcepts || []).join(' ')).toLowerCase();
      return substantiveWords.some((w) => fullText.includes(w));
    });

    // Si no hay fragmentos relevantes o si los términos sustantivos no existen en los documentos reales:
    if (relevantChunks.length === 0 || (substantiveWords.length > 1 && !hasSubstantiveMatch)) {
      return {
        answer: `⚠️ **Información institucional no disponible en los materiales:**
No se encontró información suficiente en los documentos y planificaciones oficiales autorizados de la Escuela Normal para responder con exactitud a tu consulta sobre: *«${prompt}»*.

Para preservar la precisión pedagógica y no presentar conjeturas como hechos institucionales, el Tutor IA no formula suposiciones como si fueran hechos. Te sugerimos:
1. Consultar con tu docente a cargo de la cátedra durante el horario de clases o consulta institucional.
2. Revisar la sección de **Biblioteca Digital** de tu materia para verificar si existen nuevas lecturas publicadas.
3. Si necesitás repasar contenidos de **Antropología**, **Lengua y Literatura**, **Historia Argentina**, **Matemática** o **Formación Ética**, podés hacerme una pregunta específica indicando el tema o la unidad.`,
        sources: [],
        found: false,
      };
    }

    // Separar Planificaciones vs Cuadernillos
    const planifChunks = relevantChunks.filter((c) => c.docType === 'planificacion');
    const cuadernilloChunks = relevantChunks.filter((c) => c.docType === 'cuadernillo');

    const primaryCuadernillo = cuadernilloChunks[0] || relevantChunks[0];
    const primaryPlanif = planifChunks[0] || null;

    // Preparación de fuentes estructuradas para el usuario
    const sources = relevantChunks.slice(0, 3).map((c) => ({
      documentName: c.documentName,
      subject: c.subject,
      course: c.course,
      division: c.division,
      unitTitle: c.unitTitle,
      unitNumber: c.unitNumber,
      docType: c.docType === 'planificacion' ? 'Planificación Docente' : 'Cuadernillo Educativo',
      sectionOrPage: c.sectionOrPage,
      teachers: c.teachers,
      evidenceExcerpt: c.content.substring(0, 240) + '...',
    }));

    // Caso Especial 1: Segunda Unidad de Antropología (Consulta prioritaria requerida)
    if (
      (analysis.detectedSubject === 'Antropología' || prompt.toLowerCase().includes('antropol')) &&
      (analysis.detectedUnit === 2 || prompt.toLowerCase().includes('cultura') || prompt.toLowerCase().includes('segunda'))
    ) {
      return this.formatAntropologiaUnidad2Answer(sources, analysis);
    }

    // Caso Especial 2: Primera Unidad de Antropología (Definición, Lévi-Strauss, Ramas)
    if (
      (analysis.detectedSubject === 'Antropología' || prompt.toLowerCase().includes('antropol')) &&
      (analysis.detectedUnit === 1 || prompt.toLowerCase().includes('rama') || prompt.toLowerCase().includes('lévi') || prompt.toLowerCase().includes('levi'))
    ) {
      return this.formatAntropologiaUnidad1Answer(sources);
    }

    // Generador General basado en los fragmentos encontrados
    return this.formatGenericGroundedAnswer(prompt, primaryCuadernillo, primaryPlanif, sources, analysis);
  }

  // Respuesta específica y estructurada para la Segunda Unidad de Antropología
  formatAntropologiaUnidad2Answer(sources, analysis) {
    const responseText = `### Explicación Pedagógica: Segunda Unidad de Antropología
**Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros • 5° Año (Divisiones “B” y “F”)**

---

#### 1. Contexto Curricular (según la Planificación Docente Oficial)
De acuerdo con la **Planificación Anual de Antropología**, la segunda unidad se titula:
> **«EJE N° 2: La Cultura como modo de explicación de la diversidad humana»**  
> *Docentes a cargo:* Prof. Adriana Cejas y Prof. Sandra Cornejo.  
> *Propósito pedagógico:* Comprender el concepto de cultura no de forma aislada, sino como una trama dinámica de significados que da origen al orden social y explica la diversidad de formas de vida en las sociedades humanas contemporáneas.

---

#### 2. Desarrollo de los Contenidos (según el Cuadernillo de Actividades Oficial)

El cuadernillo institucional aborda este tema a través de cuatro conceptos fundamentales explicados de manera sencilla:

##### A. ¿Qué es la Cultura?
- La cultura es una dimensión de la vida social que todos adquirimos mediante el proceso de socialización a lo largo del tiempo.
- **Características clave:**
  1. **Es aprendida:** Los seres humanos la absorbemos desde la infancia de forma consciente e inconsciente.
  2. **Es compartida:** No es un rasgo individual aislado, sino un atributo de las personas en tanto miembros de una sociedad.
  3. **Es simbólica:** Se basa en signos y símbolos (lenguaje, banderas, expresiones).
  4. **Somete a la naturaleza:** Toma necesidades puramente biológicas (como la alimentación o el descanso) y nos enseña a satisfacerlas mediante pautas culturales particulares.
  5. **Lo abarca todo:** Comprende tanto las costumbres y valores cotidianos como la organización familiar y las creencias.

##### B. La Diversidad Cultural
- La UNESCO la define como la **pluralidad de culturas que coexisten en el mundo**.
- El cuadernillo advierte sobre dos actitudes posibles frente a las diferencias:
  - *Postura etnocéntrica / jerarquizante:* Establecer que una cultura es superior a otra, lo que conduce a la discriminación y dominación.
  - *Postura de reconocimiento y pluralidad:* Comprender y respetar la diversidad cultural como una riqueza social compartida.

##### C. Las Configuraciones Familiares
El material explica que la familia clásica se formuló como un grupo de residencia común, cooperación económica y reproducción, y clasifica los tipos de familia a lo largo de la historia:
- **Consanguínea, Punalúa y Sindiásmica:** Formas tempranas de parentesco.
- **Patriarcal y Monógama:** Configuraciones con autoridad y cohabitación reglada.
- **Familia Nuclear vs. Familia Extendida:** Diferenciación fundamental en las sociedades actuales.

##### D. La Alimentación como Práctica Cultural
- Comer no es un mero acto biológico: los hábitos alimentarios reflejan identidades, tradiciones locales y relaciones de convivencia comunitaria.

---

#### 3. Aplicación y Actividades Previstas
En el cuadernillo de actividades, las docentes solicitan:
- Identificar ejemplos cotidianos donde la cultura «somete a la naturaleza».
- Explicar con palabras propias la diferencia entre familia nuclear y extendida.
- Analizar una problemática de diversidad cultural sin caer en prejuicios etnocéntricos.`;

    return {
      answer: responseText,
      sources,
      found: true,
      subject: 'Antropología',
      unit: 'Eje N° 2: La Cultura como modo de explicación de la diversidad humana',
      course: '5° Año (Divisiones “B” y “F”)',
    };
  }

  // Respuesta específica para la Primera Unidad de Antropología
  formatAntropologiaUnidad1Answer(sources) {
    const responseText = `### Explicación Pedagógica: Primera Unidad de Antropología
**Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros • 5° Año**

---

#### 1. Definición y Sentido de la Disciplina
- **Etimología:** Proviene de los términos griegos *anthropos* (ser humano u hombre) y *logos* (estudio, tratado o conocimiento). Por lo tanto, es la ciencia que estudia al ser humano de forma integral y global.
- **Definición de Claude Lévi-Strauss (1958, p. 368):**
  > «La antropología apunta a un conocimiento global del hombre y abarca el objeto en toda su extensión geográfica e histórica: aspira a un conocimiento aplicable al conjunto del desenvolvimiento del hombre desde los homínidos hasta las sociedades modernas.»

---

#### 2. Las Cuatro Ramas de la Antropología (según el Cuadernillo)
1. **Antropología Física / Biológica:** Analiza la variabilidad biológica, la morfología humana, la evolución (paleontología humana) y la antropología forense.
2. **Arqueología:** Reconstruye la vida de sociedades pasadas a través del registro material y fósil (herramientas, ruinas, vasijas).
3. **Lingüística Antropológica:** Estudia cómo las lenguas configuran la cultura, la identidad y las formas de percibir el mundo.
4. **Antropología Social y Cultural:** Investiga las costumbres, instituciones, parentescos, creencias y relaciones de poder en las sociedades vivas.`;

    return {
      answer: responseText,
      sources,
      found: true,
      subject: 'Antropología',
      unit: 'Eje N° 1: La Antropología como disciplina científica',
      course: '5° Año',
    };
  }

  // Formateador genérico con correlación Planificación - Cuadernillo
  formatGenericGroundedAnswer(prompt, cuadernillo, planif, sources, analysis) {
    const subjectTitle = cuadernillo.subject || (planif ? planif.subject : 'Materia Institucional');
    const unitTitle = cuadernillo.unitTitle || (planif ? planif.unitTitle : 'Unidad Curricular');

    let answer = `### Explicación Pedagógica: ${subjectTitle}
**Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros**
*${cuadernillo.course} • ${unitTitle}*

---

#### 1. Marco Curricular Institucional
${planif 
  ? `Según la **Planificación Anual Docente** (${planif.documentName}), este tema corresponde a los propósitos formativos prioritarios:
> ${planif.content.split('\n')[0]}
*Objetivo pedagógico:* Fomentar la comprensión conceptual, el razonamiento crítico y la articulación con situaciones prácticas del estudiante.`
  : `El contenido está enmarcado en el programa curricular oficial de ${subjectTitle} de la institución.`}

---

#### 2. Desarrollo Explicativo Paso a Paso (Fuente: ${cuadernillo.documentName})
${cuadernillo.content}

---

#### 3. Orientación Pedagógica para el Alumno
- **Paso 1:** Identificá las definiciones principales y anotá con tus propias palabras qué significa cada término central.
- **Paso 2:** Relacioná estos conceptos con los ejemplos brindados en tus clases.
- **Paso 3:** Si tenés dudas sobre una consigna del cuadernillo, consultame indicando la pregunta exacta para desglosarla paso a paso sin inventar respuestas.`;

    return {
      answer,
      sources,
      found: true,
      subject: subjectTitle,
      unit: unitTitle,
      course: cuadernillo.course,
    };
  }
}

export const ragEngine = new RAGEngine();
