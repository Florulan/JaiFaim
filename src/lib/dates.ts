export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function today(): string {
  return toDateString(new Date())
}

export function getWeekDays(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return toDateString(d)
  })
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

export function formatDayLabel(dateStr: string): { day: string; num: string } {
  const date = new Date(dateStr + 'T12:00:00')
  return {
    day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
    num: date.getDate().toString(),
  }
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const start = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const end = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return start + ' - ' + end
}