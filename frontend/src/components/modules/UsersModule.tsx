import { USERS } from './mockData'
import { Badge, FilterChip, ModuleHeader, SearchField, SelectLike } from './ModuleUi'

const PERMISSIONS = [
  { module: 'Agenda', icon: '▦', values: [true, true, true, false] },
  { module: 'Clientes', icon: '♙', values: [true, true, true, false] },
  { module: 'Movimientos', icon: '↔', values: [true, false, false, false] },
  { module: 'Reportes', icon: '▤', values: [true, false, false, false] },
  { module: 'Usuarios', icon: '♧', values: [false, false, false, false], locked: true },
]

export default function UsersModule() {
  const selectedUser = USERS[1]

  return (
    <section className="module-page" aria-labelledby="users-title">
      <div id="users-title"><ModuleHeader eyebrow="USUARIOS" title="Usuarios" description="Accesos, roles y permisos" action="Nuevo usuario" /></div>
      <div className="module-toolbar module-toolbar--users"><SearchField placeholder="Buscar por nombre o correo" /><div className="module-filter-row"><FilterChip active>Todos</FilterChip><FilterChip>Activos</FilterChip><FilterChip>Inactivos</FilterChip></div><SelectLike>Todos los roles</SelectLike></div>
      <div className="module-split module-split--users">
        <section className="module-table-card" aria-label="Listado de usuarios"><table className="module-table users-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Agendas</th><th>Último acceso</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{USERS.map((user, index) => <tr className={index === 1 ? 'is-selected' : undefined} key={user.email}><td><div className="module-person"><span className="module-avatar">{user.initials}</span><strong>{user.name}</strong></div></td><td>{user.email}</td><td><Badge tone={user.role === 'Administrador' ? 'accent' : user.role === 'Usuario parcial' ? 'info' : 'neutral'}>{user.role}</Badge></td><td>{user.agendas}</td><td>{user.lastAccess}</td><td><Badge tone={user.active ? 'success' : 'neutral'}><span className="badge-dot" />{user.active ? 'Activo' : 'Inactivo'}</Badge></td><td><button className="module-more" type="button" aria-label={`Más opciones para ${user.name}`}>•••</button></td></tr>)}</tbody></table></section>
        <aside className="module-detail-panel user-detail" aria-label={`Detalle de ${selectedUser.name}`}>
          <div className="module-detail-heading"><div><span className="section-kicker">PERFIL Y PERMISOS</span><h2>{selectedUser.name}</h2></div><button type="button" className="module-close" aria-label="Cerrar detalle">×</button></div>
          <div className="user-form-grid"><label><span>Nombre</span><input value={selectedUser.name} readOnly /></label><label><span>Correo</span><input value={selectedUser.email} readOnly /></label><label><span>Rol</span><span className="field-like">Usuario parcial <b>⌄</b></span></label><label><span>Agendas</span><span className="field-like">3 agendas <b>⌄</b></span></label><label className="user-status-field"><span>Estado</span><span className="static-switch is-on"><i /></span><strong>Activo</strong></label></div>
          <div className="permission-heading"><h3>Permisos por módulo</h3><p>Define qué puede hacer este usuario en cada módulo.</p></div>
          <div className="permission-table"><div className="permission-table__head"><span>Módulo</span><span>Ver</span><span>Crear</span><span>Editar</span><span>Eliminar</span></div>{PERMISSIONS.map((permission) => <div className={`permission-row${permission.locked ? ' is-locked' : ''}`} key={permission.module}><strong><i>{permission.icon}</i>{permission.module}</strong>{permission.values.map((enabled, index) => <span className={`static-check${enabled ? ' is-checked' : ''}`} key={`${permission.module}-${index}`}>{enabled ? '✓' : ''}</span>)}</div>)}</div>
          <div className="module-notice module-notice--info"><span aria-hidden="true">i</span><p>Solo un Administrador puede gestionar usuarios.</p></div>
          <footer className="user-trace">◷ Actualizado por César Vázquez · hoy, 10:24</footer>
        </aside>
      </div>
    </section>
  )
}

