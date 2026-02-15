import { PageHeaderSkeleton, TabsSkeleton } from '@/components/loading-skeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton actions />
      <TabsSkeleton />
    </div>
  )
}
