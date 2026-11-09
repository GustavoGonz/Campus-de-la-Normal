# Campus: La Normal
> **Eslogan:** *«Aprender mejor, juntos»*  
> **Institución:** Escuela Normal Dr. Pedro Ignacio de Castro Barros — La Rioja, Argentina.

Plataforma educativa institucional estructurada como una **biblioteca digital de archivos PDF por materia**, planificación de clases, calendario escolar y tutor pedagógico inteligente para la comunidad educativa de la Escuela Normal.

---

## 🏛️ 1. Arquitectura y Tecnologías del Proyecto

El proyecto está construido bajo una **arquitectura modular y escalable** con separación estricta entre capa visual, lógica de negocio, control de acceso y persistencia:

- **Frontend & UI:** React (JavaScript ES6+ / JSX) sobre **Vite** para desarrollo y empaquetado ágil.
- **Sistema de Diseño:** CSS3 puro con tokens institucionales inspirados en los colores oficiales de la Escuela Normal (Azul Real `#0C13A8`, Naranja Institucional `#FF7B15`, Blanco y Dorado), tipografías *Plus Jakarta Sans* y *Outfit*, componentes accesibles, tarjetas interactivas y diseño responsivo para móviles, tablets y computadoras.
- **Iconografía:** Lucide React.
- **Navegación:** React Router con verificación de roles en rutas protegidas (`ProtectedRoute`).
- **Persistencia & Backend:** Supabase (PostgreSQL, Supabase Auth y Supabase Storage para los documentos PDF).
- **Pruebas Automatizadas:** Vitest con pruebas completas de los flujos de biblioteca, roles y autenticación.

---

## 👥 2. Los Cuatro Roles Institucionales y sus Permisos

La plataforma cuenta con **cuatro roles oficiales** organizados en orden estricto de visualización y administración:

1. **Estudiante (`student`):**
   - Acceder a las materias en las que se encuentra inscripto.
   - Consultar la biblioteca digital de sus materias.
   - Abrir y descargar los documentos en formato PDF disponibles.
   - Consultar clases planificadas y calendario escolar.
   - No puede subir, modificar ni eliminar archivos de la biblioteca.

2. **Docente (`teacher`):**
   - Acceder a sus materias asignadas.
   - Administrar la biblioteca digital de archivos PDF de sus materias.
   - Subir nuevos archivos PDF con título, descripción pedagógica y unidad/tema.
   - Reemplazar o actualizar sus propios archivos PDF incrementando la versión del material.
   - Eliminar sus propios archivos, removiéndolos de la base de datos y de Supabase Storage.
   - Organizar el material por carpetas y unidades temáticas.
   - Planificar clases y vincular los documentos PDF de la biblioteca.
   - Revisar y aprobar o rechazar solicitudes de matriculación de estudiantes.

3. **Administrador (`admin`):**
   - Administrar usuarios y sus estados (activo/suspendido).
   - Asignar y modificar los cuatro roles institucionales (Estudiante, Docente, Administrador, Invitado).
   - Crear y gestionar cursos, divisiones, turnos y materias.
   - Tener acceso irrestricto a las funciones administrativas de la plataforma.

4. **Invitado (`guest`):**
   - Acceso limitado a la aplicación y a las secciones públicas autorizadas.
   - Visualizar la propuesta formativa, los cursos institucionales y el calendario escolar.
   - No puede ingresar a materias privadas ni acceder a archivos PDF restringidos.
   - No puede modificar información ni administrar usuarios.

> **Seguridad y Control de Roles:** Los usuarios no pueden convertirse por sí mismos en docentes o administradores. La asignación de roles privilegiados está controlada por el administrador y protegida a nivel de base de datos con políticas de seguridad RLS en PostgreSQL.

---

## 📚 3. Biblioteca Digital de Archivos PDF por Materia

La plataforma funciona como una **biblioteca digital de materiales educativos** en formato PDF:

- **Sin sistema de actividades ni entrega de tareas:** Se eliminó completamente la creación y corrección de actividades, entrega de tareas, calificaciones e historial de entregas.
- **Almacenamiento Seguro en Supabase Storage:** Todos los documentos se guardan en el bucket `course-materials`, relacionados con su materia respectiva.
- **Validación Estricta:** Se valida el formato exclusivamente en **PDF** (`.pdf` / `application/pdf`) y un tamaño máximo de 50 MB por archivo.
- **Persistencia Real:** Los archivos se conservan permanentemente y continúan disponibles tras cerrar sesión y volver a ingresar.
- **Mensaje de Estado:** Si una materia no posee archivos cargados aún, se muestra el mensaje institucional: *«Todavía no hay material disponible para esta materia»*.

