export function isBusinessDay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dow = date.getDay()
  return dow === 0 || dow === 6 || HOLIDAYS.has(dateStr)
}
