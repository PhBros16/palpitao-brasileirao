import type { Metadata, Viewport } from 'next'
import { ToastProvider } from '@/components/home/Toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Palpitão Brasileirão',
  description: 'Bolão do Campeonato Brasileiro Série A',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Palpitão',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1f1206',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Fundo crítico inline — pinta escuro ANTES do globals.css terminar
            de carregar. Sem isso, o navegador mostra branco padrão por um
            instante em toda abertura fria do app (some assim que o CSS
            externo carrega, mas nesse meio tempo aparece o flash branco). */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{background-color:#1f1206}' }} />

        {/* PRECONNECTS (Fontes e Banco) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vvdrtjceipikxedebfvh.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vvdrtjceipikxedebfvh.supabase.co" />

        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
