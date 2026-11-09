# Campus: La Normal
> **Eslogan:** *«Aprender mejor, juntos»*  
> **Institución:** Escuela Normal Superior Dr. Pedro Ignacio de Castro Barros — La Rioja, Argentina.

Plataforma educativa institucional centrada en el **Tutor IA Pedagógico con sistema RAG**, acompañada de la **biblioteca digital de archivos PDF por materia**, planificación de clases, calendario escolar y gestión por roles para la comunidad educativa de la Escuela Normal.

---

## 🏛️ 1. Arquitectura y Tecnologías del Proyecto

El proyecto está construido bajo una **arquitectura modular y escalable** con separación estricta entre capa visual, lógica de negocio, control de acceso y persistencia:

- **Frontend & UI:** React (JavaScript ES6+ / JSX) sobre **Vite**.
- **Sistema de Diseño:** CSS3 puro con tokens institucionales inspirados en los colores oficiales de la Escuela Normal (Azul Real `#0C13A8`, Naranja Institucional `#FF7B15`, Blanco y Dorado), tipografías *Plus Jakarta Sans* y *Outfit*, diseño responsivo para móviles, tablets y computadoras.
- **Tutor IA Unificado + Motor RAG:** Un único componente `AITutorPage` y un único servicio `aiService` + `ragEngine` compartidos entre la página pública de inicio y el campus autenticado.
- **Navegación:** React Router con verificación de roles en rutas protegidas (`ProtectedRoute`) y soporte SPA en producción (`vercel.json`).
- **Persistencia & Backend:** Supabase (PostgreSQL con políticas RLS completas, Supabase Auth por correo y contraseña, y Supabase Storage para documentos PDF).
- **Pruebas Automatizadas:** Vitest con suite integral de validación de Tutor IA, autenticación, redirecciones de producción y accesos rápidos por rol.

---

## 👥 2. Los Cuatro Roles Institucionales y Accesos Rápidos

La plataforma cuenta con **cuatro roles oficiales** organizados en orden estricto de visualización y administración, con **Accesos Rápidos** disponibles para validación inmediata:

1. **Estudiante (`student`):**
   - Consultar el **Tutor IA unificado** sobre sus materias y materiales autorizados.
   - Acceder a las materias en las que se encuentra inscripto y a su biblioteca digital de archivos PDF.
   - Consultar clases planificadas, materias previas y calendario escolar.
   - No puede subir, modificar ni eliminar archivos de la biblioteca.

2. **Docente (`teacher`):**
   - Consultar el **Tutor IA unificado** como asistente pedagógico.
   - Administrar la biblioteca digital de archivos PDF de sus materias (subir, reemplazar versionando y eliminar archivos propios).
   - Planificar clases y revisar solicitudes de matriculación de estudiantes.

3. **Administrador (`admin`):**
   - Administrar usuarios, activar/suspender cuentas y asignar los cuatro roles institucionales.
   - Crear y gestionar cursos, divisiones, turnos y materias.
   - Acceder al **Tutor IA unificado** y al control general del campus.

4. **Invitado (`guest`):**
   - Acceso acotado a espacios públicos autorizados y al **Tutor IA** (restringido exclusivamente a fuentes públicas autorizadas).
   - Visualizar la oferta curricular, los cursos institucionales y el calendario escolar.
   - Sin acceso a aulas privadas, materias previas ni archivos PDF restringidos.

---

## 🔐 3. Autenticación Institucional y Configuración de Redirecciones en Producción

El inicio de sesión y registro utiliza **exclusivamente Correo electrónico y Contraseña** a través de Supabase Auth (sin proveedores OAuth sociales):

