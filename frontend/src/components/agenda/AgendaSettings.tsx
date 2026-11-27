import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export type WeekdayKey = typeof WEEKDAY_KEYS[number]
export type DailyHours = { start: string; end: string }
export type WeeklySchedule = Record<WeekdayKey, DailyHours>

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  sunday: { start: '08:00', end: '18:00' },
  monday: { start: '08:00', end: '18:00' },
  tuesday: { start: '08:00', end: '18:00' },
  wednesday: { start: '08:00', end: '18:00' },
  thursday: { start: '08:00', end: '18:00' },
  friday: { start: '08:00', end: '18:00' },
  saturday: { start: '08:00', end: '18:00' },
}

const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  sunday: 'Domingo', monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado',
}

export interface AgendaProfile {
  id: string
  name: string
  business: string
  defaultEventName: string
  currency: 'MXN' | 'USD'
  showGeneralNote: boolean
  generalNote: string
  weeklySchedule: WeeklySchedule
}

export interface WorkspaceSettings {
  name: string
}

interface AgendaSettingsProps {
  agendas: AgendaProfile[]
  setAgendas: Dispatch<SetStateAction<AgendaProfile[]>>
  workspace: WorkspaceSettings
  setWorkspace: Dispatch<SetStateAction<WorkspaceSettings>>
}

export default function AgendaSettings({ agendas, setAgendas, workspace, setWorkspace }: AgendaSettingsProps) {
  const [scheduleAgendaId, setScheduleAgendaId] = useState<string | null>(null)
  const [scheduleDraft, setScheduleDraft] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE)
  useEffect(() => {
    if (!scheduleAgendaId) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setScheduleAgendaId(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [scheduleAgendaId])

  const openSchedule = (agenda: AgendaProfile) => {
    setScheduleAgendaId(agenda.id)
    setScheduleDraft(agenda.weeklySchedule)
  }

  const saveSchedule = () => {
    if (!scheduleAgendaId) return
    setAgendas((current) => current.map((agenda) => agenda.id === scheduleAgendaId ? { ...agenda, weeklySchedule: scheduleDraft } : agenda))
    setScheduleAgendaId(null)
  }

  return (
    <section className="settings-page">
      <header className="settings-page__heading">
        <div><span className="section-kicker">ESPACIO DE TRABAJO</span><h1>Configuración</h1><p>Administra los datos generales y cada agenda de tu negocio.</p></div>
      </header>
      <div className="settings-layout">
        <aside className="settings-nav" aria-label="Secciones de configuración">
          <a href="#configuracion-general" className="settings-nav__item is-active">General</a>
          <a href="#configuracion-agendas" className="settings-nav__item">Por agenda <span>{agendas.length}</span></a>
        </aside>
        <div className="settings-sections">
          <section className="settings-card" id="configuracion-general">
            <div className="settings-card__heading"><div><span className="section-kicker">CUENTA</span><h2>Configuración general</h2><p>Estos valores aplican a todas las agendas.</p></div></div>
            <div className="settings-form-grid">
              <label>Nombre del espacio de trabajo<input value={workspace.name} onChange={(event) => setWorkspace((current) => ({ ...current, name: event.target.value }))} /></label>
            </div>
          </section>

          <section className="settings-card" id="configuracion-agendas">
            <div className="settings-card__heading settings-card__heading--row"><div><span className="section-kicker">NEGOCIOS</span><h2>Configuración por agenda</h2><p>Define la identidad, moneda, horarios y avisos de cada negocio.</p></div><button type="button" className="new-event-button settings-add" onClick={() => setAgendas((current) => [...current, { id: `agenda-${Date.now()}`, name: `Agenda ${current.length + 1}`, business: 'Nuevo negocio', defaultEventName: '', currency: 'MXN', showGeneralNote: false, generalNote: '', weeklySchedule: structuredClone(DEFAULT_WEEKLY_SCHEDULE) }])}>＋ Agregar agenda</button></div>
            <div className="settings-agenda-list" role="list" aria-label="Agendas configuradas">
              {agendas.map((agenda, index) => (
                <details className="settings-agenda" key={agenda.id} open={index === 0}>
                  <summary><span className="settings-agenda__icon" aria-hidden="true">▦</span><span><strong>{agenda.name || `Agenda ${index + 1}`}</strong><small>{agenda.business}</small></span><span className="settings-agenda__chevron" aria-hidden="true">⌄</span></summary>
                  <div className="settings-form-grid settings-form-grid--agenda">
                    <label>Nombre de la agenda<input value={agenda.name} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, name: event.target.value } : item))} placeholder={`Agenda ${index + 1}`} /></label>
                    <label>Nombre predeterminado al agendar<input value={agenda.defaultEventName} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, defaultEventName: event.target.value } : item))} placeholder="Ej. Nueva reserva" /></label>
                    <label>Moneda de esta agenda<select value={agenda.currency} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, currency: event.target.value as AgendaProfile['currency'] } : item))}><option value="MXN">Peso mexicano (MXN)</option><option value="USD">Dólar estadounidense (USD)</option></select></label>
                    <div className="settings-schedule-control"><span><strong>Horarios predeterminados</strong><small>Personaliza el horario de inicio y fin para cada día.</small></span><button type="button" className="cancel-button" onClick={() => openSchedule(agenda)}>Configurar horarios</button></div>
                    <label className="settings-toggle"><span><strong>Mostrar nota general</strong><small>Visible para el equipo en la agenda.</small></span><input type="checkbox" checked={agenda.showGeneralNote} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, showGeneralNote: event.target.checked } : item))} /></label>
                    <label className="settings-note-field">Nota general<textarea rows={3} value={agenda.generalNote} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, generalNote: event.target.value } : item))} placeholder="Escribe un aviso para las personas que consultan esta agenda." /></label>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
      {scheduleAgendaId && <div className="agenda-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setScheduleAgendaId(null) }}>
        <section className="event-dialog schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title">
          <header className="event-dialog__top"><div><span className="section-kicker">CONFIGURACIÓN POR AGENDA</span><h2 id="schedule-dialog-title">Horarios predeterminados</h2></div><button type="button" className="dialog-close" aria-label="Cerrar horarios" onClick={() => setScheduleAgendaId(null)}>×</button></header>
          <p className="event-dialog__date">Define el horario inicial para las citas de cada día.</p>
          <div className="schedule-days">{WEEKDAY_KEYS.map((day) => <div className="schedule-day" key={day}>
            <strong>{WEEKDAY_LABELS[day]}</strong>
            <label>Inicio<input type="time" value={scheduleDraft[day].start} onChange={(event) => setScheduleDraft((current) => ({ ...current, [day]: { ...current[day], start: event.target.value } }))} /></label>
            <label>Fin<input type="time" value={scheduleDraft[day].end} onChange={(event) => setScheduleDraft((current) => ({ ...current, [day]: { ...current[day], end: event.target.value } }))} /></label>
          </div>)}</div>
          <div className="event-dialog__actions"><button type="button" className="cancel-button" onClick={() => setScheduleAgendaId(null)}>Cancelar</button><button type="button" className="new-event-button" onClick={saveSchedule}>Guardar horarios</button></div>
        </section>
      </div>}
    </section>
  )
}
