'use client'

import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { CommandPalette } from '@/components/command-palette'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <CommandPalette />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
