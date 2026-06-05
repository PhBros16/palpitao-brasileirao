import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY!
const API_URL = 'https://v3.football.api-sports.io'

// Converte UTC para horário de Brasília (UTC-3)
function toBrasilia(utcDate: string): { date: string; time: string } {
  const dt = new Date(utcDate)
  // Subtrai 3h
  const brasilia = new Date(dt.getTime() - 3 * 60 * 60 * 1000)
  const dd   = String(brasilia.getUTCDate()).padStart(2, '0')
  const mm   = String(brasilia.getUTCMonth() + 1).padStart(2, '0')
  const hh   = String(brasilia.getUTCHours()).padStart(2, '0')
  const min  = String(brasilia.getUTCMinutes()).padStart(2, '0')
  return { date: `${dd}/${mm}`, time: `${hh}:${min}` }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const league = searchParams.get('league')
  const season = searchParams.get('season') || '2026'
  const round  = searchParams.get('round')

  if (!league || !round) {
    return NextResponse.json({ error: 'Parâmetros league e round são obrigatórios' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'Chave API_FOOTBALL_KEY não configurada na Vercel' }, { status: 500 })
  }

  try {
    const url = `${API_URL}/fixtures?league=${league}&season=${season}&round=${encodeURIComponent(round)}`

    const res = await fetch(url, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      next: { revalidate: 0 }, // sem cache
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Erro na API: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = Object.values(data.errors).join(', ')
      return NextResponse.json({ error: `Erro da API: ${errMsg}` }, { status: 400 })
    }

    if (!data.response || data.response.length === 0) {
      return NextResponse.json({ games: [] })
    }

    // Mapeia para o formato do Palpitão
    const games = data.response.map((fixture: any) => {
      const { date, time } = toBrasilia(fixture.fixture.date)
      return {
        id:        String(fixture.fixture.id),
        home:      fixture.teams.home.name,
        away:      fixture.teams.away.name,
        homeLogo:  fixture.teams.home.logo || '',
        awayLogo:  fixture.teams.away.logo || '',
        homeFlag:  '🏳',
        awayFlag:  '🏳',
        date,
        time,
        status:    fixture.fixture.status?.short || '',
      }
    })

    return NextResponse.json({ games, total: games.length })

  } catch (err) {
    console.error('import-games error:', err)
    return NextResponse.json({ error: 'Erro interno ao buscar jogos' }, { status: 500 })
  }
}
