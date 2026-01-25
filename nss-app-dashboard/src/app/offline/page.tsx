'use client'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">You&apos;re offline</h1>
        <p className="mb-6 text-gray-600">Please check your internet connection and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
