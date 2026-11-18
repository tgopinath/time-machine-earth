// Muted, earthy palette for territories without a curated colour.
const PALETTE = [
  '#c9a46a', '#a7b38a', '#c58f6d', '#8fa3a8', '#b99a7a', '#9fb07c', '#d0a77f', '#a3927c',
  '#b6a26a', '#8f9f88', '#c79a8c', '#a9b1a0', '#bd8f5e', '#93a58f', '#c8b083', '#a68c74',
  '#b7a98f', '#9aa6b0', '#c39e74', '#a2ae86', '#b88a72', '#98a294', '#cdb48d', '#a98f82',
]

export function hashColor(key: string): string {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export const PRECISION_LABEL: Record<number, string> = {
  0: 'Unknown precision',
  1: 'Approximate',
  2: 'Moderately precise',
  3: 'Precise (set by treaty / international law)',
}

export const PRECISION_SHORT: Record<number, string> = { 0: 'Unknown', 1: 'Approximate', 2: 'Moderate', 3: 'Precise' }
