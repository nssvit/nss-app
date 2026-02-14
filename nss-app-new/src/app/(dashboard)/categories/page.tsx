import { ProtectedRoute } from '@/components/auth/protected-route'
import { CategoryManagementPage } from '@/components/categories'

export default function CategoriesRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <CategoryManagementPage />
    </ProtectedRoute>
  )
}
