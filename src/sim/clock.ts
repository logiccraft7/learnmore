/**
 * Game time is whole-number-friendly minutes since midnight on the first day (Wed 14 Oct 1925).
 * One in-game day lasts 20 real minutes, so 1 real second = 1.2 game minutes.
 */
export const START_DATE_UTC = Date.UTC(1925, 9, 14)
export const MINUTES_PER_DAY = 24 * 60
export const REAL_SECONDS_PER_DAY = 20 * 60
export const GAME_MINUTES_PER_REAL_SECOND = MINUTES_PER_DAY / REAL_SECONDS_PER_DAY

export const dayIndex = (minutes: number) => Math.floor(minutes / MINUTES_PER_DAY)
export const minuteOfDay = (minutes: number) => ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
export const hourOfDay = (minutes: number) => minuteOfDay(minutes) / 60

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function calendar(minutes: number) {
  const d = new Date(START_DATE_UTC + dayIndex(minutes) * 86_400_000)
  return { weekday: WEEKDAYS[d.getUTCDay()], month: MONTHS[d.getUTCMonth()], day: d.getUTCDate(), year: d.getUTCFullYear() }
}

/** "11:40 PM" */
export function clockLabel(minutes: number): string {
  const m = Math.floor(minuteOfDay(minutes))
  const h24 = Math.floor(m / 60)
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

/** "Wed, Oct 14, 1925" */
export function dateLabel(minutes: number): string {
  const c = calendar(minutes)
  return `${c.weekday.slice(0, 3)}, ${c.month} ${c.day}, ${c.year}`
}
