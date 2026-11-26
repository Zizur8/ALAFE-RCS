import { CLIENTS } from './mockData'
import { Badge, FilterChip, ModuleHeader, SearchField } from './ModuleUi'

export default function ClientsModule() {
  const selectedClient = CLIENTS[0]

  return (
    <section className="module-page" aria-labelledby="clients-title">
      <div id="clients-title"><ModuleHeader eyebrow="CLIENTES" title="Clientes" description="Directorio e historial de clientes" action="Nuevo cliente" /></div>
      <div className="module-toolbar">
        <SearchField placeholder="Buscar por nombre, teléfono o dirección" />
        <div className="module-filter-row" aria-label="Filtros de clientes">
          <FilterChip active>Todos</FilterChip><FilterChip>Con eventos</FilterChip><FilterChip>Saldo pendiente</FilterChip><FilterChip>Problemáticos</FilterChip>
        </div>
      </div>

      <div className="module-split module-split--clients">
        <section className="module-table-card" aria-label="Listado de clientes">
          <table className="module-table clients-table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Dirección</th><th>Agendas</th><th>Historial</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{CLIENTS.map((client, index) => <tr className={index === 0 ? 'is-selected' : undefined} key={client.email}>
              <td><div className="module-person"><span className="module-avatar">{client.initials}</span><strong>{client.name}</strong></div></td>
              <td><strong className="table-primary">{client.phone}</strong><small>{client.email}</small></td>
              <td><span className="table-address">{client.address}</span></td>
              <td><Badge>{client.agendas} {client.agendas === 1 ? 'agenda' : 'agendas'}</Badge></td>
              <td><Badge>{client.events} {client.events === 1 ? 'evento' : 'eventos'}</Badge></td>
              <td><Badge tone={client.statusTone}>{client.status}</Badge></td>
              <td><button className="module-more" type="button" aria-label={`Más opciones para ${client.name}`}>•••</button></td>
            </tr>)}</tbody>
          </table>
          <footer className="module-table-footer"><span>Mostrando 4 de 24 clientes</span><span>Página 1 de 6</span></footer>
        </section>

        <aside className="module-detail-panel" aria-label={`Detalle de ${selectedClient.name}`}>
          <div className="module-detail-heading"><div className="module-person module-person--large"><span className="module-avatar">{selectedClient.initials}</span><div><h2>{selectedClient.name}</h2><Badge tone="success">Cliente activo</Badge></div></div><button type="button" className="module-close" aria-label="Cerrar detalle">×</button></div>
          <div className="module-notice module-notice--info"><span aria-hidden="true">i</span><p><strong>Posible duplicado:</strong> existe otro cliente con el mismo nombre: Mariana López.</p></div>
          <dl className="module-data-list"><div><dt>Teléfono</dt><dd>{selectedClient.phone}</dd></div><div><dt>Correo</dt><dd>{selectedClient.email}</dd></div><div><dt>Dirección</dt><dd>{selectedClient.address}</dd></div></dl>
          <div className="module-detail-section"><h3>Agendas vinculadas</h3><div className="compact-record"><span>▦</span><div><strong>Alberca Las Palmas</strong><small>2 eventos registrados</small></div></div><div className="compact-record"><span>▦</span><div><strong>Salón Magnolia</strong><small>1 evento registrado</small></div></div></div>
          <div className="module-detail-section"><h3>Eventos recientes</h3><div className="compact-record"><span>◷</span><div><strong>Cumpleaños de Ana</strong><small>18 enero 2026 · Reservado</small></div><Badge tone="warning">$5,500</Badge></div><div className="compact-record"><span>◷</span><div><strong>Boda López-Ruiz</strong><small>12 abril 2025 · Liquidado</small></div><Badge tone="success">Pagado</Badge></div></div>
          <div className="module-notice module-notice--warning"><span aria-hidden="true">!</span><p><strong>No se puede eliminar:</strong> tiene eventos o movimientos asociados.</p></div>
        </aside>
      </div>
    </section>
  )
}

