import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { DemoEvent } from './types'

interface EventComposerProps {
  date: Date
  initialRange: { startDate: string; endDate: string }
  event?: DemoEvent
  defaultEventName?: string
  conflictRanges?: { startDate: string; endDate: string; start: string; end: string }[]
  onClose: () => void
}

interface EventForm {
  title: string
  startDate: string
  endDate: string
  start: string
  end: string
  hasDecoration: boolean
  decorationDate: string
  decorationTime: string
  isSpecial: boolean
  extraHours: string
  extraHourCost: string
  baseCost: string
  includeNotes: boolean
  notes: string
  includeClient: boolean
  clientPhone: string
  clientEmail: string
  address: string
  neighborhood: string
  exteriorNumber: string
  firstName: string
  lastName: string
  secondLastName: string
  initialPayment: string
  registerAdvance: boolean
  paymentCurrency: string
  exchangeRate: string
}

const COLONIAS = ['Campestre', 'Centro', 'Hidalgo', 'La Fe', 'Los Garza', 'Madero', 'Mirador', 'San Rafael']

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(value)
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function localDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`)
}

function formatDateLabel(value: string): string {
  if (!value) return 'Selecciona una fecha'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function oneHourBefore(value: string): string {
  const minutes = Math.max(0, toMinutes(value) - 60)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function makeInitialForm(event: DemoEvent | undefined, initialRange: EventComposerProps['initialRange'], defaultEventName: string): EventForm {
  const [firstName = '', lastName = '', secondLastName = ''] = event?.client.split(' ') ?? []
  return {
    title: event?.title ?? defaultEventName,
    startDate: event?.startDate ?? initialRange.startDate,
    endDate: event?.endDate ?? initialRange.endDate,
    start: event?.start ?? '16:00',
    end: event?.end ?? '23:00',
    hasDecoration: event?.decoration.startsWith('Decoración') ?? false,
    decorationDate: event?.decorationDate ?? event?.startDate ?? initialRange.startDate,
    decorationTime: event?.decoration.startsWith('Decoración') ? event.decorationStart ?? oneHourBefore(event.start) : '',
    isSpecial: false,
    extraHours: event?.extraHours.startsWith('2') ? '2' : '0',
    extraHourCost: event?.extraHourCost ? String(event.extraHourCost) : '',
    baseCost: event ? String(event.baseCost) : '',
    includeNotes: Boolean(event?.note),
    notes: event?.note ?? '',
    includeClient: Boolean(event),
    clientPhone: event?.phone ?? '',
    clientEmail: '',
    address: '',
    neighborhood: '',
    exteriorNumber: '',
    firstName,
    lastName,
    secondLastName,
    initialPayment: event ? String(event.advance) : '',
    registerAdvance: Boolean(event),
    paymentCurrency: 'MXN',
    exchangeRate: '1',
  }
}

function SwitchField({ checked, onChange, title, description }: { checked: boolean; onChange: (checked: boolean) => void; title: string; description?: string }) {
  return (
    <label className="composer-switch-row">
      <span className="composer-switch-copy"><strong>{title}</strong>{description && <small>{description}</small>}</span>
      <input className="composer-switch-input" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="composer-switch" aria-hidden="true" />
    </label>
  )
}

function ComposerField({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`composer-field ${className}`}><span>{label}</span>{children}</label>
}

function DateField({ value, onChange, min, max, label }: { value: string; onChange: (value: string) => void; min?: string; max?: string; label: string }) {
  return <span className="date-input-control"><span className="date-input-display" aria-hidden="true">{formatDateLabel(value)}</span><span className="date-input-icon" aria-hidden="true">▦</span><input className="date-input-native" type="date" aria-label={label} value={value} min={min} max={max} required onChange={(event) => onChange(event.target.value)} /></span>
}

export default function EventComposer({ date, initialRange, event, defaultEventName = '', conflictRanges, onClose }: EventComposerProps) {
  const [form, setForm] = useState<EventForm>(() => makeInitialForm(event, initialRange, defaultEventName))
  const [dateRangeMode, setDateRangeMode] = useState(() => (event?.startDate ?? initialRange.startDate) !== (event?.endDate ?? initialRange.endDate))
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [clientLookupMessage, setClientLookupMessage] = useState('')
  const update = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setNotice('')
  }

  const baseCost = Math.max(0, Number(form.baseCost) || 0)
  const extraHours = Math.max(0, Number(form.extraHours) || 0)
  const extraHourCost = Math.max(0, Number(form.extraHourCost) || 0)
  const initialPayment = Math.max(0, Number(form.initialPayment) || 0)
  const paymentRate = form.paymentCurrency === 'MXN' ? 1 : Math.max(0, Number(form.exchangeRate) || 0)
  const paymentEquivalent = form.registerAdvance ? initialPayment * paymentRate : 0
  const extraTotal = extraHours * extraHourCost
  const total = baseCost + extraTotal
  const balance = Math.max(0, total - paymentEquivalent)
  const selectedStartDate = localDateTime(form.startDate || dateKey(date), '12:00')
  const selectedEndDate = localDateTime(form.endDate || dateKey(date), '12:00')
  const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const selectedDateLabel = !form.startDate || !form.endDate
    ? 'Selecciona las fechas del evento'
    : form.startDate === form.endDate
      ? dateFormatter.format(selectedStartDate)
      : `Del ${dateFormatter.format(selectedStartDate)} al ${dateFormatter.format(selectedEndDate)}`
  const duration = useMemo(() => {
    const start = localDateTime(form.startDate, form.start).getTime()
    const end = localDateTime(form.endDate, form.end).getTime()
    return (end - start) / 60_000
  }, [form.startDate, form.start, form.endDate, form.end])

  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    const nextErrors: string[] = []
    if (duration < 60) nextErrors.push('La duración debe ser de al menos una hora. Revisa las fechas y horarios de inicio y fin.')
    if (!Number.isFinite(duration)) nextErrors.push('Indica las fechas y horarios de inicio y fin.')
    if (form.hasDecoration && (!form.decorationDate || !form.decorationTime)) nextErrors.push('Indica la fecha y hora en que comenzará la decoración.')
    if (form.hasDecoration && form.decorationDate && form.decorationTime && localDateTime(form.decorationDate, form.decorationTime) >= localDateTime(form.startDate, form.start)) nextErrors.push('La decoración debe comenzar antes del evento.')
    if (extraHours > 0 && (!form.extraHourCost || extraHourCost < 0)) nextErrors.push('Captura el costo por hora extra.')
    if (form.includeClient && (!form.firstName.trim() || !form.clientPhone.trim())) nextErrors.push('Para asociar un cliente, agrega su nombre y teléfono.')
    if (form.registerAdvance && initialPayment <= 0) nextErrors.push('Captura un anticipo mayor que cero o desactiva su registro.')
    if (form.registerAdvance && initialPayment > 0 && !form.includeClient) nextErrors.push('Asocia un cliente antes de confirmar el anticipo.')
    if (form.registerAdvance && form.paymentCurrency !== 'MXN' && paymentRate <= 0) nextErrors.push('Captura el tipo de cambio para convertir el anticipo a MXN.')
    if (form.registerAdvance && paymentEquivalent > total) nextErrors.push('El anticipo no puede ser mayor que el costo total.')

    if (!event && conflictRanges?.length && duration >= 60) {
      const start = form.hasDecoration && form.decorationDate && form.decorationTime ? localDateTime(form.decorationDate, form.decorationTime) : localDateTime(form.startDate, form.start)
      const end = localDateTime(form.endDate, form.end)
      const hasOverlap = conflictRanges.some((range) => {
        const existingStart = localDateTime(range.startDate, range.start)
        const existingEnd = localDateTime(range.endDate, range.end)
        return start < existingEnd && existingStart < end
      })
      if (hasOverlap) nextErrors.push('Este horario se empalma con un evento en la agenda.')
    }

    setErrors(nextErrors)
    setNotice(nextErrors.length ? '' : `Revisión completada. ${event ? 'Los cambios no se guardaron.' : 'El evento no se guardó.'}`)
  }

  return (
    <div className="agenda-modal-backdrop">
      <section className="event-composer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <header className="event-composer__header">
          <div><span className="section-kicker">{event ? 'EVENTO' : 'NUEVA RESERVA'}</span><h2 id="composer-title">{event ? 'Editar evento' : 'Agendar evento'}</h2><p>{selectedDateLabel}</p></div>
          <button type="button" className="dialog-close" aria-label="Cerrar formulario" onClick={onClose}>×</button>
        </header>

        <form className="event-composer__form" onSubmit={handleSubmit}>
          <div className="composer-sections">
            <section className="composer-section" aria-labelledby="event-data-title">
              <div className="composer-section__heading"><span className="composer-section__number">01</span><div><h3 id="event-data-title">Datos del evento</h3><p>Horario y características de la reserva.</p></div></div>
              <div className="composer-field-grid">
                <ComposerField label="Nombre del evento" className="composer-field--wide"><input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Ej. Cumpleaños, boda, reunión" required /></ComposerField>
                <ComposerField label={dateRangeMode ? 'Fecha de inicio' : 'Fecha del evento'}><DateField label={dateRangeMode ? 'Fecha de inicio' : 'Fecha del evento'} value={form.startDate} onChange={(nextDate) => { setForm((current) => ({ ...current, startDate: nextDate, endDate: dateRangeMode && current.endDate >= nextDate ? current.endDate : nextDate, decorationDate: current.decorationDate === current.startDate ? nextDate : current.decorationDate })); setNotice('') }} /></ComposerField>
                <ComposerField label="Hora de inicio"><input type="time" value={form.start} onChange={(e) => update('start', e.target.value)} required /></ComposerField>
                {dateRangeMode && <ComposerField label="Fecha de fin"><DateField label="Fecha de fin" min={form.startDate} value={form.endDate} onChange={(value) => update('endDate', value)} /></ComposerField>}
                <ComposerField label="Hora de fin"><input type="time" value={form.end} onChange={(e) => update('end', e.target.value)} required /></ComposerField>
              </div>
              <button type="button" className="date-range-toggle" aria-expanded={dateRangeMode} onClick={() => { const nextMode = !dateRangeMode; setDateRangeMode(nextMode); if (!nextMode) update('endDate', form.startDate) }}>{dateRangeMode ? '− El evento termina el mismo día' : '＋ Agregar fecha de fin'}</button>
              <div className="composer-switches">
                <SwitchField checked={form.hasDecoration} onChange={(value) => { update('hasDecoration', value); if (value && !form.decorationTime) { update('decorationDate', form.startDate); update('decorationTime', oneHourBefore(form.start)) } }} title="Requiere decoración" description="Se habilita la fecha y hora de montaje." />
                {form.hasDecoration && <div className="composer-field-grid"><ComposerField label="Fecha de decoración"><DateField label="Fecha de decoración" max={form.startDate} value={form.decorationDate} onChange={(value) => update('decorationDate', value)} /></ComposerField><ComposerField label="Hora de inicio de decoración"><input type="time" value={form.decorationTime} onChange={(e) => update('decorationTime', e.target.value)} required /></ComposerField></div>}
                <SwitchField checked={form.isSpecial} onChange={(value) => update('isSpecial', value)} title="Evento especial" description="Marca tarifas o condiciones especiales." />
              </div>
              <div className="composer-field-grid composer-field-grid--costs">
                <ComposerField label="Horas extra"><input type="number" min="0" step="1" inputMode="numeric" value={form.extraHours} onChange={(e) => update('extraHours', e.target.value)} /></ComposerField>
                <ComposerField label="Costo por hora extra"><span className="money-input"><i>$</i><input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={form.extraHourCost} onChange={(e) => update('extraHourCost', e.target.value)} disabled={extraHours === 0} /></span></ComposerField>
                <ComposerField label="Costo base del evento"><span className="money-input"><i>$</i><input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={form.baseCost} onChange={(e) => update('baseCost', e.target.value)} /></span></ComposerField>
                <div className="composer-field composer-field--wide composer-notes-control">{form.includeNotes ? <><button type="button" className="add-note-trigger" onClick={() => { setForm((current) => ({ ...current, includeNotes: false, notes: '' })); setNotice('') }}>− Quitar nota</button><textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Indicaciones para este evento" /></> : <button type="button" className="add-note-trigger" onClick={() => update('includeNotes', true)}>＋ Agregar nota opcional</button>}</div>
              </div>
            </section>

            <section className="composer-section" aria-labelledby="client-data-title">
              <div className="composer-section__heading"><span className="composer-section__number">02</span><div><h3 id="client-data-title">Cliente</h3><p>Asociar un cliente es opcional.</p></div></div>
              <SwitchField checked={form.includeClient} onChange={(value) => { update('includeClient', value); setClientLookupMessage('') }} title="Asociar cliente a este evento" description="Puedes dejar el evento sin cliente, salvo que registres un anticipo." />
              {form.includeClient && <div className="composer-field-grid composer-client-grid">
                <ComposerField label="Teléfono"><span className="client-phone-field"><input type="tel" inputMode="tel" value={form.clientPhone} onChange={(e) => { update('clientPhone', e.target.value); setClientLookupMessage('') }} placeholder="867 000 0000" /><button type="button" onClick={() => setClientLookupMessage(form.clientPhone.trim() ? 'No hay coincidencias. Puedes continuar con la captura manual.' : 'Escribe el teléfono para buscar un cliente.')}>Buscar</button></span>{clientLookupMessage && <small className="client-lookup-message" role="status">{clientLookupMessage}</small>}</ComposerField>
                <ComposerField label="Nombre"><input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Nombre" /></ComposerField>
                <ComposerField label="Apellido paterno"><input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Apellido paterno" /></ComposerField>
                <ComposerField label="Apellido materno"><input value={form.secondLastName} onChange={(e) => update('secondLastName', e.target.value)} placeholder="Apellido materno" /></ComposerField>
                <ComposerField label="Correo electrónico" className="composer-field--wide"><input type="email" inputMode="email" value={form.clientEmail} onChange={(e) => update('clientEmail', e.target.value)} placeholder="cliente@ejemplo.com" /></ComposerField>
                <ComposerField label="Dirección" className="composer-field--wide"><input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Calle y colonia" /></ComposerField>
                <ComposerField label="Colonia"><select value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)}><option value="">Selecciona colonia</option>{COLONIAS.map((neighborhood) => <option key={neighborhood}>{neighborhood}</option>)}</select></ComposerField>
                <ComposerField label="Número exterior"><input value={form.exteriorNumber} onChange={(e) => update('exteriorNumber', e.target.value)} placeholder="#" /></ComposerField>
              </div>}
            </section>

            <section className="composer-section" aria-labelledby="money-data-title">
              <div className="composer-section__heading"><span className="composer-section__number">03</span><div><h3 id="money-data-title">Resumen de costos</h3><p>Importes en pesos mexicanos.</p></div></div>
              <div className="composer-field-grid composer-field-grid--costs">
                {event ? <div className="composer-readonly"><span>Anticipo registrado</span><strong>{formatMoney(initialPayment)}</strong><small>Los movimientos se consultan por separado.</small></div> : <SwitchField checked={form.registerAdvance} onChange={(value) => update('registerAdvance', value)} title="Registrar anticipo al agendar" description="El cliente será necesario para confirmar el pago." />}
                {!event && form.registerAdvance && <div className="composer-field-grid composer-payment-grid">
                  <ComposerField label="Monto del anticipo"><span className="money-input"><i>{form.paymentCurrency === 'MXN' ? '$' : form.paymentCurrency}</i><input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={form.initialPayment} onChange={(e) => update('initialPayment', e.target.value)} required /></span></ComposerField>
                  <ComposerField label="Moneda"><select value={form.paymentCurrency} onChange={(e) => { const currency = e.target.value; setForm((current) => ({ ...current, paymentCurrency: currency, exchangeRate: currency === 'MXN' ? '1' : current.paymentCurrency === 'MXN' ? '' : current.exchangeRate })); setNotice('') }}><option value="MXN">MXN · Peso mexicano</option><option value="USD">USD · Dólar</option><option value="EUR">EUR · Euro</option></select></ComposerField>
                  {form.paymentCurrency !== 'MXN' && <ComposerField label="Tipo de cambio a MXN"><span className="money-input"><i>$</i><input type="number" min="0.0001" step="0.0001" inputMode="decimal" value={form.exchangeRate} onChange={(e) => update('exchangeRate', e.target.value)} required /></span></ComposerField>}
                  {form.paymentCurrency !== 'MXN' && <div className="payment-equivalent"><span>Equivalente aplicado al saldo</span><strong>{formatMoney(paymentEquivalent)}</strong></div>}
                </div>}
                <div className="cost-summary">
                  <div><span>Horas extra</span><strong>{formatMoney(extraTotal)}</strong></div>
                  <div><span>Costo total</span><strong>{formatMoney(total)}</strong></div>
                  <div className="cost-summary__balance"><span>Saldo pendiente</span><strong>{formatMoney(balance)}</strong></div>
                </div>
              </div>
            </section>
          </div>

          {(errors.length > 0 || notice) && <div className={`composer-feedback${errors.length ? ' composer-feedback--error' : ''}`} role="status">{errors.length > 0 ? <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul> : notice}</div>}
          <footer className="event-composer__footer"><div><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button type="submit" className="new-event-button">{event ? 'Guardar cambios' : 'Agendar evento'}</button></div></footer>
        </form>
      </section>
    </div>
  )
}
