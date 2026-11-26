import { MOVEMENTS } from './mockData'
import { Badge, ModuleHeader, SearchField, SelectLike, StatCard } from './ModuleUi'

export default function MovementsModule() {
  const selected = MOVEMENTS[0]

  return (
    <section className="module-page" aria-labelledby="movements-title">
      <div id="movements-title"><ModuleHeader eyebrow="MOVIMIENTOS" title="Movimientos" description="Anticipos, abonos y devoluciones" action="Registrar movimiento" /></div>
      <div className="module-stats module-stats--three"><StatCard icon="▣" label="Ingresos del mes" value="$48,500" tone="success" /><StatCard icon="◷" label="Pendiente por cobrar" value="$12,300" tone="warning" /><StatCard icon="↶" label="Devoluciones" value="$2,000" tone="danger" /></div>
      <div className="module-toolbar module-toolbar--inline"><SearchField placeholder="Buscar cliente, evento o folio" /><SelectLike>Alberca Las Palmas</SelectLike><SelectLike>Rango de fechas</SelectLike><SelectLike>Tipo</SelectLike><SelectLike>Moneda</SelectLike></div>

      <div className="module-split module-split--movements">
        <section className="module-table-card" aria-label="Listado de movimientos">
          <table className="module-table movements-table">
            <thead><tr><th>Folio</th><th>Fecha</th><th>Cliente / Evento</th><th>Tipo</th><th>Método</th><th>Moneda</th><th>Monto</th><th>Equivalente MXN</th><th>Registró</th><th>Estado</th></tr></thead>
            <tbody>{MOVEMENTS.map((movement, index) => <tr className={index === 0 ? 'is-selected' : undefined} key={movement.folio}>
              <td><strong className="table-primary">{movement.folio}</strong></td>
              <td><strong className="table-primary">{movement.date}</strong><small>{movement.time}</small></td>
              <td><strong className="table-primary">{movement.client}</strong><small>{movement.event}</small></td>
              <td><Badge tone={movement.type === 'Devolución' ? 'danger' : movement.type === 'Abono' ? 'info' : 'success'}>{movement.type}</Badge></td>
              <td>{movement.method}</td><td>{movement.currency}</td>
              <td><strong className={movement.type === 'Devolución' ? 'money-negative' : 'money-positive'}>{movement.amount}</strong></td>
              <td><strong className="table-primary">{movement.equivalent}</strong>{movement.exchangeRate && <small>{movement.exchangeRate}</small>}</td>
              <td><span className="table-address">{movement.registeredBy}</span></td>
              <td><Badge tone={movement.status === 'Aplicado' ? 'success' : 'warning'}>{movement.status}</Badge></td>
            </tr>)}</tbody>
          </table>
        </section>

        <aside className="module-detail-panel movement-detail" aria-label={`Detalle de ${selected.folio}`}>
          <div className="module-detail-heading"><div><span className="section-kicker">DETALLE</span><h2>Movimiento #{selected.folio}</h2><Badge tone="success">Aplicado</Badge></div><button type="button" className="module-close" aria-label="Cerrar detalle">×</button></div>
          <div className="trace-list"><h3>Trazabilidad</h3><div><i /><span><strong>Registrado</strong> · 18 ene 2026, 12:18 h</span></div><div><i /><span><strong>Aprobado por</strong> · César Vázquez</span></div><div><i /><span><strong>Estado</strong> · Aplicado</span></div></div>
          <dl className="module-data-list"><div><dt>Agenda</dt><dd>Alberca Las Palmas</dd></div><div><dt>Cliente</dt><dd>{selected.client}</dd></div><div><dt>Evento</dt><dd>{selected.event}</dd></div><div><dt>Tipo</dt><dd>{selected.type}</dd></div><div><dt>Método</dt><dd>{selected.method}</dd></div><div><dt>Moneda</dt><dd>{selected.currency}</dd></div><div><dt>Monto</dt><dd className="money-positive">{selected.amount}</dd></div></dl>
          <div className="balance-card"><span>Saldo restante</span><strong>$5,500</strong><small>del costo total del evento</small></div>
          <button type="button" className="module-disabled-action" disabled>▣ Eliminar movimiento</button><p className="module-helper">Este movimiento afecta el saldo del evento.</p>
        </aside>
      </div>
    </section>
  )
}

