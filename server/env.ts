type RuntimeGlobal = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}

const runtime = globalThis as RuntimeGlobal
export const env = runtime.process?.env ?? {}

export function isProduction(): boolean {
  return env.VERCEL_ENV === 'production'
}

export function hasSupabaseConfig(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
}

export function hasBearPayCheckoutConfig(): boolean {
  return Boolean(env.BEARPAY_API_KEY && env.BEARPAY_WEBHOOK_SECRET && hasSupabaseConfig())
}
