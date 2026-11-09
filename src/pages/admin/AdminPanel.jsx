import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { adminService } from '../../services/adminService';
import { subjectService } from '../../services/subjectService';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  UserCheck, 
  UserX,
  Search,
  Sparkles
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { InstitutionalLogo } from '../../components/common/InstitutionalLogo';
import { AITutorPage } from '../ai/AITutorPage';

const getTabFromPath = (pathname) => {
  if (pathname.includes('/admin/materias')) return 'subjects';
  if (pathname.includes('/admin/cursos')) return 'courses';
  if (pathname.includes('/admin/tutor')) return 'tutor';
  return 'users';
};

export const AdminPanel = () => {
  const { showToast } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname)); // 'users', 'subjects', 'courses', 'tutor'
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de usuarios
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // all, student, teacher, admin, guest
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Modales
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', division: '', shift: 'Mañana', year: 2026 });

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
    course_id: '',
    access_type: 'request_only',
  });

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [uList, sList, cList] = await Promise.all([
        adminService.getUsers(),
        subjectService.getSubjects(),
        subjectService.getCourses(),
      ]);
      setUsers(uList);
      setSubjects(sList);
      setCourses(cList);
    } catch (err) {
      console.error(err);
      showToast('Error cargando panel de administración.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Actualizar rol de usuario (Estudiante, Docente, Administrador, Invitado)
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      const roleLabels = {
        student: 'Estudiante',
        teacher: 'Docente',
        admin: 'Administrador',
        guest: 'Invitado',
      };
      showToast(`Rol actualizado a ${roleLabels[newRole] || newRole}.`, 'success');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      showToast('Error al modificar rol.', 'error');
    }
  };

  // Alternar estado activo / suspendido
  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await adminService.updateUser(userId, { is_active: !currentStatus });
      showToast(`Usuario ${!currentStatus ? 'activado' : 'suspendido'}.`, 'info');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)));
    } catch {
      showToast('Error al modificar estado.', 'error');
    }
  };

  // Crear Curso y División
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await subjectService.createCourse(courseForm);
      showToast('Curso y división creados con éxito.', 'success');
      setShowCourseModal(false);
      setCourseForm({ name: '', division: '', shift: 'Mañana', year: 2026 });
      const cList = await subjectService.getCourses();
      setCourses(cList);
    } catch {
      showToast('Error al crear curso.', 'error');
    }
  };

  // Crear Materia
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await subjectService.createSubject({
        ...subjectForm,
        color: '#1e40af',
        syllabus: [
          { unit: 1, title: 'Unidad Inicial: Fundamentos', description: 'Introducción al programa anual.' }
        ]
      });
      showToast('Materia creada con éxito.', 'success');
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '', description: '', course_id: '', access_type: 'request_only' });
      const sList = await subjectService.getSubjects();
      setSubjects(sList);
    } catch {
      showToast('Error al crear materia.', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Cargando panel de administración..." />;

  // Filtrado de usuarios según búsqueda y rol seleccionado
  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const q = userSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (u.full_name && u.full_name.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  // Conteo de roles en orden oficial:
  // 1. Estudiante, 2. Docente, 3. Administrador, 4. Invitado
  const countStudent = users.filter((u) => u.role === 'student' || !u.role).length;
  const countTeacher = users.filter((u) => u.role === 'teacher').length;
  const countAdmin = users.filter((u) => u.role === 'admin').length;
  const countGuest = users.filter((u) => u.role === 'guest').length;

  return (
    <div>
      {/* Cabecera Institucional */}
      <div style={{
        marginBottom: '1.75rem',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <InstitutionalLogo variant="symbol" size="lg" />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-orange, #ff7b15)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Campus: La Normal • Panel de Administración Central
            </div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-900)', margin: '0.2rem 0', fontFamily: 'var(--font-display)' }}>
              Gestión Integral de Usuarios y Materias
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
              Escuela Normal Dr. Pedro Ignacio de Castro Barros • “Aprender mejor, juntos.”
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/tutor-ia')}
          className="btn btn-accent"
        >
          <Sparkles size={16} /> Tutor IA Pantalla Completa
        </button>
      </div>

      {/* Tutor IA Unificado Integrado en el Panel Principal Administrativo (/panel) */}
      {location.pathname === '/panel' && activeTab !== 'tutor' && (
        <section style={{ marginBottom: '2rem' }} aria-label="Tutor IA Pedagógico Institucional">
          <AITutorPage embedded={true} fullWidth={true} />
        </section>
      )}

      {/* Tabs Principales */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Administración de Usuarios ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <BookOpen size={18} /> Materias y Espacios ({subjects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <GraduationCap size={18} /> Cursos y Divisiones ({courses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'tutor' ? 'active' : ''}`}
          onClick={() => setActiveTab('tutor')}
        >
          <Sparkles size={18} /> Tutor IA Institucional
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE USUARIOS Y ASIGNACIÓN DE ROLES */}
      {activeTab === 'users' && (
        <div>
          {/* Barra de Filtro de Roles y Búsqueda */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            backgroundColor: 'var(--bg-surface)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
                Filtrar por rol:
              </span>
              <button
                className={`btn btn-sm ${userRoleFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUserRoleFilter('all')}
              >
                Todos ({users.length})
              </button>
              {/* ORDEN OFICIAL DE ROLES: 1. Estudiante, 2. Docente, 3. Administrador, 4. Invitado */}
              <button
                className={`btn btn-sm ${userRoleFilter === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUserRoleFilter('student')}
              >
                1. Estudiantes ({countStudent})
              </button>
              <button
                className={`btn btn-sm ${userRoleFilter === 'teacher' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUserRoleFilter('teacher')}
              >
                2. Docentes ({countTeacher})
              </button>
              <button
                className={`btn btn-sm ${userRoleFilter === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUserRoleFilter('admin')}
              >
                3. Administradores ({countAdmin})
              </button>
              <button
                className={`btn btn-sm ${userRoleFilter === 'guest' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUserRoleFilter('guest')}
              >
                4. Invitados ({countGuest})
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                className="form-input"
                style={{ paddingLeft: '2.25rem', paddingBlock: '0.4rem', fontSize: '0.85rem' }}
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Usuario</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Rol Asignado</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron usuarios con los filtros especificados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.full_name || 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {/* Selector de 4 roles en el orden estricto solicitado:
                            1. Estudiante, 2. Docente, 3. Administrador, 4. Invitado */}
                        <select
                          className="form-select"
                          style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem', fontWeight: 600 }}
                          value={u.role || 'student'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="student">1. Estudiante</option>
                          <option value="teacher">2. Docente</option>
                          <option value="admin">3. Administrador</option>
                          <option value="guest">4. Invitado</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active !== false ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                          className="btn btn-secondary btn-sm"
                        >
                          {u.is_active !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                          {u.is_active !== false ? 'Suspender' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAS */}
      {activeTab === 'subjects' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary">
              <Plus size={16} /> Crear Materia
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Materia</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Código</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Curso y División</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Modalidad</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.description}</div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>{s.code || 'S/C'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>{s.courses?.name || '1° Año'} - {s.courses?.division || '1° Div'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span className="badge badge-primary">{s.access_type || 'request_only'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CURSOS */}
      {activeTab === 'courses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowCourseModal(true)} className="btn btn-primary">
              <Plus size={16} /> Crear Curso / División
            </button>
          </div>

          <div className="grid-cards">
            {courses.map((c) => (
              <div key={c.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{c.shift || 'Mañana'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ciclo {c.year || 2026}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
                  {c.name}
                </h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {c.division}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TUTOR IA INSTITUCIONAL */}
      {activeTab === 'tutor' && (
        <div>
          <AITutorPage embedded={true} fullWidth={true} />
        </div>
      )}

      {/* Modal Crear Curso */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title="Crear Curso y División"
      >
        <form onSubmit={handleCreateCourse}>
          <div className="form-group">
            <label className="form-label">Nombre del Curso (Ej: 1° Año, 2° Año)</label>
            <input
              type="text"
              required
              className="form-input"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">División (Ej: 1° División, 2° División)</label>
            <input
              type="text"
              required
              className="form-input"
              value={courseForm.division}
              onChange={(e) => setCourseForm({ ...courseForm, division: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select
              className="form-select"
              value={courseForm.shift}
              onChange={(e) => setCourseForm({ ...courseForm, shift: e.target.value })}
            >
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Guardar Curso
          </button>
        </form>
      </Modal>

      {/* Modal Crear Materia */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title="Crear Nueva Materia"
      >
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label className="form-label">Nombre de la Materia</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ej: Lengua y Literatura"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Código</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: LENG-1"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Programa oficial de la materia..."
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Curso y División Asignado</label>
            <select
              className="form-select"
              value={subjectForm.course_id}
              onChange={(e) => setSubjectForm({ ...subjectForm, course_id: e.target.value })}
            >
              <option value="">(Seleccionar Curso)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.division} ({c.shift})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Guardar Materia
          </button>
        </form>
      </Modal>
    </div>
  );
};
