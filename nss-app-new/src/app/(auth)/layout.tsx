import { Providers } from '@/components/providers'
import { RedirectIfAuthenticated } from '@/components/auth/redirect-if-authenticated'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <RedirectIfAuthenticated>
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </RedirectIfAuthenticated>
    </Providers>
  )
}
