'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportCSVData, exportXLSXData } from '@/app/actions/reports'

interface ExportButtonProps {
  filename?: string
}

export function ExportButton({ filename = 'NSS-Hours' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const dateSuffix = new Date().toISOString().split('T')[0]

  async function handleCSV() {
    setLoading(true)
    try {
      const csvString = await exportCSVData()
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      triggerDownload(blob, `${filename}-${dateSuffix}.csv`)
      toast.success('CSV exported successfully')
    } catch (err) {
      toast.error('CSV export failed')
      console.error('CSV export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleXLSX() {
    setLoading(true)
    try {
      const base64 = await exportXLSXData()
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      triggerDownload(blob, `${filename}-${dateSuffix}.xlsx`)
      toast.success('XLSX exported successfully')
    } catch (err) {
      toast.error('XLSX export failed')
      console.error('XLSX export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Download />}
          {loading ? 'Exporting...' : 'Export'}
          <ChevronDown className="ml-1 size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleXLSX}>
          <FileSpreadsheet className="mr-2 size-4" />
          Export as XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSV}>
          <FileText className="mr-2 size-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
