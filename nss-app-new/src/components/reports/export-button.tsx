'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExportButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        console.log('Export triggered')
      }}
    >
      <Download />
      Export
    </Button>
  )
}
