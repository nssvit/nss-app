import type { RoleDefinition } from '@/types'
import { ROLE_DISPLAY_NAMES, type Role } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface RoleDefinitionsTableProps {
  roles: RoleDefinition[]
  onEdit: (role: RoleDefinition) => void
}

export function RoleDefinitionsTable({ roles, onEdit }: RoleDefinitionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Role Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Hierarchy Level</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="font-medium">
              {ROLE_DISPLAY_NAMES[role.roleName as Role] ?? role.roleName}
            </TableCell>
            <TableCell className="text-muted-foreground">{role.description ?? '-'}</TableCell>
            <TableCell>{role.hierarchyLevel}</TableCell>
            <TableCell>
              <Badge
                className={cn(
                  role.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                )}
                variant="secondary"
              >
                {role.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(role)}>
                <Pencil className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
