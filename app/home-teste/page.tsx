'use client'

// Página de conferência visual da tela Início.
// Rota: /home-teste — só para desenvolvimento. Dados MOCK (CLAUDE.md Regra 2:
// nada hardcoded nos componentes; os dados chegam por prop daqui).

import { useEffect, useState } from 'react'
import { HomeScreen, type HomeData } from '@/components/home'

function buildData(): HomeData {
  return {
    rodadaNome: 'Brasileirão',
    rodadaNumero: 12,

    naRodada: 17,
    hoje: 8,
    posicao: 3,
    ptsParaSubir: 4,
    jogosTotais: 10,
    jogosAbertos: 6,
    craveiQuantos: 2,
    proximoFechaEm: Date.now() + 38 * 60 * 1000, // 38min → urgente (<2h)
    palpitePendente: true,

    faixas: [
      { titulo: 'Evidências', artista: 'Chitãozinho & Xororó' },
      { titulo: 'Tocando em Frente', artista: 'Almir Sater' },
      { titulo: 'O Tempo Não Para', artista: 'Cazuza' },
    ],

    parcial: [
      { nome: 'Marcos Viní', ptsRodada: 12, total: 312, palpitou: true },
      { nome: 'Pedro Sá', ptsRodada: 9, total: 274, palpitou: true },
      { nome: 'Diego Alves', ptsRodada: 8, total: 248, palpitou: true },
      { nome: 'Tiago Lopes', ptsRodada: 5, total: 233, palpitou: true },
      { nome: 'Léo Castro', ptsRodada: 0, total: 205, palpitou: true },
      { nome: 'Bruno Dias', ptsRodada: 0, total: 198, palpitou: false },
      { nome: 'Hugo Lima', ptsRodada: 3, total: 154, palpitou: true },
    ],
    finalizada: false,

    frango: {
      nome: 'Hugo Lima',
      texto: 'Cravou 0x3 no clássico e ainda postou no grupo que tinha "informação de dentro". 🐔',
    },

    jogos: [
      {
        id: 'j1',
        home: 'Flamengo',
        away: 'Vasco',
        placares: [
          { placar: '2x1', n: 8 },
          { placar: '1x1', n: 4 },
          { placar: '2x0', n: 2 },
          { placar: '1x2', n: 1 },
        ],
        distrib: { casa: 62, empate: 26, fora: 12 },
      },
      {
        id: 'j2',
        home: 'Palmeiras',
        away: 'São Paulo',
        placares: [
          { placar: '1x0', n: 6 },
          { placar: '2x1', n: 5 },
          { placar: '0x0', n: 3 },
        ],
        distrib: { casa: 48, empate: 30, fora: 22 },
      },
      {
        id: 'j3',
        home: 'Grêmio',
        away: 'Internacional',
        placares: [
          { placar: '1x1', n: 7 },
          { placar: '2x1', n: 3 },
          { placar: '0x1', n: 3 },
        ],
        distrib: { casa: 33, empate: 40, fora: 27 },
      },
    ],

    podio: [
      { nome: 'Marcos Viní', pts: 312 },
      { nome: 'Pedro Sá', pts: 274 },
      { nome: 'Diego Alves', pts: 248 },
    ],
  }
}

export default function HomeTestePage() {
  const [data, setData] = useState<HomeData | null>(null)

  // Monta no cliente (proximoFechaEm é relativo a agora) — evita mismatch de
  // relógio entre SSR e hidratação.
  useEffect(() => {
    setData(buildData())
  }, [])

  if (!data) return <main className="min-h-screen bg-papel-200" />

  return <HomeScreen data={data} />
}
