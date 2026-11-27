import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CLIENTS, type ClientMock } from './mockData'
import { Badge } from './ModuleUi'

type ClientDraft = Pick<ClientMock, 'name' | 'phone' | 'email' | 'address'>
const PAGE_SIZE = 4
const blankDraft: ClientDraft = { name: '', phone: '', email: '', address: '' }
const initialsFromName = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('es-MX') ?? '').join('') || 'CL'

export default function ClientsModule() {
  const [clients, setClients] = useState(CLIENTS)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [showAssociatedEvents, setShowAssociatedEvents] = useState(false)
  const [draft, setDraft] = useState<ClientDraft>(blankDraft)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const editingClient = clients.find((client) => client.email === editingEmail)

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX')
    return clients.filter((client) => {
      const matchesQuery = !normalized || `${client.name} ${client.phone} ${client.email} ${client.address}`.toLocaleLowerCase('es-MX').includes(normalized)
      const matchesFilter = filter === 'Todos' || (filter === 'Con eventos' ? client.events > 0 : filter === 'Saldo pendiente' ? client.statusTone === 'warning' : client.statusTone === 'danger')
      return matchesQuery && matchesFilter
    })
  }, [clients, query, filter])
  const pageCount = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE))
  const visibleClients = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const startItem = filteredClients.length ? (page - 1) * PAGE_SIZE + 1 : 0
  const endItem = Math.min(page * PAGE_SIZE, filteredClients.length)

  useEffect(() => { setPage(1) }, [query, filter, clients.length])
  useEffect(() => {
    if (editingEmail === null) return
    nameInputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeDialog() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editingEmail])

  function closeDialog() {
    setEditingEmail(null)
    setShowAssociatedEvents(false)
    window.requestAnimationFrame(() => openerRef.current?.focus())
  }
  function openDialog(button: HTMLButtonElement, client?: ClientMock) {
    openerRef.current = button
    setDraft(client ? { name: client.name, phone: client.phone, email: client.email, address: client.address } : blankDraft)
    setShowAssociatedEvents(false)
    setEditingEmail(client?.email ?? 'new')
  }
  function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = editingClient
      ? { ...editingClient, ...draft, name: draft.name.trim(), email: draft.email.trim(), initials: initialsFromName(draft.name) }
      : { ...CLIENTS[0], ...draft, name: draft.name.trim(), email: draft.email.trim(), initials: initialsFromName(draft.name), agendas: 0, events: 0, status: 'Sin adeudo', statusTone: 'success' as const, createdAt: 'Hoy', lastEventAt: 'Sin eventos', linkedAgendas: [], recentEvents: [] }
    setClients((current) => editingClient ? current.map((client) => client.email === editingClient.email ? saved : client) : [...current, saved])
    closeDialog()
  }

  return (
    <section className="module-page clients-module" aria-labelledby="clients-title">
      <header className="module-page-header">
        <div><span className="section-kicker">CLIENTES</span><h1 id="clients-title">Clientes</h1><p>Administra la información y actividad de tus clientes.</p></div>
        <button type="button" className="module-primary-action" onClick={(event) => openDialog(event.currentTarget)}><span aria-hidden="true">＋</span>Nuevo cliente</button>
      </header>
      <section className="clients-toolbar" aria-label="Búsqueda y filtros de clientes">
        <label className="module-search clients-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Buscar por nombre, teléfono, correo o dirección" aria-label="Buscar clientes" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="module-filter-row" aria-label="Filtros de clientes">
          {['Todos', 'Con eventos', 'Saldo pendiente', 'Problemáticos'].map((item) => <button key={item} type="button" className={`module-filter-chip${filter === item ? ' is-active' : ''}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
      </section>
      <section className="module-table-card clients-table-card" aria-label="Listado de clientes">
        <div className="clients-table-scroll"><table className="module-table clients-table"><thead><tr><th>Cliente</th><th>Contacto</th><th>Dirección</th><th>Agendas</th><th>Alta</th><th>Último evento</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{visibleClients.map((client) => <tr key={client.email}>
            <td><div className="module-person"><span className="module-avatar">{client.initials}</span><strong>{client.name}</strong></div></td>
            <td><strong className="table-primary">{client.phone}</strong><small>{client.email}</small></td><td><span className="table-address">{client.address}</span></td>
            <td><Badge>{client.agendas} {client.agendas === 1 ? 'agenda' : 'agendas'}</Badge></td><td>{client.createdAt}</td><td>{client.lastEventAt}</td>
            <td><Badge tone={client.statusTone}>{client.status}</Badge></td><td><button className="clients-edit-button" type="button" aria-label={`Editar ${client.name}`} onClick={(event) => openDialog(event.currentTarget, client)}>Editar</button></td>
          </tr>)}</tbody></table></div>
        {filteredClients.length === 0 && <div className="clients-empty"><strong>No encontramos clientes</strong><p>Prueba con otro término o filtro.</p><button type="button" onClick={() => { setQuery(''); setFilter('Todos') }}>Limpiar búsqueda</button></div>}
        <footer className="clients-pagination"><span>Mostrando <strong>{startItem}–{endItem}</strong> de <strong>{filteredClients.length}</strong> clientes</span><nav aria-label="Paginación de clientes"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} aria-label="Página anterior">‹</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={number === page ? 'is-current' : ''} aria-current={number === page ? 'page' : undefined} aria-label={`Página ${number}`} onClick={() => setPage(number)}>{number}</button>)}<button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} aria-label="Página siguiente">›</button></nav></footer>
      </section>

      {editingEmail !== null && <div className="agenda-modal-backdrop clients-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog() }}>
        <section className="event-dialog clients-dialog" role="dialog" aria-modal="true" aria-labelledby="client-dialog-title">
          <header className="event-dialog__top"><div><span className="section-kicker">DIRECTORIO DE CLIENTES</span><h2 id="client-dialog-title">{editingClient ? 'Editar cliente' : 'Nuevo cliente'}</h2><p>{editingClient ? 'Actualiza sus datos y consulta su actividad.' : 'Agrega los datos de contacto del cliente.'}</p></div><button type="button" className="dialog-close" aria-label="Cerrar diálogo" onClick={closeDialog}>×</button></header>
          <form className="clients-form" onSubmit={saveClient}>
            <section className="clients-form-section"><h3>Información del cliente</h3><div className="clients-form-grid">
              <label><span>Nombre completo</span><input ref={nameInputRef} required maxLength={100} autoComplete="name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Mariana López" /></label>
              <label><span>Teléfono</span><input type="tel" maxLength={30} autoComplete="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="867 000 0000" /></label>
              <label><span>Correo electrónico</span><input type="email" maxLength={120} autoComplete="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="nombre@correo.com" /></label>
              <label><span>Dirección</span><input maxLength={180} autoComplete="street-address" value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} placeholder="Calle, número y colonia" /></label>
            </div></section>
            {editingClient && <>
              <div className="clients-activity-grid"><section className="clients-form-section"><h3>Agendas vinculadas</h3><div className="clients-record-list">{editingClient.linkedAgendas.map((agenda) => <div className="clients-record" key={agenda}><span aria-hidden="true">▦</span><strong>{agenda}</strong></div>)}</div></section>
              <section className="clients-form-section clients-events-section"><h3>Eventos asociados</h3><button className="clients-events-toggle" type="button" aria-expanded={showAssociatedEvents} aria-controls="client-associated-events" onClick={() => setShowAssociatedEvents((visible) => !visible)}><span aria-hidden="true">◷</span>{showAssociatedEvents ? 'Ocultar eventos' : 'Ver eventos asociados'}<span className="clients-events-count">{editingClient.events}</span><span className="clients-events-chevron" aria-hidden="true">{showAssociatedEvents ? '⌃' : '⌄'}</span></button>{showAssociatedEvents && <div className="clients-record-list clients-associated-events" id="client-associated-events">{editingClient.recentEvents.map((item) => <div className="clients-record clients-record--event" key={`${item.name}-${item.date}`}><span aria-hidden="true">◷</span><div><strong>{item.name}</strong><small>{item.date} · {item.status}</small></div><Badge tone={item.status === 'Pendiente' ? 'warning' : item.status === 'Reservado' ? 'info' : 'success'}>{item.amount}</Badge></div>)}</div>}</section></div>
            </>}
            <footer className="clients-dialog-actions"><button type="button" className="cancel-button" onClick={closeDialog}>Cancelar</button><button type="submit" className="new-event-button">{editingClient ? 'Guardar cambios' : 'Crear cliente'}</button></footer>
          </form>
        </section>
      </div>}
    </section>
  )
}
