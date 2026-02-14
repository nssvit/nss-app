import { AppShell } from '@/components/layout'
import { Providers } from '@/components/providers'
import { AuthGuard } from '@/components/auth/auth-guard'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </Providers>
  )
}
