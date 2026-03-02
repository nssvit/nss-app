'use server'

import { requireAdmin } from '@/lib/auth-cache'
import { getActiveProvider, setActiveProvider } from '@/lib/db-provider'
import { checkAllConnections, type HealthResult } from '@/db/health'
import { getRegisteredProviderNames } from '@/db/providers/registry'

export interface DbStatus {
  activeProvider: string
  availableProviders: string[]
  health: HealthResult[]
}

/**
 * Get the current DB status: active provider, available providers, and health.
 * Requires admin role.
 */
export async function getDbStatus(): Promise<DbStatus> {
  await requireAdmin()

  const [activeProvider, health] = await Promise.all([
    getActiveProvider(),
    checkAllConnections(),
  ])

  return {
    activeProvider,
    availableProviders: getRegisteredProviderNames(),
    health,
  }
}

/**
 * Switch the active database provider.
 * Requires admin role. Validates that the provider is registered.
 */
export async function switchDbProvider(provider: string): Promise<DbStatus> {
  await requireAdmin()

  const available = getRegisteredProviderNames()
  if (!available.includes(provider)) {
    throw new Error(`Unknown provider "${provider}". Available: ${available.join(', ')}`)
  }

  await setActiveProvider(provider)

  const health = await checkAllConnections()
  return { activeProvider: provider, availableProviders: available, health }
}
