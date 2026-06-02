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
  await fetch('https://api.onesignal.com/notifications', {
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
}

export async function GET(req: NextRequest) {
  // Segurança: só aceita chamadas do Vercel Cron
  const auth = req.headers.get('authorization')
  if(auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Busca o estado atual
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('key', 'main')
      .single()

    if(error || !data) return NextResponse.json({ ok: true, msg: 'sem estado' })

    const state = data.data
    const matches: any[] = state?.round?.matches ?? []
    const roundName: string = state?.round?.name ?? 'da rodada'

    if(!matches.length || !state?.palpitesOpen) {
      return NextResponse.json({ ok: true, msg: 'sem jogos ou palpites fechados' })
    }

    // Hora atual em Brasília (UTC-3)
    const now = new Date()
    const brasiliaOffset = -3 * 60
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
    const brasiliaMinutes = ((utcMinutes + brasiliaOffset) + 1440) % 1440
    const brasiliaHour = Math.floor(brasiliaMinutes / 60)
    const brasiliaMin = brasiliaMinutes % 60
    const brasiliaDay = now.getUTCDate() // simplificado

    // Agrupa jogos por dia e pega o primeiro de cada dia
    const jogosPorDia: Record<string, any[]> = {}
    for(const m of matches) {
      const dia = m.date || 'sem_data'
      if(!jogosPorDia[dia]) jogosPorDia[dia] = []
      jogosPorDia[dia].push(m)
    }

    let notified = false

    for(const [dia, jogos] of Object.entries(jogosPorDia)) {
      // Ordena por horário e pega o primeiro
      const sorted = jogos.sort((a: any, b: any) => {
        const [ah, am] = (a.time || '00:00').split(':').map(Number)
        const [bh, bm] = (b.time || '00:00').split(':').map(Number)
        return (ah * 60 + am) - (bh * 60 + bm)
      })

      const primeiro = sorted[0]
      if(!primeiro?.time) continue

      const [jogoH, jogoM] = primeiro.time.split(':').map(Number)

      // Verifica se é exatamente agora (janela de 1 minuto)
      if(jogoH === brasiliaHour && jogoM === brasiliaMin) {
        const msg = `⚽ ${roundName} começou! ${primeiro.home} x ${primeiro.away} já está rolando. Já palpitou hoje?`
        await sendPush('🟢 A Rodada começou!', msg)
        notified = true
        console.log(`Push enviado: ${msg}`)
      }
    }

    return NextResponse.json({ ok: true, notified })
  } catch(err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
