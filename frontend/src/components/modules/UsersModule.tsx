import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { USERS, type UserMock } from './mockData'
import { Badge } from './ModuleUi'

type UserRole = UserMock['role']
type UserStatusFilter = 'Todos' | 'Activos' | 'Inactivos'
type Permissions = boolean[][]
type StoredUser = UserMock & { permissions: Permissions }
type EditableUser = Pick<UserMock, 'name' | 'email' | 'role' | 'agendas' | 'active'> & { permissions: Permissions }

const MODULE_PERMISSIONS = [
  { module: 'Agenda', icon: '▦', values: [true, true, true, false] },
  { module: 'Clientes', icon: '♙', values: [true, true, true, false] },
  { module: 'Movimientos', icon: '↔', values: [true, false, false, false] },
  { module: 'Reportes', icon: '▤', values: [true, false, false, false] },
  { module: 'Usuarios', icon: '♧', values: [false, false, false, false], locked: true },
]
const PERMISSION_ACTIONS = ['Ver', 'Crear', 'Editar', 'Eliminar']
const ROLES: UserRole[] = ['Administrador', 'Usuario parcial', 'Observador']
const BASE_PERMISSIONS = MODULE_PERMISSIONS.map(({ values }) => [...values])

function initialsFromName(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('es-MX') ?? '').join('') || 'US'
}

function createEditableUser(user?: StoredUser): EditableUser {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'Usuario parcial',
    agendas: user?.agendas ?? 1,
    active: user?.active ?? true,
    permissions: user?.permissions.map((values) => [...values]) ?? BASE_PERMISSIONS.map((values) => [...values]),
  }
}

function roleTone(role: UserRole) {
  return role === 'Administrador' ? 'accent' : role === 'Usuario parcial' ? 'info' : 'neutral'
}

