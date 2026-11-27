export type BadgeTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface ClientMock {
  initials: string
  name: string
  phone: string
  email: string
  address: string
  agendas: number
  events: number
  status: string
  statusTone: BadgeTone
  createdAt: string
  lastEventAt: string
  linkedAgendas: string[]
  recentEvents: { name: string; date: string; status: string; amount: string }[]
}

export interface MovementMock {
  folio: string
  date: string
  time: string
  client: string
  event: string
  type: 'Anticipo' | 'Abono' | 'Devolución'
  method: 'Transferencia' | 'Efectivo' | 'Tarjeta'
  currency: 'MXN' | 'USD'
  amount: string
  equivalent: string
  exchangeRate?: string
  registeredBy: string
  status: 'Aplicado' | 'Pendiente'
}

export interface UserMock {
  initials: string
  name: string
  email: string
  role: 'Administrador' | 'Usuario parcial' | 'Observador'
  agendas: number
  lastAccess: string
  active: boolean
}

export const CLIENTS: ClientMock[] = [
  { initials: 'ML', name: 'Mariana López', phone: '867 342 1976', email: 'mariana@correo.com', address: 'Av. Reforma 124, Col. Centro', agendas: 2, events: 3, status: 'Sin adeudo', statusTone: 'success', createdAt: '12 feb 2024', lastEventAt: '18 ene 2026', linkedAgendas: ['Alberca Las Palmas', 'Salón Magnolia'], recentEvents: [{ name: 'Cumpleaños de Ana', date: '18 ene 2026', status: 'Reservado', amount: '$5,500' }, { name: 'Boda López-Ruiz', date: '12 abr 2025', status: 'Liquidado', amount: 'Pagado' }] },
  { initials: 'AG', name: 'Ana García', phone: '867 210 6543', email: 'ana.garcia@correo.com', address: 'Calle Hidalgo 58, Col. San Ángel', agendas: 1, events: 2, status: 'Atención', statusTone: 'danger', createdAt: '04 jun 2024', lastEventAt: '09 dic 2025', linkedAgendas: ['Jardín San Ángel'], recentEvents: [{ name: 'Posada familiar', date: '09 dic 2025', status: 'Pendiente', amount: '$2,000' }] },
  { initials: 'CR', name: 'Carlos Rivera', phone: '867 776 4321', email: 'carlos.rivera@correo.com', address: 'Calle Morelos 210, Col. Del Valle', agendas: 3, events: 5, status: '$5,500 pendiente', statusTone: 'warning', createdAt: '21 oct 2023', lastEventAt: '22 nov 2025', linkedAgendas: ['Salón Magnolia', 'Terraza Rivera', 'Jardín del Lago'], recentEvents: [{ name: 'Aniversario Rivera', date: '22 nov 2025', status: 'Reservado', amount: '$5,500' }] },
  { initials: 'SM', name: 'Sofía Martínez', phone: '867 998 6677', email: 'sofia@correo.com', address: 'Av. Coyocán 432, Col. Narvarte', agendas: 1, events: 1, status: 'Sin adeudo', statusTone: 'success', createdAt: '15 mar 2025', lastEventAt: '03 ago 2025', linkedAgendas: ['Alberca Las Palmas'], recentEvents: [{ name: 'XV años de Sofía', date: '03 ago 2025', status: 'Liquidado', amount: 'Pagado' }] },
  { initials: 'JR', name: 'José Ramírez', phone: '867 120 3344', email: 'jose.ramirez@correo.com', address: 'Calle Juárez 18, Col. Centro', agendas: 2, events: 4, status: 'Sin adeudo', statusTone: 'success', createdAt: '02 ene 2024', lastEventAt: '14 feb 2026', linkedAgendas: ['Salón Magnolia', 'Jardín San Ángel'], recentEvents: [{ name: 'Reunión familiar', date: '14 feb 2026', status: 'Reservado', amount: '$3,200' }] },
  { initials: 'LH', name: 'Lucía Herrera', phone: '867 543 7788', email: 'lucia.herrera@correo.com', address: 'Av. Reforma 92, Col. Centro', agendas: 1, events: 2, status: 'Sin adeudo', statusTone: 'success', createdAt: '19 sep 2024', lastEventAt: '11 oct 2025', linkedAgendas: ['Terraza Rivera'], recentEvents: [{ name: 'Boda civil', date: '11 oct 2025', status: 'Liquidado', amount: 'Pagado' }] },
  { initials: 'AG', name: 'Alberto Gómez', phone: '867 654 8899', email: 'alberto.gomez@correo.com', address: 'Calle Morelos 88, Col. Del Valle', agendas: 2, events: 3, status: 'Atención', statusTone: 'danger', createdAt: '08 may 2023', lastEventAt: '27 jun 2025', linkedAgendas: ['Jardín del Lago', 'Alberca Las Palmas'], recentEvents: [{ name: 'Reunión familiar', date: '27 jun 2025', status: 'Pendiente', amount: '$1,800' }] },
  { initials: 'PV', name: 'Paola Vera', phone: '867 111 2233', email: 'paola.vera@correo.com', address: 'Calle Hidalgo 204, Col. San Ángel', agendas: 1, events: 1, status: 'Sin adeudo', statusTone: 'success', createdAt: '30 jul 2025', lastEventAt: '16 ago 2025', linkedAgendas: ['Jardín San Ángel'], recentEvents: [{ name: 'Cumpleaños de Mateo', date: '16 ago 2025', status: 'Liquidado', amount: 'Pagado' }] },
]

