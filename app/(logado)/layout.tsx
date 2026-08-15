'use client'

// layout.tsx persistente pras abas logadas — grupo de rotas (logado) não
// afeta a URL (continua /inicio, /palpites, etc). Diferente de antes (cada
// página chamando <AppLayout> internamente, remontando tudo — header, nav,
// fundo animado, luzes — a cada troca de aba), agora AppLayout é montado
// UMA VEZ aqui; só {children} troca ao navegar entre abas.
//
// A virada de página (campo → home) agora acontece DENTRO do AberturaScreen,
// antes da navegação — não precisa mais de CampoFlipOverlay.
import { AppLayout } from '@/components/home/AppLayout'
import { AtualizarProvider } from '@/components/home/AtualizarContext'

export default function LogadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AtualizarProvider>
      <AppLayout>{children}</AppLayout>
    </AtualizarProvider>
  )
}
