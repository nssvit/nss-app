import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import type { SortDirection } from '@/hooks/use-table-sort'

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSortKey: string | null
  sortDirection: SortDirection
  onSort: (key: string) => void
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey

  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-accent/50"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="text-muted-foreground h-3.5 w-3.5" />
        )}
      </div>
    </TableHead>
  )
}
