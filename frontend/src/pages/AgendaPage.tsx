import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EventActionDialog from '../components/agenda/EventActionDialog'
import EventComposer from '../components/agenda/EventComposer'
import AgendaSettings, { type AgendaProfile, type WorkspaceSettings } from '../components/agenda/AgendaSettings'
import type { DemoEvent, EventAction } from '../components/agenda/types'

type Theme = 'light' | 'dark'
type ModuleId = 'agenda' | 'clientes' | 'movimientos' | 'reportes' | 'usuarios' | 'configuracion'

interface AgendaPageProps {
  theme: Theme
  onToggleTheme: () => void
}

const MODULES: { id: ModuleId; label: string; icon: string }[] = [
  { id: 'agenda', label: 'Agenda', icon: '▦' },
  { id: 'clientes', label: 'Clientes', icon: '♙' },
  { id: 'movimientos', label: 'Movimientos', icon: '↔' },
  { id: 'reportes', label: 'Reportes', icon: '▤' },
  { id: 'usuarios', label: 'Usuarios', icon: '♧' },
  { id: 'configuracion', label: 'Configuración', icon: '⚙' },
]

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatMonth(date: Date): string {
  const value = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date)
  return value.charAt(0).toLocaleUpperCase('es-MX') + value.slice(1)
}

function formatSelectedDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return formatted.charAt(0).toLocaleUpperCase('es-MX') + formatted.slice(1)
}

function eventKey(event: DemoEvent): string {
  return `${event.startDate}-${event.start}-${event.title}`
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value)
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function eventTouchesDate(event: DemoEvent, date: Date): boolean {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  const eventStart = new Date(`${event.startDate}T${event.start}:00`)
  const eventEnd = new Date(`${event.endDate}T${event.end}:00`)
  return eventStart < dayEnd && eventEnd > dayStart
}

function eventsForDate(events: DemoEvent[], date: Date): DemoEvent[] {
  return events.filter((event) => eventTouchesDate(event, date)).sort((left, right) => {
    const leftStart = new Date(`${left.startDate}T${left.start}:00`).getTime()
    const rightStart = new Date(`${right.startDate}T${right.start}:00`).getTime()
    return leftStart - rightStart
  })
}

function createDemoEvents(date: Date, today: Date, agendaId: string): DemoEvent[] {
  const isMagnolia = agendaId === 'salon-magnolia'
  const events: DemoEvent[] = []
  const eventDays = [...new Set([5, 12, 19, today.getDate()])]
  eventDays.filter((day) => day <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()).forEach((day, index) => {
    const spansDate = index === 0
    const eventStart = new Date(date.getFullYear(), date.getMonth(), day)
    const eventEnd = spansDate ? new Date(date.getFullYear(), date.getMonth(), day + 1) : eventStart
    events.push({
      title: isMagnolia ? (index === 0 ? 'Boda civil' : ['Sesión de maquillaje', 'Prueba de peinado', 'Evento social'][index % 3]) : index === 0 ? 'Celebración familiar' : ['Cumpleaños de Ana', 'Reunión de verano', 'Fiesta de cumpleaños'][index % 3],
      client: isMagnolia ? ['Fernanda Ruiz', 'Lucía Herrera', 'Valeria Soto', 'Camila Reyes'][index % 4] : ['Mariana López', 'Ana García', 'Carlos Rivera', 'Sofía Martínez'][index % 4],
      time: spansDate ? '4:00 p. m. – 12:30 a. m. (día siguiente)' : index % 2 === 0 ? '4:00 p. m. – 11:00 p. m.' : '2:00 p. m. – 9:00 p. m.',
      startDate: toDateKey(eventStart),
      endDate: toDateKey(eventEnd),
      start: index % 2 === 0 ? '16:00' : '14:00',
      end: spansDate ? '00:30' : index % 2 === 0 ? '23:00' : '21:00',
      decorationDate: index % 2 === 0 ? toDateKey(eventStart) : undefined,
      decorationStart: index % 2 === 0 ? '15:00' : undefined,
      phone: '867 123 4567',
      decoration: index % 2 === 0 ? 'Decoración · 3:00 p. m.' : 'Sin decoración',
      balance: index % 2 === 0 ? 5500 : 2000,
      extraHours: index % 2 === 0 ? '2 horas extra' : 'Sin horas extra',
      baseCost: index % 2 === 0 ? 8500 : 5000,
      extraHourCost: index % 2 === 0 ? 500 : 0,
      advance: index % 2 === 0 ? 4000 : 3000,
      note: index % 2 === 0 ? 'Traerán decoración para la mesa principal.' : 'Confirmar acceso con recepción.',
    })
  })
  const morningDate = new Date(date.getFullYear(), date.getMonth(), 5)
  events.push({
    title: isMagnolia ? 'Preparación de novia' : 'Desayuno de equipo',
    client: isMagnolia ? 'Fernanda Ruiz' : 'Diego Torres',
    time: '10:00 a. m. – 2:00 p. m.',
    startDate: toDateKey(morningDate),
    endDate: toDateKey(morningDate),
    start: '10:00',
    end: '14:00',
    phone: '867 555 0192',
    decoration: 'Sin decoración',
    balance: 0,
    extraHours: 'Sin horas extra',
    baseCost: 3000,
    extraHourCost: 0,
    advance: 3000,
    note: 'Acceso por recepción principal.',
  })
  return events
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === 'light' ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.1 15.4A8.3 8.3 0 0 1 8.6 3.9 8.5 8.5 0 1 0 20.1 15.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.7" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
  )
}

