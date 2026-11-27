const LEGACY_STORAGE_KEY = 'estacao-de-natal.order-tracking.v1'
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isTrackingToken(value: string): boolean {
  return TOKEN_PATTERN.test(value.trim())
}

export function clearLegacyTrackingTokens(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private browsing; new tokens are never written there.
  }
}
