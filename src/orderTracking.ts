const STORAGE_KEY = 'estacao-de-natal.order-tracking.v1'
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isTrackingToken(value: string): boolean {
  return TOKEN_PATTERN.test(value.trim())
}

export function readTrackingTokens(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((value): value is string => typeof value === 'string' && isTrackingToken(value)))].slice(0, 20)
  } catch {
    return []
  }
}

export function rememberTrackingToken(token: string): void {
  if (!isTrackingToken(token)) return
  try {
    const tokens = [token.toLowerCase(), ...readTrackingTokens().filter((saved) => saved.toLowerCase() !== token.toLowerCase())].slice(0, 20)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } catch {
    // Private browsing or disabled storage: the order remains accessible with the copied code.
  }
}

export function forgetTrackingToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readTrackingTokens().filter((saved) => saved.toLowerCase() !== token.toLowerCase())))
  } catch {
    // Removing a saved code is best-effort when browser storage is unavailable.
  }
}
