import type { Dispatch, SetStateAction } from 'react'

export interface AgendaProfile {
  id: string
  name: string
  business: string
  defaultEventName: string
  currency: 'MXN' | 'USD'
  showGeneralNote: boolean
  generalNote: string
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
            <div className="settings-card__heading settings-card__heading--row"><div><span className="section-kicker">NEGOCIOS</span><h2>Configuración por agenda</h2><p>Define la identidad, moneda y avisos de cada negocio.</p></div><button type="button" className="new-event-button settings-add" onClick={() => setAgendas((current) => [...current, { id: `agenda-${Date.now()}`, name: `Agenda ${current.length + 1}`, business: 'Nuevo negocio', defaultEventName: '', currency: 'MXN', showGeneralNote: false, generalNote: '' }])}>＋ Agregar agenda</button></div>
            <div className="settings-agenda-list" role="list" aria-label="Agendas configuradas">
              {agendas.map((agenda, index) => (
                <details className="settings-agenda" key={agenda.id} open={index === 0}>
                  <summary><span className="settings-agenda__icon" aria-hidden="true">▦</span><span><strong>{agenda.name || `Agenda ${index + 1}`}</strong><small>{agenda.business}</small></span><span className="settings-agenda__chevron" aria-hidden="true">⌄</span></summary>
                  <div className="settings-form-grid settings-form-grid--agenda">
                    <label>Nombre de la agenda<input value={agenda.name} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, name: event.target.value } : item))} placeholder={`Agenda ${index + 1}`} /></label>
                    <label>Nombre predeterminado al agendar<input value={agenda.defaultEventName} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, defaultEventName: event.target.value } : item))} placeholder="Ej. Nueva reserva" /></label>
                    <label>Moneda de esta agenda<select value={agenda.currency} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, currency: event.target.value as AgendaProfile['currency'] } : item))}><option value="MXN">Peso mexicano (MXN)</option><option value="USD">Dólar estadounidense (USD)</option></select></label>
                    <label className="settings-toggle"><span><strong>Mostrar nota general</strong><small>Visible para el equipo en la agenda.</small></span><input type="checkbox" checked={agenda.showGeneralNote} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, showGeneralNote: event.target.checked } : item))} /></label>
                    <label className="settings-note-field">Nota general<textarea rows={3} value={agenda.generalNote} onChange={(event) => setAgendas((current) => current.map((item) => item.id === agenda.id ? { ...item, generalNote: event.target.value } : item))} placeholder="Escribe un aviso para las personas que consultan esta agenda." /></label>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
