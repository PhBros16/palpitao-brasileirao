'use client'

// Página de conferência visual da tela de Palpites.
// Rota: /palpites-teste — só para desenvolvimento, antes da integração real.
//
// Jogos MOCK (CLAUDE.md Regra 2: o componente não tem jogo hardcoded — os dados
// chegam por prop). Os kickoffs são relativos a "agora" para demonstrar todos
// os estados (travado, urgente <1h, aberto). Os logos apontam para
// /escudos/*.png que ainda não existem → cai no fallback de iniciais (é
// exatamente o comportamento de fallback). Escudos reais entram em
// /public/escudos na integração (CLAUDE.md §7).

import { useEffect, useState } from 'react'
import { PalpitesRodada, type JogoPalpite, type Palpite } from '@/components/palpites'

const MIN = 60 * 1000
const HORA = 60 * MIN

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

function buildJogos(): JogoPalpite[] {
  return [
    // Já começou → travado por horário
    { id: 'j1', home: 'Flamengo', away: 'Vasco da Gama', homeLogo: '/escudos/flamengo.png', awayLogo: '/escudos/vasco.png', kickoff: iso(-30 * MIN) },
    // Urgente (< 1h)
    { id: 'j2', home: 'Palmeiras', away: 'São Paulo', homeLogo: '/escudos/palmeiras.png', awayLogo: '/escudos/sao-paulo.png', kickoff: iso(38 * MIN) },
    // Abertos
    { id: 'j3', home: 'Grêmio', away: 'Internacional', homeLogo: '/escudos/gremio.png', awayLogo: '/escudos/internacional.png', kickoff: iso(2 * HORA + 10 * MIN) },
    { id: 'j4', home: 'Atlético-MG', away: 'Cruzeiro', homeLogo: '/escudos/atletico-mg.png', awayLogo: '/escudos/cruzeiro.png', kickoff: iso(5 * HORA) },
    { id: 'j5', home: 'Corinthians', away: 'Santos', homeLogo: '/escudos/corinthians.png', awayLogo: '/escudos/santos.png', kickoff: iso(26 * HORA) },
    // Trava manual do admin (futuro, mas bloqueado)
    { id: 'j6', home: 'Bahia', away: 'Vitória', homeLogo: '/escudos/bahia.png', awayLogo: '/escudos/vitoria.png', kickoff: iso(30 * HORA), travadoManual: true },
  ]
}

// Palpite já salvo no jogo travado (mostra valor em card bloqueado).
const PALPITES_INICIAIS: Record<string, Palpite> = {
  j1: { h: '2', a: '1' },
}

export default function PalpitesTestePage() {
  const [jogos, setJogos] = useState<JogoPalpite[] | null>(null)

  // Constrói os jogos só no cliente (kickoffs relativos a agora) — evita
  // qualquer divergência de relógio entre SSR e hidratação.
  useEffect(() => {
    setJogos(buildJogos())
  }, [])

  if (!jogos) return <main className="min-h-screen bg-papel-200" />

  return <PalpitesRodada rodadaNome="Rodada 12" jogos={jogos} palpitesIniciais={PALPITES_INICIAIS} />
}
