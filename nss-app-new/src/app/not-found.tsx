import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <div className="bg-muted rounded-full p-6">
        <FileQuestion className="text-muted-foreground h-12 w-12" />
      </div>
      <h1 className="mt-6 text-3xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  )
}
