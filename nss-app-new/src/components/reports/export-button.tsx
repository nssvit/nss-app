'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportButtonProps {
  data?: Record<string, unknown>[]
  filename?: string
}

export function ExportButton({ data, filename = 'report' }: ExportButtonProps) {
  function handleExport() {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h]
            const str = val === null || val === undefined ? '' : String(val)
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
          })
          .join(',')
      ),
    ]
    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={!data || data.length === 0}>
      <Download />
      Export
    </Button>
  )
}
