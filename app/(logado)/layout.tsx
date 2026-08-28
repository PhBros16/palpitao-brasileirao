'use client'

// layout.tsx persistente pras abas logadas — grupo de rotas (logado) não
// afeta a URL (continua /inicio, /palpites, etc). AppLayout é montado
// UMA VEZ aqui; só {children} troca ao navegar entre abas.
//
// A revelação "vindo do login" (cortina subindo + luzes acendendo) é
// tratada inteiramente por LuzesAmbiente (dentro de AppLayout) — não existe
// mais um CortinaSubindo separado aqui. Os dois consumiam a mesma flag do
// sessionStorage ('palpitao_cortina_subir') em momentos diferentes do ciclo
// do React, e o CortinaSubindo sempre vencia a corrida (seu useState lê e
// apaga a flag durante a renderização, antes de qualquer useEffect rodar) —
// então LuzesAmbiente nunca via a flag a tempo, e as duas revelações
// (cortina + luz) aconteciam desencontradas, uma por cima da outra.
import { AppLayout } from '@/components/home/AppLayout'
import { AtualizarProvider } from '@/components/home/AtualizarContext'

export default function LogadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AtualizarProvider>
      <AppLayout>{children}</AppLayout>
    </AtualizarProvider>
  )
}
