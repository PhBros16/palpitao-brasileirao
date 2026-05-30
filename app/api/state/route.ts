import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const STATE_KEY = 'main'
const ADMIN_PASS = process.env.ADMIN_PASS!
const MASTER_PASS = process.env.MASTER_PASS!

export async function GET() {
  const { data, error } = await supabase
    .from('app_state').select('data').eq('key', STATE_KEY).single()
  if (error || !data) return NextResponse.json({ state: null })
  return NextResponse.json({ state: data.data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { state, password } = body
  if (password !== MASTER_PASS && password !== ADMIN_PASS && password !== state?.adminPass) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { error } = await supabase
    .from('app_state').upsert({ key: STATE_KEY, data: state }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