---

## 🔐 4. Inicio de Sesión con Gmail y Supabase Authentication

La aplicación implementa inicio de sesión real mediante dos modalidades complementarias:

### A. Correo Electrónico (Gmail) y Contraseña
- Admite cualquier cuenta de Gmail (`usuario@gmail.com`) o correo institucional.
- Los correos se normalizan en minúsculas y sin espacios (`trim().toLowerCase()`).
- Mensajes de error claros y en español para credenciales incorrectas, correo no confirmado, usuario no registrado o límite de intentos.
- Persistencia de sesión automática mediante `localStorage` y `onAuthStateChange`.
- Recuperación de contraseñas mediante correo con enlace directo a la página `/reset-password` para ingresar la nueva clave.

### B. Inicio de Sesión Directo con Google OAuth (Gmail)
- Botón **«Continuar con Google (Gmail)»** en la pantalla de inicio de sesión.
- Utiliza `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })`.
- Captura la sesión al regresar y crea automáticamente el perfil con rol de **Estudiante** (o Invitado) si es el primer ingreso del usuario.

> **Configuración en el Dashboard de Supabase:**
> 1. Ir a **Authentication** > **Providers** > **Google**.
> 2. Habilitar el proveedor ingresando el *Client ID* y *Client Secret* de Google Cloud Console.
> 3. En **URL Configuration**, agregar la URL del sitio (ej. `http://localhost:5173` o dominio de producción) en **Site URL** y **Redirect URLs**.

---

## 📁 5. Estructura del Código

```
Campus-de-la-Normal/
├── public/                 # Recursos públicos y favicon institucional
├── src/
│   ├── config/             # Cliente de conexión con Supabase
│   │   └── supabaseClient.js
│   ├── context/            # Contexto de Autenticación y Notificaciones
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── services/           # Lógica de negocio y servicios
│   │   ├── subjectService.js         # Materias, cursos y solicitudes
│   │   ├── materialService.js        # Biblioteca Digital de archivos PDF
│   │   ├── classService.js           # Clases y cronograma docente
│   │   ├── aiService.js              # Tutor IA pedagógico por materia
│   │   ├── previousSubjectsService.js# Materias previas y checklist de unidades
│   │   ├── adminService.js           # Gestión de usuarios y roles
│   │   └── storageService.js         # Validación y subida a Supabase Storage
│   ├── components/
│   │   ├── auth/           # Rutas protegidas por rol
│   │   ├── common/         # Navbar, Sidebar, Modales, Spinner, Buscador
│   │   └── layout/         # Shell principal adaptable
│   ├── pages/
│   │   ├── public/         # Inicio institucional y Restablecer contraseña
│   │   │   ├── LandingPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── dashboard/      # Enrutador según rol (DashboardRouter)
│   │   ├── guest/          # Panel exclusivo del rol Invitado (GuestDashboard)
│   │   ├── teacher/        # Aula docente, Biblioteca de PDF, Clases
│   │   ├── student/        # Aula estudiantil, Biblioteca de lectura
│   │   ├── ai/             # Tutor Inteligente IA
│   │   ├── previousSubjects/# Preparación de materias previas
│   │   ├── calendar/       # Calendario escolar interactivo
│   │   ├── admin/          # Panel administrativo de usuarios y 4 roles
│   │   └── profile/        # Perfil y datos del usuario
│   ├── tests/              # Pruebas obligatorias de validación
│   │   └── campus.test.js
│   ├── App.jsx             # Árbol de rutas principal
│   ├── index.css           # Tokens de diseño e identidad institucional
│   └── main.jsx
├── supabase/
│   ├── schema.sql          # Script completo de Base de Datos y Políticas RLS
│   ├── migration_roles_and_library.sql # Migración incremental para Supabase
│   └── setup_admin.sql     # Procedimiento para designar administrador
├── .env                    # Variables de entorno conectadas a Supabase
├── .env.example            # Plantilla de variables de entorno
└── package.json
```

---

## ⚙️ 6. Configuración y Despliegue

### Variables de Entorno (`.env`)
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

### Ejecución de Pruebas:
```bash
npm test
```
