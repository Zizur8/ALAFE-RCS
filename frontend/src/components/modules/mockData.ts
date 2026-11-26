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
  { initials: 'ML', name: 'Mariana López', phone: '867 342 1976', email: 'mariana@correo.com', address: 'Av. Reforma 124, Col. Centro', agendas: 2, events: 3, status: 'Sin adeudo', statusTone: 'success' },
  { initials: 'AG', name: 'Ana García', phone: '867 210 6543', email: 'ana.garcia@correo.com', address: 'Calle Hidalgo 58, Col. San Ángel', agendas: 1, events: 2, status: 'Atención', statusTone: 'danger' },
  { initials: 'CR', name: 'Carlos Rivera', phone: '867 776 4321', email: 'carlos.rivera@correo.com', address: 'Calle Morelos 210, Col. Del Valle', agendas: 3, events: 5, status: '$5,500 pendiente', statusTone: 'warning' },
  { initials: 'SM', name: 'Sofía Martínez', phone: '867 998 6677', email: 'sofia.martinez@correo.com', address: 'Av. Coyocán 432, Col. Narvarte', agendas: 1, events: 1, status: 'Sin adeudo', statusTone: 'success' },
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

