import { PageHeaderSkeleton, TableSkeleton } from '@/components/loading-skeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} />
    </div>
  )
}
