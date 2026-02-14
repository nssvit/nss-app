import { Providers } from '@/components/providers'
import { RedirectIfAuthenticated } from '@/components/auth/redirect-if-authenticated'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <RedirectIfAuthenticated>
        <div className="bg-background grid min-h-screen lg:grid-cols-2">
          {/* Left branding panel — hidden on mobile */}
          <div className="from-primary to-primary/80 relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br p-10 text-white lg:flex">
            <div className="relative z-10 flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 192 192"
                className="shrink-0"
              >
                <rect width="192" height="192" rx="38.4" fill="white" fillOpacity="0.2" />
                <text
                  x="50%"
                  y="55%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="white"
                  fontFamily="Arial, sans-serif"
                  fontSize="86.4"
                  fontWeight="bold"
                >
                  NSS
                </text>
              </svg>
              <span className="text-lg font-semibold">NSS App</span>
            </div>

            <div className="relative z-10 space-y-4">
              <blockquote className="text-xl font-medium leading-relaxed">
                &ldquo;Not me, but you&rdquo;
              </blockquote>
              <p className="text-sm text-white/80">
                National Service Scheme &mdash; Volunteer Management System
              </p>
            </div>

            <div className="text-xs text-white/50 relative z-10">
              &copy; {new Date().getFullYear()} NSS App
            </div>

            {/* Decorative circles */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5" />
          </div>

          {/* Right form panel */}
          <div className="flex flex-col">
            {/* Mobile header */}
            <div className="flex items-center gap-2 p-6 lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 192 192"
                className="shrink-0"
              >
                <rect width="192" height="192" rx="38.4" fill="hsl(239 84% 67%)" />
                <text
                  x="50%"
                  y="55%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="white"
                  fontFamily="Arial, sans-serif"
                  fontSize="86.4"
                  fontWeight="bold"
                >
                  NSS
                </text>
              </svg>
              <span className="text-lg font-semibold">NSS App</span>
            </div>

            <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
              <div className="w-full max-w-sm">{children}</div>
            </div>
          </div>
        </div>
      </RedirectIfAuthenticated>
    </Providers>
  )
}
