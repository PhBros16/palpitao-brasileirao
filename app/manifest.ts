import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Palpitão Brasileirão',
    short_name: 'Palpitão',
    description: 'Bolão do Campeonato Brasileiro Série A',
    start_url: '/',
    display: 'standalone',
    background_color: '#8B5A2B',
    theme_color: '#8B5A2B',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
