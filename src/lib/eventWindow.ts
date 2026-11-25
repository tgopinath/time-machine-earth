/** How far around the selected year an event marker stays visible. */
export function eventWindow(y: number): number {
  if (y < -1000) return 300
  if (y < 0) return 150
  if (y < 1000) return 100
  if (y < 1500) return 50
  if (y < 1800) return 30
  return 15
}
