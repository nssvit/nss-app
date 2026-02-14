'use client'

import { useState } from 'react'
import type { RoleDefinition } from '@/types'
import { useRoles } from '@/hooks/use-roles'
import { PageHeader } from '@/components/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, Users } from 'lucide-react'
import { RoleDefinitionsTable } from './role-definitions-table'
import { RoleAssignmentsTable } from './role-assignments-table'
import { RoleDefinitionModal } from './role-definition-modal'
import { AssignRoleModal } from './assign-role-modal'

export function RoleManagementPage() {
  const { roleDefinitions, userRoles, loading } = useRoles()
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  function handleCreateRole() {
    setEditingRole(null)
    setRoleModalOpen(true)
  }

  function handleEditRole(role: RoleDefinition) {
    setEditingRole(role)
    setRoleModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description="Manage role definitions and user role assignments."
        actions={
          <>
            <Button variant="outline" onClick={handleCreateRole}>
              <Shield className="size-4" />
              New Role
            </Button>
            <Button onClick={() => setAssignModalOpen(true)}>
              <Users className="size-4" />
              Assign Role
            </Button>
          </>
        }
      />

      <Tabs defaultValue="definitions">
        <TabsList>
          <TabsTrigger value="definitions">Role Definitions</TabsTrigger>
          <TabsTrigger value="assignments">Role Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="mt-4">
          <RoleDefinitionsTable roles={roleDefinitions} onEdit={handleEditRole} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <RoleAssignmentsTable assignments={userRoles} />
        </TabsContent>
      </Tabs>

      <RoleDefinitionModal
        role={editingRole}
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
      />

      <AssignRoleModal open={assignModalOpen} onOpenChange={setAssignModalOpen} />
    </div>
  )
}