function Sidebar({ active, onSelect, open, onClose, theme, onToggleTheme }: {
  active: ModuleId
  onSelect: (module: ModuleId) => void
  open: boolean
  onClose: () => void
  theme: Theme
  onToggleTheme: () => void
}) {
  return (
    <>
      {open && <button type="button" className="agenda-backdrop" aria-label="Cerrar menú" onClick={onClose} />}
      <aside className={`agenda-sidebar${open ? ' agenda-sidebar--open' : ''}`} aria-label="Menú de módulos">
        <div className="agenda-sidebar__brand">
          <span className="agenda-brand-mark" aria-hidden="true"><span>A</span></span>
          <span className="agenda-brand-name">alafe<span>.</span></span>
          <button className="sidebar-close" type="button" aria-label="Cerrar menú" onClick={onClose}>×</button>
        </div>
        <div className="agenda-sidebar__caption">ESPACIO DE TRABAJO</div>
        <nav className="module-nav" aria-label="Módulos">
          {MODULES.map((module) => (
            <button type="button" key={module.id} className={`module-nav__item${active === module.id ? ' is-active' : ''}`} aria-current={active === module.id ? 'page' : undefined} onClick={() => onSelect(module.id)}>
              <span className="module-nav__icon" aria-hidden="true">{module.icon}</span><span>{module.label}</span>
              {module.id === 'agenda' && <span className="module-nav__active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <button className="sidebar-theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}><ThemeIcon theme={theme} /><span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span></button>
        <div className="sidebar-account">
          <span className="avatar">CV</span><span className="sidebar-account__text"><strong>César Vázquez</strong><small>Administrador</small></span><span className="account-menu" aria-hidden="true">···</span>
        </div>
      </aside>
    </>
  )
}

function MonthCalendar({ month, selectedDate, today, events, selectedRange, rangeMode, selectedEventId, onSelectDate, onOpenNewEvent, onSelectEvent, onEditEvent }: {
  month: Date
  selectedDate: Date
  today: Date
  events: DemoEvent[]
  selectedRange: { start: Date; end: Date } | null
  rangeMode: boolean
  selectedEventId: string | null
  onSelectDate: (date: Date) => void
  onOpenNewEvent: (date: Date) => void
  onSelectEvent: (event: DemoEvent, date: Date) => void
  onEditEvent: (event: DemoEvent) => void
}) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()
  const cells: (number | null)[] = [...Array.from({ length: firstWeekday }, () => null), ...Array.from({ length: totalDays }, (_, index) => index + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="month-grid" role="group" aria-label={`Calendario de ${formatMonth(month)}`}>
      {WEEKDAYS.map((weekday) => <div className="month-grid__weekday" aria-hidden="true" key={weekday}>{weekday}</div>)}
      {cells.map((day, index) => {
        if (day === null) return <div className="month-grid__empty" aria-hidden="true" key={`empty-${index}`} />
        const date = new Date(year, monthIndex, day)
        const isSelected = date.toDateString() === selectedDate.toDateString()
        const isToday = date.toDateString() === today.toDateString()
        const dayEvents = eventsForDate(events, date)
        const inRange = selectedRange !== null && date >= selectedRange.start && date <= selectedRange.end
        const rangeStart = selectedRange !== null && date.toDateString() === selectedRange.start.toDateString()
        const rangeEnd = selectedRange !== null && date.toDateString() === selectedRange.end.toDateString()
        const eventTitles = dayEvents.map((event) => event.title).join(', ')
        const label = `${day} de ${formatMonth(month)}${dayEvents.length ? `, ${dayEvents.length} evento${dayEvents.length > 1 ? 's' : ''}: ${eventTitles}` : ', sin eventos'}${isToday ? ', hoy' : ''}`
        return (
        <div className="month-grid__cell" key={day}>
            <button type="button" className={`calendar-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}${dayEvents.length ? ' has-event' : ''}${dayEvents.length > 1 ? ' has-multiple-events' : ''}${inRange ? ' is-in-range' : ''}${rangeStart ? ' is-range-start' : ''}${rangeEnd ? ' is-range-end' : ''}`} aria-label={`${rangeMode ? 'Seleccionar' : 'Ver detalles de'} ${label}${!rangeMode ? '. Doble clic para agendar' : ''}`} aria-pressed={isSelected} onClick={() => onSelectDate(date)} onDoubleClick={() => { if (!rangeMode) onOpenNewEvent(date) }}>
              <span className="calendar-day__number">{day}</span>
            </button>
            {dayEvents.length > 0 && <div className="calendar-day__events" aria-label={`Eventos del ${day} de ${formatMonth(month)}`}>{dayEvents.slice(0, 2).map((event) => <button type="button" className={`calendar-day__event${selectedEventId === eventKey(event) ? ' is-active' : ''}`} key={eventKey(event)} aria-label={`Ver ${event.title}, ${event.time}`} aria-pressed={selectedEventId === eventKey(event)} onClick={() => onSelectEvent(event, date)} onDoubleClick={() => onEditEvent(event)}><i aria-hidden="true" /> <span>{event.title}</span></button>)}{dayEvents.length > 2 && <button type="button" className="calendar-day__more" aria-label={`Ver ${dayEvents.length - 2} eventos más del ${day} de ${formatMonth(month)}`} onClick={() => onSelectDate(date)}>+{dayEvents.length - 2} más</button>}</div>}
          </div>
        )
      })}
    </div>
  )
}

function EventDetails({ date, events, selectedEventId, focusRequest, onNewEvent, onEdit, onAction }: { date: Date; events: DemoEvent[]; selectedEventId: string | null; focusRequest: number; onNewEvent: (date: Date) => void; onEdit: (event: DemoEvent) => void; onAction: (action: EventAction, event: DemoEvent) => void }) {
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null)
  const eventCardRefs = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (!selectedEventId) {
      setHighlightedEventId(null)
      return
    }
    const card = eventCardRefs.current.get(selectedEventId)
    if (!card) return

    setHighlightedEventId(selectedEventId)
    card.focus({ preventScroll: true })
    card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' })
    const timeout = window.setTimeout(() => setHighlightedEventId((current) => current === selectedEventId ? null : current), 1500)
    return () => window.clearTimeout(timeout)
  }, [date, events, focusRequest, selectedEventId])

  const copyPhone = async (phone: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(phone)
      } else {
        const input = document.createElement('textarea')
        input.value = phone
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        const copied = document.execCommand('copy')
        input.remove()
        if (!copied) throw new Error('No se pudo copiar')
      }
      setCopiedPhone(phone)
      window.setTimeout(() => setCopiedPhone((current) => current === phone ? null : current), 1800)
    } catch {
      setCopiedPhone(null)
    }
  }

  return (
    <section className="selected-day" aria-live="polite" aria-label="Detalle de fecha seleccionada">
      <div className="selected-day__heading">
        <div><span className="section-kicker">FECHA SELECCIONADA</span><h2>{formatSelectedDate(date)}</h2></div>
        <button type="button" className="new-event-button selected-day__new" onClick={() => onNewEvent(date)}><span aria-hidden="true">＋</span> Agregar</button>
      </div>
      {events.length > 0 ? events.map((event) => (
        <article ref={(card) => { if (card) eventCardRefs.current.set(eventKey(event), card); else eventCardRefs.current.delete(eventKey(event)) }} tabIndex={-1} aria-label={`${event.title}, detalles del evento`} className={`event-card${highlightedEventId === eventKey(event) ? ' is-highlighted' : ''}`} key={eventKey(event)}>
          <div className="event-card__time"><span className="event-card__time-icon" aria-hidden="true">◷</span><strong>{event.time}</strong><span className="event-card__status"><i /> Reservado</span></div>
          <div className="event-card__main"><div className="event-card__title"><h3>{event.title}</h3><div className="event-client"><span className="client-avatar" aria-hidden="true">{event.client.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="event-client__name">{event.client}</span><a className="event-card__phone" href={`tel:${event.phone.replace(/\D/g, '')}`}>{event.phone}</a><button type="button" className="phone-copy" aria-label={copiedPhone === event.phone ? 'Teléfono copiado' : `Copiar teléfono ${event.phone}`} onClick={() => void copyPhone(event.phone)}>{copiedPhone === event.phone ? 'Copiado' : <><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="6.5" y="6.5" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M4 13.5V4.8A1.8 1.8 0 0 1 5.8 3h7.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>Copiar</span></>}</button></div></div><button type="button" className="more-button" aria-label={`Editar ${event.title}`} onClick={() => onEdit(event)}>✎</button></div>
          <div className="event-tags"><span className="event-tag event-tag--decoration">{event.decoration}</span>{event.balance > 0 ? <span className="event-tag event-tag--pending">Saldo pendiente: {formatMoney(event.balance)}</span> : <span className="event-tag event-tag--paid">Liquidado</span>}<span className="event-tag event-tag--hours">{event.extraHours}</span><span className="event-tag event-tag--notes">Nota</span></div>
          <p className="event-card__note"><span aria-hidden="true">▤</span>{event.note}</p>
          <div className="event-card__actions"><button type="button" onClick={() => onAction('movements', event)}><span aria-hidden="true">↔</span> Movimientos</button><button type="button" onClick={() => onAction('refund', event)}><span aria-hidden="true">↩</span> Registrar devolución</button><button type="button" onClick={() => onAction('traceability', event)}><span aria-hidden="true">◷</span> Trazabilidad</button><button type="button" className="event-card__delete" onClick={() => onAction('delete', event)}><span aria-hidden="true">×</span> Eliminar evento</button></div>
        </article>
      )) : (
        <div className="empty-day"><span className="empty-day__icon" aria-hidden="true">＋</span><div><strong>Esta fecha está disponible</strong><p>Agenda un evento para este día.</p></div></div>
      )}
    </section>
  )
}

