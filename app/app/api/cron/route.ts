import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET!

async function sendPush(title: string, message: string) {
  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Total Subscriptions'],
      headings: { pt: title, en: title },
      contents: { pt: message, en: message },
      url: 'https://palpitao-copa-mundo.vercel.app',
    }),
  })
  return res.json()
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')

  if (authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('key', 'main')
      .single()

    if (error || !data) return NextResponse.json({ ok: true, msg: 'sem estado' })

    const state = data.data
    const matches: any[] = state?.round?.matches ?? []
    const roundName: string = state?.round?.name ?? 'da rodada'

    if (!matches.length || !state?.palpitesOpen) {
      return NextResponse.json({ ok: true, msg: 'sem jogos ou palpites fechados' })
    }

    // Hora atual em Brasília (UTC-3)
    const now = new Date()
    const brasiliaOffset = -3 * 60 // minutos
    const brasiliaMs = now.getTime() + brasiliaOffset * 60 * 1000
    const brasilia = new Date(brasiliaMs)

    const brasiliaHour = brasilia.getUTCHours()
    const brasiliaMin = brasilia.getUTCMinutes()
    const brasiliaDay = brasilia.getUTCDate()
    const brasiliaMonth = brasilia.getUTCMonth() + 1

    // Agrupa jogos por dia e pega o primeiro de cada dia
    const jogosPorDia: Record<string, any[]> = {}
    for (const m of matches) {
      const dia = m.date || 'sem_data'
      if (!jogosPorDia[dia]) jogosPorDia[dia] = []
      jogosPorDia[dia].push(m)
    }

    let notified = false

    for (const [dia, jogos] of Object.entries(jogosPorDia)) {
      // Ordena por horário e pega o primeiro
      const sorted = jogos.sort((a: any, b: any) => {
        const [ah, am] = (a.time || '00:00').split(':').map(Number)
        const [bh, bm] = (b.time || '00:00').split(':').map(Number)
        return ah * 60 + am - (bh * 60 + bm)
      })

      const primeiro = sorted[0]
      if (!primeiro?.time) continue

      // Verifica se o dia do jogo é hoje
      if (dia && dia !== 'sem_data') {
        const [dd, mm] = dia.split('/').map(Number)
        if (dd !== brasiliaDay || mm !== brasiliaMonth) continue
      }

      const [jogoH, jogoM] = primeiro.time.split(':').map(Number)

      // Minutos totais do jogo e do momento atual (Brasília)
      const jogoMinTotal = jogoH * 60 + jogoM
      const agoraMinTotal = brasiliaHour * 60 + brasiliaMin

      // Diferença em minutos entre o jogo e agora
      const diffMin = jogoMinTotal - agoraMinTotal

      // Janela: entre 55 e 65 minutos antes (tolerância ±5 min para o cron de 1h)
      if (diffMin >= 55 && diffMin <= 65) {
        const title = '⏰ Último aviso para palpitar!'
        const msg = `${roundName}: ${primeiro.home} x ${primeiro.away} começa em aproximadamente 1 hora. Não perca o prazo! ✍️`
        await sendPush(title, msg)
        notified = true
        console.log(`Push enviado (1h antes): ${title}`)
      }

      // Janela: entre -5 e +5 minutos (jogo começando agora)
      if (diffMin >= -5 && diffMin <= 5) {
        const title = '    🚨 Rodada em andamento!'
        const msg = `${primeiro.homeFlag} ${primeiro.home} x ${primeiro.away} ${primeiro.awayFlag} rolando agora!`
        await sendPush(title, msg)
        notified = true
        console.log(`Push enviado (início do jogo): ${title}`)
      }
    }

    return NextResponse.json({ ok: true, notified, brasiliaHour, brasiliaMin })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
