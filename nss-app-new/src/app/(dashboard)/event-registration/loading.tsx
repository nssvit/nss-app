import { PageHeaderSkeleton, CardGridSkeleton } from '@/components/loading-skeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={4} />
    </div>
  )
}
