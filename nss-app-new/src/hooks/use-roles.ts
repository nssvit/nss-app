'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RoleDefinition, UserRoleWithDefinition } from '@/types'
import { getRoles, getCurrentUserRoles } from '@/app/actions/roles'

export function useRoles() {
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleWithDefinition[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [rd, ur] = await Promise.all([getRoles(), getCurrentUserRoles()])
      setRoleDefinitions(rd)
      setUserRoles(ur)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to load roles:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const [rd, ur] = await Promise.all([getRoles(), getCurrentUserRoles()])
        if (!ignore) {
          setRoleDefinitions(rd)
          setUserRoles(ur)
        }
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        console.error('Failed to load roles:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [])

  return { roleDefinitions, userRoles, loading, refresh }
}
