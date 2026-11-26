import { Badge, SelectLike, StatCard } from './ModuleUi'

const REPORT_BARS = [
  { label: 'Sem. 1', range: '1–7 nov', value: '$8,500', height: 42 },
  { label: 'Sem. 2', range: '8–14 nov', value: '$12,000', height: 59 },
  { label: 'Sem. 3', range: '15–21 nov', value: '$18,000', height: 88 },
  { label: 'Sem. 4', range: '22–30 nov', value: '$10,000', height: 49 },
]

const PENDING_BALANCES = [
  ['Grupo Rivera', 'Boda Rivera–López', '06 nov 2026', '$5,000'],
  ['Eventos del Valle', 'Cena empresarial', '13 nov 2026', '$2,500'],
  ['Familia Torres', 'XV años Ana Torres', '20 nov 2026', '$3,000'],
  ['Corporativo Cima', 'Reunión anual', '27 nov 2026', '$1,800'],
]

export default function ReportsModule() {
  return (
    <section className="module-page reports-page" aria-labelledby="reports-title">
      <header className="module-page-header" id="reports-title"><div><span className="section-kicker">REPORTES</span><h1>Reportes</h1><p>Resumen operativo y financiero</p></div><button type="button" className="module-secondary-action">▤ Exportar PDF</button></header>
      <div className="report-filters"><label><span>Agenda</span><SelectLike>Todas las agendas</SelectLike></label><label><span>Periodo</span><SelectLike>Noviembre 2026</SelectLike></label><label className="report-date-range"><span>Rango de fechas</span><button type="button" className="module-select-like"><span>▦ &nbsp; 01 nov 2026 – 30 nov 2026</span></button></label><button type="button" className="module-primary-action">Aplicar filtros</button></div>
      <div className="module-stats module-stats--four"><StatCard icon="▣" label="Ingresos" value="$48,500" tone="success" /><StatCard icon="▦" label="Anticipos" value="$18,000" tone="info" /><StatCard icon="▤" label="Por cobrar" value="$12,300" tone="warning" /><StatCard icon="□" label="Eventos" value="14" tone="success" /></div>

      <div className="reports-grid">
        <section className="report-card report-card--chart"><div className="report-card__heading"><div><span className="section-kicker">INGRESOS</span><h2>Ingresos por semana</h2></div><Badge>Noviembre 2026</Badge></div><div className="bar-chart" aria-label="Gráfica de ingresos por semana"><div className="bar-chart__axis"><span>$20,000</span><span>$16,000</span><span>$12,000</span><span>$8,000</span><span>$4,000</span><span>$0</span></div><div className="bar-chart__plot">{REPORT_BARS.map((bar) => <div className="bar-chart__column" key={bar.label}><strong>{bar.value}</strong><div className="bar-chart__bar" style={{ height: `${bar.height}%` }} /><span>{bar.label}</span><small>{bar.range}</small></div>)}</div></div></section>
        <section className="report-card"><div className="report-card__heading"><div><span className="section-kicker">EVENTOS</span><h2>Estado de eventos</h2></div></div><div className="event-status-chart"><svg viewBox="0 0 120 120" role="img" aria-label="14 eventos: 7 realizados, 5 pendientes y 2 cancelados"><circle className="status-ring-bg" cx="60" cy="60" r="43" /><circle className="status-ring status-ring--done" cx="60" cy="60" r="43" strokeDasharray="135 270" /><circle className="status-ring status-ring--pending" cx="60" cy="60" r="43" strokeDasharray="96 270" strokeDashoffset="-135" /><circle className="status-ring status-ring--cancelled" cx="60" cy="60" r="43" strokeDasharray="39 270" strokeDashoffset="-231" /><text x="60" y="56" textAnchor="middle">14</text><text className="event-status-chart__label" x="60" y="72" textAnchor="middle">Eventos</text></svg><div className="status-legend"><div><i className="status-dot status-dot--done" /><span>Realizados</span><strong>7</strong></div><div><i className="status-dot status-dot--pending" /><span>Pendientes</span><strong>5</strong></div><div><i className="status-dot status-dot--cancelled" /><span>Cancelados</span><strong>2</strong></div></div></div></section>
        <section className="report-card report-card--balances"><div className="report-card__heading"><div><span className="section-kicker">COBRANZA</span><h2>Saldos próximos por cobrar</h2></div><button type="button" className="report-text-action">Ver todos</button></div><table className="report-table"><thead><tr><th>Cliente</th><th>Evento</th><th>Fecha</th><th>Monto pendiente</th></tr></thead><tbody>{PENDING_BALANCES.map(([client, event, date, amount]) => <tr key={client}><td><strong>{client}</strong></td><td>{event}</td><td>{date}</td><td className="report-amount">{amount}</td></tr>)}</tbody></table></section>
        <section className="report-card report-card--breakdown"><div className="report-card__heading"><div><span className="section-kicker">DESGLOSE</span><h2>Moneda y método</h2></div></div><dl className="breakdown-list"><div><dt><i>MXN</i>Peso mexicano</dt><dd>$46,000</dd></div><div><dt><i>USD</i>Dólar estadounidense</dt><dd>$2,500</dd></div><div><dt><i>EF</i>Efectivo</dt><dd>$14,500</dd></div><div><dt><i>TR</i>Transferencia</dt><dd>$34,000</dd></div></dl></section>
      </div>
    </section>
  )
}