function AgendaWorkspace({ theme, onToggleTheme }: AgendaPageProps) {
  const today = useMemo(() => new Date(), [])
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [activeModule, setActiveModule] = useState<ModuleId>('agenda')
  const [menuOpen, setMenuOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [composerEvent, setComposerEvent] = useState<DemoEvent | undefined>()
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null)
  const [rangeAnchor, setRangeAnchor] = useState<Date | null>(null)
  const [rangeMode, setRangeMode] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [eventFocusRequest, setEventFocusRequest] = useState(0)
  const [actionDialog, setActionDialog] = useState<{ action: EventAction; event: DemoEvent } | null>(null)
  const [agendas, setAgendas] = useState<AgendaProfile[]>([
    { id: 'alberca-las-palmas', name: 'Alberca Las Palmas', business: 'Alberca y eventos', defaultEventName: 'Nueva reserva', currency: 'MXN', showGeneralNote: true, generalNote: 'Recordatorio: confirmar el montaje y el acceso con recepción antes de cada evento.' },
    { id: 'salon-magnolia', name: 'Salón Magnolia', business: 'Salón de eventos', defaultEventName: 'Nuevo evento', currency: 'MXN', showGeneralNote: true, generalNote: 'Aviso: el montaje de decoración debe coordinarse con el equipo del salón.' },
  ])
  const [activeAgendaId, setActiveAgendaId] = useState('alberca-las-palmas')
  const [agendaMenuOpen, setAgendaMenuOpen] = useState(false)
  const agendaMenuRef = useRef<HTMLDivElement>(null)
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>({ name: 'ALAFE' })
  const activeAgenda = agendas.find((agenda) => agenda.id === activeAgendaId) ?? agendas[0]
  const events = useMemo(() => createDemoEvents(month, today, activeAgenda.id), [month, today, activeAgenda.id])
  const selectedEvents = useMemo(() => eventsForDate(events, selectedDate), [events, selectedDate])

  useEffect(() => {
    if (!menuOpen && !eventDialogOpen && !actionDialog && !agendaMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setEventDialogOpen(false)
        setActionDialog(null)
        setAgendaMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, eventDialogOpen, actionDialog, agendaMenuOpen])

  useEffect(() => {
    if (!agendaMenuOpen) return
    const closeMenu = (event: MouseEvent) => {
      if (!agendaMenuRef.current?.contains(event.target as Node)) setAgendaMenuOpen(false)
    }
    window.addEventListener('mousedown', closeMenu)
    return () => window.removeEventListener('mousedown', closeMenu)
  }, [agendaMenuOpen])

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    setMonth(nextMonth)
    setSelectedDate(nextMonth)
    setSelectedEventId(null)
    if (!rangeMode) setSelectedRange(null)
  }
  const goToToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
    setSelectedEventId(null)
    setSelectedRange(null)
    setRangeAnchor(null)
    setRangeMode(false)
  }
  const selectModule = (module: ModuleId) => {
    setActiveModule(module)
    setMenuOpen(false)
  }
  const selectCalendarDate = (date: Date) => {
    setSelectedDate(date)
    setSelectedEventId(null)
    if (!rangeMode) {
      setSelectedRange(null)
      setRangeAnchor(null)
      return
    }
    if (!rangeAnchor) {
      setRangeAnchor(date)
      setSelectedRange({ start: date, end: date })
      return
    }
    const start = date < rangeAnchor ? date : rangeAnchor
    const end = date < rangeAnchor ? rangeAnchor : date
    setSelectedRange({ start, end })
    setRangeAnchor(null)
    setRangeMode(false)
    setComposerEvent(undefined)
    setEventDialogOpen(true)
  }
  const editEvent = (event: DemoEvent) => {
    setComposerEvent(event)
    setSelectedEventId(eventKey(event))
    setEventDialogOpen(true)
  }
  const selectCalendarEvent = (event: DemoEvent, date: Date) => {
    setSelectedDate(date)
    setSelectedEventId(eventKey(event))
    setEventFocusRequest((current) => current + 1)
  }
  const openNewEvent = (date: Date) => {
    setSelectedDate(date)
    setSelectedEventId(null)
    setSelectedRange(null)
    setRangeAnchor(null)
    setComposerEvent(undefined)
    setEventDialogOpen(true)
  }
  const openEventAction = (action: EventAction, event: DemoEvent) => setActionDialog({ action, event })
  const selectAgenda = (agendaId: string) => {
    setActiveAgendaId(agendaId)
    setSelectedEventId(null)
    setSelectedRange(null)
    setRangeAnchor(null)
    setRangeMode(false)
    setAgendaMenuOpen(false)
  }
  const initialRange = selectedRange
    ? { startDate: toDateKey(selectedRange.start), endDate: toDateKey(selectedRange.end) }
    : { startDate: toDateKey(selectedDate), endDate: toDateKey(selectedDate) }

  return (
    <div className="agenda-shell">
      <Sidebar active={activeModule} onSelect={selectModule} open={menuOpen} onClose={() => setMenuOpen(false)} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="agenda-main">
        <header className="agenda-topbar">
          <button type="button" className="menu-toggle" aria-label="Abrir menú de módulos" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
          <div className="topbar-brand"><span className="agenda-brand-mark" aria-hidden="true"><span>A</span></span><span className="agenda-brand-name">alafe<span>.</span></span></div>
          <div className="last-activity"><span className="activity-pulse" /><span><strong>Último registro</strong><small>Modificación · Víctor H.</small></span><time>hace 20 min</time></div>
          <Link className="exit-demo" to="/" aria-label="Salir al inicio" title="Salir al inicio"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 5H5.8A1.8 1.8 0 0 0 4 6.8v10.4A1.8 1.8 0 0 0 5.8 19H10M14 8l4 4-4 4M18 12H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
        </header>

        <main className="agenda-content">
          {activeModule === 'agenda' ? (
            <>
              <div className="agenda-page-heading"><div><span className="section-kicker">AGENDA</span><div className="agenda-title-row"><h1>{activeAgenda.name || 'Agenda sin nombre'}</h1><div className="agenda-switcher" ref={agendaMenuRef}><button type="button" className="agenda-switcher__trigger" aria-label="Cambiar agenda" aria-expanded={agendaMenuOpen} aria-haspopup="menu" onClick={() => setAgendaMenuOpen((open) => !open)}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 9.5 12 14l5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>{agendaMenuOpen && <div className="agenda-switcher__menu" role="menu" aria-label="Cambiar agenda">{agendas.map((agenda) => <button type="button" role="menuitemradio" aria-checked={agenda.id === activeAgenda.id} className={`agenda-switcher__option${agenda.id === activeAgenda.id ? ' is-active' : ''}`} key={agenda.id} onClick={() => selectAgenda(agenda.id)}><span className="agenda-switcher__option-icon" aria-hidden="true">▦</span><span><strong>{agenda.name || 'Agenda sin nombre'}</strong><small>{agenda.business}</small></span>{agenda.id === activeAgenda.id && <i aria-label="Agenda actual">✓</i>}</button>)}</div>}</div></div></div><button className="new-event-button" type="button" onClick={() => openNewEvent(selectedDate)}><span aria-hidden="true">＋</span> Nuevo evento</button></div>
              <div className="agenda-workspace">
              <div className="agenda-calendar-column">
              <section className="calendar-panel" aria-label="Agenda mensual">
                <div className="calendar-panel__toolbar"><div className="month-title"><span className="month-title__icon" aria-hidden="true">▦</span><h2>{formatMonth(month)}</h2></div><div className="month-controls"><button type="button" className="today-button" onClick={goToToday}>Hoy</button><div className="month-arrows"><button type="button" aria-label="Mes anterior" onClick={() => moveMonth(-1)}>‹</button><button type="button" aria-label="Mes siguiente" onClick={() => moveMonth(1)}>›</button></div></div></div>
                <div className={`range-selection-control${rangeMode ? ' is-active' : ''}`}><span>{rangeMode ? rangeAnchor ? 'Elige la fecha final del evento.' : 'Elige la primera fecha del evento.' : selectedRange ? `Rango: ${formatSelectedDate(selectedRange.start)} — ${formatSelectedDate(selectedRange.end)}` : ''}</span><button type="button" onClick={() => { setRangeMode((active) => !active); setRangeAnchor(null); setSelectedRange(null) }}>{rangeMode ? 'Cancelar rango' : 'Seleccionar rango'}</button></div>
                <MonthCalendar month={month} selectedDate={selectedDate} today={today} events={events} selectedRange={selectedRange} rangeMode={rangeMode} selectedEventId={selectedEventId} onSelectDate={selectCalendarDate} onOpenNewEvent={openNewEvent} onSelectEvent={selectCalendarEvent} onEditEvent={editEvent} />
                <div className="calendar-legend"><span><i className="legend-dot legend-dot--today" />Hoy</span><span><i className="legend-dot legend-dot--selected" />Seleccionado</span><span><i className="legend-dot legend-dot--busy" />Con evento</span></div>
              </section>
              {activeAgenda.showGeneralNote && activeAgenda.generalNote.trim() && <aside className="agenda-general-note"><span className="agenda-general-note__icon" aria-hidden="true">i</span><div><strong>Nota general · {activeAgenda.name}</strong><p>{activeAgenda.generalNote}</p></div></aside>}
              </div>
              <EventDetails date={selectedDate} events={selectedEvents} selectedEventId={selectedEventId} focusRequest={eventFocusRequest} onNewEvent={openNewEvent} onEdit={editEvent} onAction={openEventAction} />
              </div>
            </>
          ) : activeModule === 'configuracion' ? (
            <AgendaSettings agendas={agendas} setAgendas={setAgendas} workspace={workspaceSettings} setWorkspace={setWorkspaceSettings} />
          ) : (
            <section className="module-placeholder"><span className="module-placeholder__symbol">{MODULES.find((module) => module.id === activeModule)?.icon}</span><span className="section-kicker">MÓDULO ALAFE</span><h1>{MODULES.find((module) => module.id === activeModule)?.label}</h1><p>Consulta la información de {MODULES.find((module) => module.id === activeModule)?.label.toLocaleLowerCase('es-MX')} relacionada con tus eventos.</p><button type="button" className="today-button" onClick={() => setActiveModule('agenda')}>Volver a la agenda</button></section>
          )}
        </main>
      </div>
      {eventDialogOpen && <EventComposer date={selectedDate} initialRange={initialRange} event={composerEvent} defaultEventName={activeAgenda.defaultEventName} conflictRanges={!composerEvent ? events.map((existing) => ({ startDate: existing.decorationDate ?? existing.startDate, endDate: existing.endDate, start: existing.decorationStart ?? existing.start, end: existing.end })) : undefined} onClose={() => setEventDialogOpen(false)} />}
      {actionDialog && <EventActionDialog action={actionDialog.action} event={actionDialog.event} onClose={() => setActionDialog(null)} />}
    </div>
  )
}

export default function AgendaPage(props: AgendaPageProps) {
  return <AgendaWorkspace {...props} />
}
