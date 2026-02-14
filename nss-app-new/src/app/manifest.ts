import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NSS App',
    short_name: 'NSS',
    description: 'National Service Scheme Management Application',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#070b18',
    theme_color: '#4f46e5',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
  }
}
