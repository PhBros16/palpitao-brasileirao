import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Palpitão Copa do Mundo 2026',
  description: 'Bolão Copa do Mundo 2026',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏆</text></svg>",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0,padding:0}}>
        {children}
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer strategy="afterInteractive"/>
        <Script id="onesignal-init" strategy="afterInteractive">{`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "d925369e-0929-43a2-b17c-ffdc11bfae8f",
              safari_web_id: "web.onesignal.auto.d925369e-0929-43a2-b17c-ffdc11bfae8f",
              notifyButton: { enable: false },
              allowLocalhostAsSecureOrigin: true,
            });
          });
        `}</Script>
      </body>
    </html>
  )
}
