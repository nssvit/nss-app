import type { DbProviderConfig, DbInstance } from './types'

const providers = new Map<string, DbProviderConfig>()
let defaultName: string | null = null

/** Register a database provider. First registered becomes the default. */
export function registerProvider(config: DbProviderConfig): void {
  providers.set(config.name, config)
  if (!defaultName) defaultName = config.name
}

/**
 * Override the default provider by name.
 * Called after all providers register, based on the DATABASE env var.
 * Silently ignored if the named provider isn't registered.
 */
export function setDefaultProvider(name: string): void {
  if (providers.has(name)) defaultName = name
}

/** Get a specific provider's Drizzle instance, or null if not registered. */
export function getProvider(name: string): DbInstance | null {
  return providers.get(name)?.db ?? null
}

/** Get the default provider's Drizzle instance. Throws if none registered. */
export function getDefaultProvider(): DbInstance {
  if (!defaultName || !providers.has(defaultName)) {
    throw new Error('No database providers registered. Check your DATABASE_URL / NEON_DATABASE_URL env vars.')
  }
  return providers.get(defaultName)!.db
}

/** Name of the first-registered (default) provider. */
export function getDefaultProviderName(): string {
  if (!defaultName) {
    throw new Error('No database providers registered.')
  }
  return defaultName
}

/** All registered provider names, in registration order. */
export function getRegisteredProviderNames(): string[] {
  return [...providers.keys()]
}

/** All registered provider configs. */
export function getRegisteredProviders(): DbProviderConfig[] {
  return [...providers.values()]
}

/** True when more than one provider is registered. */
export function isDualMode(): boolean {
  return providers.size > 1
}
