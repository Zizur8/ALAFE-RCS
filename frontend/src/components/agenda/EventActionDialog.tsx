import { useState, type FormEvent } from 'react'
import type { DemoEvent, EventAction } from './types'

interface EventActionDialogProps {
  action: EventAction
  event: DemoEvent
  onClose: () => void
}

const ACTION_TITLES: Record<EventAction, string> = {
  movements: 'Movimientos del evento',
  refund: 'Registrar devolución',
  traceability: 'Trazabilidad del evento',
  delete: 'Eliminar evento',
}

function money(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(amount)
}

export default function EventActionDialog({ action, event, onClose }: EventActionDialogProps) {
  const [notice, setNotice] = useState('')
  const hasMovements = event.advance > 0
  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setNotice('Revisión completada. No se registró ningún movimiento.')
  }
  const total = event.baseCost + event.extraHourCost * (event.extraHours.startsWith('2') ? 2 : 0)
  const dateLabel = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${event.startDate}T12:00:00`))

  return (
    <div className="agenda-modal-backdrop">
      <section className="event-dialog event-action-dialog" role="dialog" aria-modal="true" aria-labelledby="event-action-title">
        <div className="event-dialog__top"><div><span className="section-kicker">{event.title.toLocaleUpperCase('es-MX')}</span><h2 id="event-action-title">{ACTION_TITLES[action]}</h2></div><button type="button" className="dialog-close" aria-label="Cerrar ventana" onClick={onClose}>×</button></div>

        {action === 'movements' && <div className="movement-view">
          <p className="event-dialog__date">Movimientos en MXN.</p>
          <div className="movement-summary"><div><span>Costo total</span><strong>{money(total)}</strong></div><div><span>{event.balance > 0 ? 'Saldo pendiente' : 'Liquidado'}</span><strong>{event.balance > 0 ? money(event.balance) : 'Sí'}</strong></div></div>
          <div className="movement-list"><div className="movement-list__head"><span>Tipo y fecha</span><span>Monto</span></div><div className="movement-row"><span><i className="movement-row__dot" /><span><strong>Anticipo</strong><small>{dateLabel} · Efectivo</small></span></span><strong>{money(event.advance)}</strong></div></div>
        </div>}

        {action === 'refund' && <form className="action-form" onSubmit={handleSubmit}>
          <p className="event-dialog__date">La devolución requiere revisión antes de registrarse.</p>
          <label>Monto a devolver<span className="money-input"><i>$</i><input type="number" min="0.01" max={total} step="0.01" placeholder="0.00" required /></span></label>
          <label>Motivo<textarea rows={3} placeholder="Describe el motivo de la devolución" required /></label>
          {notice && <p className="dialog-notice" role="status">{notice}</p>}
          <div className="event-dialog__actions"><button type="button" className="cancel-button" onClick={onClose}>Cerrar</button><button type="submit" className="new-event-button">Revisar devolución</button></div>
        </form>}

        {action === 'traceability' && <div className="traceability-view">
          <p className="event-dialog__date">Registro de actividad.</p>
          <ol className="trace-list"><li><span className="trace-list__dot" /><div><strong>Evento creado</strong><small>Víctor Hernández · {dateLabel}, 11:42 a. m.</small></div></li><li><span className="trace-list__dot trace-list__dot--edit" /><div><strong>Horario actualizado</strong><small>César Vázquez · {dateLabel}, 3:18 p. m.</small></div></li><li><span className="trace-list__dot trace-list__dot--payment" /><div><strong>Anticipo registrado</strong><small>{money(event.advance)} MXN · {dateLabel}, 3:24 p. m.</small></div></li></ol>
          <div className="event-dialog__actions"><button type="button" className="cancel-button" onClick={onClose}>Cerrar</button></div>
        </div>}

        {action === 'delete' && <div className="delete-confirmation">
          <div className="delete-warning-icon" aria-hidden="true">!</div>
          {hasMovements ? <><p><strong>No se puede eliminar este evento directamente.</strong></p><p className="delete-warning-copy">Tiene movimientos monetarios registrados. De acuerdo con las reglas del negocio, primero se requiere procesar una devolución o cancelación autorizada.</p></> : <p>¿Quieres eliminar <strong>{event.title}</strong> de la agenda?</p>}
          <div className="event-dialog__actions"><button type="button" className="cancel-button" onClick={onClose}>Cerrar</button>{!hasMovements && <button type="button" className="delete-button" onClick={() => setNotice('El evento no se eliminó de la agenda.')}>Eliminar</button>}</div>
          {notice && <p className="dialog-notice" role="status">{notice}</p>}
        </div>}
      </section>
    </div>
  )
}
