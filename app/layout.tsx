import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Palpitão Copa do Mundo 2026',
  description: 'Bolão Copa do Mundo 2026',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0,padding:0}}>{children}</body>
    </html>
  )
}
