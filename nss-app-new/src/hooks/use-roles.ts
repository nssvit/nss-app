'use client'

import { useState, useEffect } from 'react'
import type { RoleDefinition, UserRoleWithDefinition } from '@/types'
import { getRoleDefinitions, getUserRoles } from '@/lib/mock-api'

export function useRoles() {
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleWithDefinition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [rd, ur] = await Promise.all([getRoleDefinitions(), getUserRoles()])
      setRoleDefinitions(rd)
      setUserRoles(ur)
      setLoading(false)
    }
    load()
  }, [])

  return { roleDefinitions, userRoles, loading }
}
