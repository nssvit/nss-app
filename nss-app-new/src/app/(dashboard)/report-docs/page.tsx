import { ProtectedRoute } from '@/components/auth/protected-route'
import { ReportDocsPage } from '@/components/report-docs'

export default function ReportDocsRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <ReportDocsPage />
    </ProtectedRoute>
  )
}