export default function UsersModule() {
  const [users, setUsers] = useState<StoredUser[]>(() => USERS.map((user) => ({ ...user, permissions: BASE_PERMISSIONS.map((values) => [...values]) })))
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('Todos')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'Todos'>('Todos')
  const [dialogUserId, setDialogUserId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditableUser>(() => createEditableUser())
  const [emailError, setEmailError] = useState('')
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  const editingUser = users.find((user) => user.email === dialogUserId)
  const isDialogOpen = dialogUserId !== null

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-MX')
    return users.filter((user) => {
      const matchesQuery = !normalizedQuery || `${user.name} ${user.email}`.toLocaleLowerCase('es-MX').includes(normalizedQuery)
      const matchesStatus = statusFilter === 'Todos' || (statusFilter === 'Activos' ? user.active : !user.active)
      const matchesRole = roleFilter === 'Todos' || user.role === roleFilter
      return matchesQuery && matchesStatus && matchesRole
    })
  }, [users, query, statusFilter, roleFilter])

  useEffect(() => {
    if (!isDialogOpen) return
    nameInputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDialogOpen])

  function closeDialog() {
    setDialogUserId(null)
    setEmailError('')
    window.requestAnimationFrame(() => openerRef.current?.focus())
  }

  function openCreateDialog(button: HTMLButtonElement) {
    openerRef.current = button
    setDraft(createEditableUser())
    setEmailError('')
    setDialogUserId('new')
  }

  function openEditDialog(user: StoredUser, button: HTMLButtonElement) {
    openerRef.current = button
    setDraft(createEditableUser(user))
    setEmailError('')
    setDialogUserId(user.email)
  }

  function updateDraft<K extends keyof EditableUser>(key: K, value: EditableUser[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function togglePermission(moduleIndex: number, permissionIndex: number) {
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.map((row, rowIndex) => rowIndex === moduleIndex
        ? row.map((enabled, cellIndex) => cellIndex === permissionIndex ? !enabled : enabled)
        : row),
    }))
  }

  function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = draft.email.trim().toLocaleLowerCase('es-MX')
    const duplicate = users.some((user) => user.email.toLocaleLowerCase('es-MX') === normalizedEmail && user.email !== editingUser?.email)
    if (duplicate) {
      setEmailError('Ya existe un usuario con este correo.')
      return
    }
    const savedUser: StoredUser = {
      initials: initialsFromName(draft.name),
      name: draft.name.trim(),
      email: draft.email.trim(),
      role: draft.role,
      agendas: draft.agendas,
      lastAccess: editingUser?.lastAccess ?? 'Sin acceso',
      active: draft.active,
      permissions: draft.permissions.map((values) => [...values]),
    }
    setUsers((current) => editingUser
      ? current.map((user) => user.email === editingUser.email ? savedUser : user)
      : [...current, savedUser])
    closeDialog()
  }

  return (
    <section className="module-page users-module" aria-labelledby="users-title">
      <header className="module-page-header">
        <div><span className="section-kicker">USUARIOS</span><h1 id="users-title">Usuarios</h1><p>Administra accesos, roles y permisos del equipo.</p></div>
        <button type="button" className="module-primary-action" onClick={(event) => openCreateDialog(event.currentTarget)}><span aria-hidden="true">＋</span>Nuevo usuario</button>
      </header>

      <section className="users-toolbar" aria-label="Búsqueda y filtros de usuarios">
        <label className="module-search users-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Buscar por nombre o correo" aria-label="Buscar por nombre o correo" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="module-filter-row" aria-label="Filtrar por estado">
          {(['Todos', 'Activos', 'Inactivos'] as UserStatusFilter[]).map((filter) => <button type="button" key={filter} className={`module-filter-chip${statusFilter === filter ? ' is-active' : ''}`} aria-pressed={statusFilter === filter} onClick={() => setStatusFilter(filter)}>{filter}</button>)}
        </div>
        <label className="users-role-filter"><span>Rol</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'Todos')} aria-label="Filtrar por rol"><option value="Todos">Todos los roles</option>{ROLES.map((role) => <option value={role} key={role}>{role}</option>)}</select></label>
      </section>

      <section className="module-table-card users-table-card" aria-label="Listado de usuarios">
        <div className="users-table-scroll"><table className="module-table users-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Agendas</th><th>Último acceso</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{filteredUsers.map((user) => <tr key={user.email}>
            <td><div className="module-person"><span className="module-avatar">{user.initials}</span><strong>{user.name}</strong></div></td>
            <td>{user.email}</td><td><Badge tone={roleTone(user.role)}>{user.role}</Badge></td><td>{user.agendas}</td><td>{user.lastAccess}</td>
            <td><Badge tone={user.active ? 'success' : 'neutral'}><span className="badge-dot" />{user.active ? 'Activo' : 'Inactivo'}</Badge></td>
            <td><button className="users-edit-button" type="button" aria-label={`Editar ${user.name}`} onClick={(event) => openEditDialog(user, event.currentTarget)}>Editar</button></td>
          </tr>)}</tbody>
        </table></div>
        <footer className="module-table-footer"><span>Mostrando {filteredUsers.length} de {users.length} usuarios</span><span>{filteredUsers.length === 1 ? '1 usuario' : `${filteredUsers.length} usuarios`}</span></footer>
        {filteredUsers.length === 0 && <div className="users-empty-state"><span aria-hidden="true">⌕</span><strong>No encontramos usuarios</strong><p>Prueba con otro nombre, correo o filtro.</p><button type="button" onClick={() => { setQuery(''); setStatusFilter('Todos'); setRoleFilter('Todos') }}>Limpiar filtros</button></div>}
      </section>

      {isDialogOpen && <div className="agenda-modal-backdrop users-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog() }}>
        <section className="event-dialog users-dialog" role="dialog" aria-modal="true" aria-labelledby="user-dialog-title">
          <header className="event-dialog__top"><div><span className="section-kicker">PERFIL Y PERMISOS</span><h2 id="user-dialog-title">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h2><p>{editingUser ? 'Actualiza su información y nivel de acceso.' : 'Completa los datos para agregar a alguien al equipo.'}</p></div><button type="button" className="dialog-close" aria-label="Cerrar diálogo" onClick={closeDialog}>×</button></header>
          <form className="users-form" onSubmit={saveUser}>
            <div className="users-form-section"><h3>Información del usuario</h3><div className="users-form-grid">
              <label><span>Nombre completo</span><input ref={nameInputRef} required maxLength={80} autoComplete="name" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="Ej. Daniela Vallejo" /></label>
              <label><span>Correo electrónico</span><input type="email" required maxLength={120} autoComplete="email" value={draft.email} onChange={(event) => { updateDraft('email', event.target.value); setEmailError('') }} placeholder="nombre@empresa.com" aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'user-email-error' : undefined} />{emailError && <small id="user-email-error" className="users-field-error">{emailError}</small>}</label>
              <label><span>Rol</span><select value={draft.role} onChange={(event) => updateDraft('role', event.target.value as UserRole)}>{ROLES.map((role) => <option value={role} key={role}>{role}</option>)}</select></label>
              <label><span>Agendas asignadas</span><select value={draft.agendas} onChange={(event) => updateDraft('agendas', Number(event.target.value))}><option value={1}>1 agenda</option><option value={3}>3 agendas</option><option value={5}>5 agendas</option></select></label>
              <label className="users-status-control"><span>Estado de la cuenta</span><span className="users-status-copy"><strong>{draft.active ? 'Activo' : 'Inactivo'}</strong><small>{draft.active ? 'Puede acceder al espacio de trabajo.' : 'No podrá iniciar sesión.'}</small></span><input type="checkbox" checked={draft.active} onChange={(event) => updateDraft('active', event.target.checked)} aria-label="Cuenta activa" /></label>
            </div></div>

            <div className="users-form-section"><div className="users-permission-heading"><div><h3>Permisos por módulo</h3><p>Selecciona las acciones que podrá realizar.</p></div><span>{draft.permissions.flat().filter(Boolean).length} permisos activos</span></div>
              <div className="users-permission-table" role="group" aria-label="Permisos por módulo">
                <div className="users-permission-row users-permission-head"><span>Módulo</span>{PERMISSION_ACTIONS.map((action) => <span key={action}>{action}</span>)}</div>
                {MODULE_PERMISSIONS.map((permission, moduleIndex) => <div className={`users-permission-row${permission.locked ? ' is-locked' : ''}`} key={permission.module}>
                  <strong><i aria-hidden="true">{permission.icon}</i>{permission.module}{permission.locked && <small>Solo administrador</small>}</strong>
                  {permission.values.map((_, permissionIndex) => <label className="users-permission-cell" key={`${permission.module}-${permissionIndex}`}><input type="checkbox" aria-label={`${permission.module}: ${PERMISSION_ACTIONS[permissionIndex]}`} checked={draft.permissions[moduleIndex][permissionIndex]} disabled={permission.locked} onChange={() => togglePermission(moduleIndex, permissionIndex)} /></label>)}
                </div>)}
              </div>
              <p className="users-permission-note">Solo un Administrador puede gestionar usuarios.</p>
            </div>
            <footer className="users-dialog-actions"><button type="button" className="cancel-button" onClick={closeDialog}>Cancelar</button><button type="submit" className="new-event-button">{editingUser ? 'Guardar cambios' : 'Crear usuario'}</button></footer>
          </form>
        </section>
      </div>}
    </section>
  )
}