- **Inicio de sesión y registro:** Normalización de correo electrónico (`trim().toLowerCase()`) y mensajes claros en español.
- **Confirmación de correo electrónico (`/auth/callback`):** Al registrarse, `signUp` envía `emailRedirectTo: 'https://campus-de-la-normal.vercel.app/auth/callback'`. La ruta `AuthCallbackPage` valida automáticamente el token (`token_hash` / PKCE `code`), crea la sesión activa y redirige al usuario autenticado a `/panel`.
- **Recuperación de contraseña (`/reset-password`):** Envía el enlace al dominio oficial de producción (`https://campus-de-la-normal.vercel.app/reset-password`) y valida el token antes de actualizar la clave.

> **Configuración obligatoria en el Dashboard de Supabase (`Authentication` → `URL Configuration`):**
> - **Site URL:** `https://campus-de-la-normal.vercel.app`
> - **Redirect URLs:**
>   - `https://campus-de-la-normal.vercel.app/**`
>   - `https://campus-de-la-normal.vercel.app/auth/callback`
>   - `https://campus-de-la-normal.vercel.app/reset-password`

---

## 📁 4. Estructura del Código

```
Campus-de-la-Normal/
├── public/                 # Recursos públicos e identidad institucional
├── src/
│   ├── config/
│   │   └── supabaseClient.js         # Cliente Supabase y URL oficial de producción (getSiteUrl)
│   ├── context/
│   │   ├── AuthContext.jsx           # Autenticación email/password, callbacks y accesos rápidos por rol
│   │   └── NotificationContext.jsx
│   ├── services/
│   │   ├── ragEngine.js              # Motor RAG institucional con citas verificables
│   │   ├── aiService.js              # Servicio único del Tutor IA (público y autenticado)
│   │   ├── subjectService.js         # Materias, cursos y solicitudes de acceso
│   │   ├── materialService.js        # Biblioteca Digital de archivos PDF
│   │   ├── classService.js           # Clases y cronograma docente
│   │   ├── previousSubjectsService.js# Materias previas y checklist de unidades
│   │   ├── adminService.js           # Gestión de usuarios y 4 roles
│   │   └── storageService.js         # Validación PDF y subida a Supabase Storage
│   ├── data/
│   │   └── institutionalKnowledgeBase.js # Corpus oficial indexado (Planificaciones y Cuadernillos)
│   ├── components/
│   │   ├── auth/ProtectedRoute.jsx   # Protección de rutas y permisos por rol
│   │   ├── common/                   # Navbar, Sidebar, Modales, Spinner, Buscador
│   │   └── layout/AppLayout.jsx      # Shell principal adaptable
│   ├── pages/
│   │   ├── public/                   # LandingPage, AuthCallbackPage, ResetPasswordPage
│   │   ├── ai/AITutorPage.jsx        # Único componente del Tutor IA en toda la plataforma
│   │   ├── dashboard/DashboardRouter.jsx # Enrutamiento por rol en /panel
│   │   ├── student/                  # Panel estudiantil y biblioteca de lectura
│   │   ├── teacher/                  # Panel docente y gestión de biblioteca PDF
│   │   ├── guest/                    # Panel exclusivo del rol Invitado
│   │   ├── admin/                    # Panel administrativo de usuarios, materias y cursos
│   │   ├── previousSubjects/         # Preparación de materias previas
│   │   ├── calendar/                 # Calendario escolar interactivo
│   │   └── profile/                  # Perfil y datos del usuario
│   ├── tests/
│   │   └── campus.test.js            # Pruebas automatizadas integrales
│   ├── App.jsx                       # Árbol de rutas principal
│   ├── index.css                     # Tokens de diseño e identidad institucional
│   └── main.jsx
├── supabase/
│   ├── schema.sql                    # Esquema completo PostgreSQL y políticas RLS
│   ├── migration_roles_and_library.sql
│   └── setup_admin.sql
├── vercel.json                       # Reglas de reescritura SPA para rutas en producción
├── .env.example                      # Plantilla de variables de entorno
└── package.json
```

---

## ⚙️ 5. Variables de Entorno y Comandos

### Variables de Entorno (`.env`)
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
VITE_SITE_URL=https://campus-de-la-normal.vercel.app
```

### Comandos de Verificación:
```bash
npm run lint
npm test
npm run build
```
