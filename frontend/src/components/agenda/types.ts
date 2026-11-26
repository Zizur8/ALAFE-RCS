export interface DemoEvent {
  title: string
  client: string
  time: string
  startDate: string
  endDate: string
  start: string
  end: string
  decorationDate?: string
  decorationStart?: string
  phone: string
  decoration: string
  balance: number
  extraHours: string
  baseCost: number
  extraHourCost: number
  advance: number
  note: string
}

export type EventAction = 'movements' | 'refund' | 'traceability' | 'delete'