export const MOVEMENTS: MovementMock[] = [
  { folio: 'MOV-0284', date: '18 ene 2026', time: '12:18 h', client: 'Mariana López', event: 'Cumpleaños de Ana', type: 'Anticipo', method: 'Transferencia', currency: 'MXN', amount: '$9,000', equivalent: '$9,000', registeredBy: 'César Vázquez', status: 'Aplicado' },
  { folio: 'MOV-0283', date: '17 ene 2026', time: '18:40 h', client: 'Mariana López', event: 'Cumpleaños de Ana', type: 'Abono', method: 'Tarjeta', currency: 'USD', amount: '$300', equivalent: '$5,175', exchangeRate: 'TC 17.25', registeredBy: 'César Vázquez', status: 'Aplicado' },
  { folio: 'MOV-0282', date: '16 ene 2026', time: '10:05 h', client: 'José Ramírez', event: 'XV años de Sofía', type: 'Anticipo', method: 'Transferencia', currency: 'MXN', amount: '$15,000', equivalent: '$15,000', registeredBy: 'César Vázquez', status: 'Aplicado' },
  { folio: 'MOV-0281', date: '15 ene 2026', time: '16:22 h', client: 'Lucía Herrera', event: 'Boda civil', type: 'Abono', method: 'Efectivo', currency: 'MXN', amount: '$5,000', equivalent: '$5,000', registeredBy: 'César Vázquez', status: 'Pendiente' },
  { folio: 'MOV-0280', date: '14 ene 2026', time: '11:30 h', client: 'Alberto Gómez', event: 'Reunión familiar', type: 'Devolución', method: 'Transferencia', currency: 'MXN', amount: '-$2,000', equivalent: '-$2,000', registeredBy: 'César Vázquez', status: 'Aplicado' },
]

export const USERS: UserMock[] = [
  { initials: 'CV', name: 'César Vázquez', email: 'cesar@alafe.com', role: 'Administrador', agendas: 5, lastAccess: 'Hoy, 10:24', active: true },
  { initials: 'DV', name: 'Daniela Vallejo', email: 'daniela@alafe.com', role: 'Usuario parcial', agendas: 3, lastAccess: 'Ayer, 18:47', active: true },
  { initials: 'VL', name: 'Víctor Lucio', email: 'victor@alafe.com', role: 'Observador', agendas: 5, lastAccess: '12 ene, 09:16', active: false },
]

