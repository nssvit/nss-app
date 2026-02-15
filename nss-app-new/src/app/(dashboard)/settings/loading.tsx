import { PageHeaderSkeleton, FormSkeleton } from '@/components/loading-skeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={4} />
    </div>
  )
}
