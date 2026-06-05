'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const PLAYERS = ['Ramon','Matheus Couto','Pedro Frozza','Pedro Gaúcho','Victor Bahia','Victor Simões','PH','André','Matheus Brito','Costa','Diniz','Samuel','Giovanni','Damus']
const MASTER_PASS = 'Mestre#26Pal'

// Mapeamento de nome da seleção → logo local
const SELECOES_LOGOS: Record<string, string> = {
  'brasil': '/logos/brasil.png',
  'brazil': '/logos/brasil.png',
  'argentina': '/logos/argentina.png',
  'alemanha': '/logos/alemanha.png',
  'germany': '/logos/alemanha.png',
  'frança': '/logos/franca.png',
  'franca': '/logos/franca.png',
  'france': '/logos/franca.png',
  'espanha': '/logos/espanha.png',
  'spain': '/logos/espanha.png',
  'portugal': '/logos/portugal.png',
  'inglaterra': '/logos/inglaterra.png',
  'england': '/logos/inglaterra.png',
  'holanda': '/logos/holanda.png',
  'netherlands': '/logos/holanda.png',
  'belgica': '/logos/belgica.png',
  'bélgica': '/logos/belgica.png',
  'belgium': '/logos/belgica.png',
  'croacia': '/logos/croacia.png',
  'croácia': '/logos/croacia.png',
  'croatia': '/logos/croacia.png',
  'uruguai': '/logos/uruguai.png',
  'uruguay': '/logos/uruguai.png',
  'colombia': '/logos/colombia.png',
  'colômbia': '/logos/colombia.png',
  'mexico': '/logos/mexico.png',
  'méxico': '/logos/mexico.png',
  'eua': '/logos/eua.png',
  'usa': '/logos/eua.png',
  'estados unidos': '/logos/eua.png',
  'canada': '/logos/canada.png',
  'canadá': '/logos/canada.png',
  'equador': '/logos/equador.png',
  'ecuador': '/logos/equador.png',
  'paraguai': '/logos/paraguai.png',
  'paraguay': '/logos/paraguai.png',
  'japao': '/logos/japao.png',
  'japão': '/logos/japao.png',
  'japan': '/logos/japao.png',
  'coreia do sul': '/logos/coreia-do-sul.png',
  'south korea': '/logos/coreia-do-sul.png',
  'australia': '/logos/australia.png',
  'austrália': '/logos/australia.png',
  'marrocos': '/logos/marrocos.png',
  'morocco': '/logos/marrocos.png',
  'senegal': '/logos/senegal.png',
  'gana': '/logos/gana.png',
  'ghana': '/logos/gana.png',
  'egito': '/logos/egito.png',
  'egypt': '/logos/egito.png',
  'nigeria': '/logos/nigeria.png',
  'argelia': '/logos/argelia.png',
  'algeria': '/logos/argelia.png',
  'tunisia': '/logos/tunisia.png',
  'tunísia': '/logos/tunisia.png',
  'africa do sul': '/logos/africa-do-sul.png',
  'south africa': '/logos/africa-do-sul.png',
  'congo': '/logos/congo.png',
  'costa do marfim': '/logos/costa-do-marfim.png',
  'cabo verde': '/logos/cabo-verde.png',
  'cabo-verde': '/logos/cabo-verde.png',
  'arabia saudita': '/logos/arabia-saudita.png',
  'arábia saudita': '/logos/arabia-saudita.png',
  'saudi arabia': '/logos/arabia-saudita.png',
  'ira': '/logos/ira.png',
  'iran': '/logos/ira.png',
  'iraque': '/logos/iraque.png',
  'iraq': '/logos/iraque.png',
  'jordania': '/logos/jordania.png',
  'jordânia': '/logos/jordania.png',
  'jordan': '/logos/jordania.png',
  'qatar': '/logos/qatar.png',
  'suica': '/logos/suica.png',
  'suíça': '/logos/suica.png',
  'switzerland': '/logos/suica.png',
  'austria': '/logos/austria.png',
  'áustria': '/logos/austria.png',
  'suecia': '/logos/suecia.png',
  'suécia': '/logos/suecia.png',
  'sweden': '/logos/suecia.png',
  'noruega': '/logos/noruega.png',
  'norway': '/logos/noruega.png',
  'escocia': '/logos/escocia.png',
  'escócia': '/logos/escocia.png',
  'scotland': '/logos/escocia.png',
  'bosnia': '/logos/bosnia.png',
  'bósnia': '/logos/bosnia.png',
  'republica tcheca': '/logos/republica-tcheca.png',
  'república tcheca': '/logos/republica-tcheca.png',
  'czech republic': '/logos/republica-tcheca.png',
  'turquia': '/logos/turquia.png',
  'turkey': '/logos/turquia.png',
  'nova zelandia': '/logos/nova-zelandia.png',
  'nova zelândia': '/logos/nova-zelandia.png',
  'new zealand': '/logos/nova-zelandia.png',
  'haiti': '/logos/haiti.png',
  'panama': '/logos/panama.png',
  'panamá': '/logos/panama.png',
  'curacao': '/logos/curacao.png',
  'curaçao': '/logos/curacao.png',
  'uzbequistao': '/logos/uzbequistao.png',
  'uzbequistão': '/logos/uzbequistao.png',
  'uzbekistan': '/logos/uzbequistao.png',
}

function getSelecaoLogo(name: string): string {
  return SELECOES_LOGOS[name.toLowerCase().trim()] || ''
}

const PHASE_MULTIPLIERS: any = {
  grupos:1, dezesseis:2, oitavas:3, quartas:4, semi:5, terceiro:6, final:6
}

function defaultMatches() {
  return [
    { id:'m1', home:'Brasil', away:'Argentina', homeFlag:'🇧🇷', awayFlag:'🇦🇷', date:'', time:'16:00', locked:false, hasQuemAvanca:false, hasPenaltis:false },
    { id:'m2', home:'França', away:'Alemanha', homeFlag:'🇫🇷', awayFlag:'🇩🇪', date:'', time:'19:00', locked:false, hasQuemAvanca:false, hasPenaltis:false },
  ]
}

function defaultScoringPhases() {
  return [{
    id:'fase1', name:'Fase de Grupos / Geral',
    rules:[
      {desc:'Acertar o vencedor do jogo', pts:1},
      {desc:'Acertar o saldo de gols', pts:3},
      {desc:'Acertar o placar exato', pts:5},
    ],
  }]
}

function defaultMultipliers() {
  return { quemAvanca:2, penaltisBonus:1 }
}

function defaultState(): any {
  return {
    adminPass:'Copa2026!',
    round:{ name:'Fase de Grupos - Rodada 1', phase:'grupos', number:1, matches:defaultMatches() },
    palpitesOpen:true,
    palpites:{}, palpiteTimes:{}, results:{},
    correctedScores:{}, totalPoints:{},
    roundHistory:[],
    shame:{ player:'', photoUrl:'', text:'' },
    roundFinalized:false,
    scoringPhases:defaultScoringPhases(),
    multipliers:defaultMultipliers(),
    novidades:[] as any[],
    admins:[] as any[],
    adminLog:[] as any[],
  }
}

function parseMatchDateTime(m: any): Date | null {
  if(!m.time) return null
  const [h, min] = m.time.split(':').map(Number)
  if(isNaN(h)||isNaN(min)) return null
  const dt = new Date()
  if(m.date) {
    const [dd, MM] = m.date.split('/').map(Number)
    if(!isNaN(dd)&&!isNaN(MM)) {
      dt.setMonth(MM-1)
      dt.setDate(dd)
    }
  }
  dt.setHours(h, min, 0, 0)
  return dt
}

function isMatchLocked(m: any, matchIndex: number = 1): boolean {
  if(m.locked) return true
  const matchTime = parseMatchDateTime(m)
  if(!matchTime) return false
  const buffer = matchIndex === 0 ? 0 : 30 * 60 * 1000
  return (matchTime.getTime() - Date.now()) <= buffer
}

function getCountdown(m: any, matchIndex: number): string | null {
  const matchTime = parseMatchDateTime(m)
  if(!matchTime) return null
  const buffer = matchIndex === 0 ? 0 : 30 * 60 * 1000
  const diff = matchTime.getTime() - buffer - Date.now()
  if(diff <= 0) return null
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  if(hours > 0) return `${hours}h ${mins}min`
  if(mins > 0) return `${mins}min`
  return `${secs}s`
}

function getCountdownMs(m: any, matchIndex: number): number {
  const matchTime = parseMatchDateTime(m)
  if(!matchTime) return Infinity
  const buffer = matchIndex === 0 ? 0 : 30 * 60 * 1000
  return matchTime.getTime() - buffer - Date.now()
}

function calcPoints(pal: any, res: any, phase: any, mult: number, m: any, extraRes: any, scoreMult: any) {
  if(!pal||!res||res.h===''||res.a==='') return null
  const ph=parseInt(pal.h), pa=parseInt(pal.a)
  const rh=parseInt(res.h), ra=parseInt(res.a)
  if(isNaN(ph)||isNaN(pa)||isNaN(rh)||isNaN(ra)) return null
  const rules = phase?.rules || defaultScoringPhases()[0].rules
  let base = 0
  if(ph===rh&&pa===ra) base = rules[2]?.pts??5
  else if((ph-pa)===(rh-ra)) base = rules[1]?.pts??3
  else {
    const pw=ph>pa?1:ph<pa?-1:0, rw=rh>ra?1:rh<ra?-1:0
    if(pw===rw) base = rules[0]?.pts??1
  }
  let total = base * mult
  if(m?.hasQuemAvanca && extraRes?.quemAvanca && pal?.quemAvanca) {
    if(pal.quemAvanca === extraRes.quemAvanca) total += (scoreMult?.quemAvanca??2) * mult
  }
  if(m?.hasPenaltis && extraRes?.foiPenaltis === true && ph===pa) {
    total += (scoreMult?.penaltisBonus??1)
  }
  return total
}

// Calcula pontos simulados (se o resultado fosse o palpite)
function calcSimulatedPoints(pal: any, phase: any, mult: number, m: any, scoreMult: any) {
  if(!pal||pal.h===''||pal.a==='') return null
  return calcPoints(pal, {h: pal.h, a: pal.a}, phase, mult, m, {quemAvanca: pal.quemAvanca, foiPenaltis: pal.penaltis==='sim'}, scoreMult)
}

function posIcon(i: number) {
  const cls = i===0?'p1':i===1?'p2':i===2?'p3':'pn'
  return <span className={`pos-badge ${cls}`}>{i+1}</span>
}

function GuiaItem({ title, icon, children, defaultOpen=false }: any) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{border:'1px solid rgba(212,175,55,0.25)',borderRadius:8,marginBottom:10,overflow:'hidden'}}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{width:'100%',background:'rgba(0,40,20,0.6)',border:'none',padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',gap:10}}
      >
        <span style={{display:'flex',alignItems:'center',gap:10,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:600,letterSpacing:1,color:'#D4AF37'}}>
          <span style={{fontSize:18}}>{icon}</span>{title}
        </span>
        <span style={{color:'#D4AF37',fontSize:16,transition:'transform .2s',display:'inline-block',transform:open?'rotate(180deg)':'rotate(0deg)'}}>▾</span>
      </button>
      {open && <div style={{padding:'16px 18px',background:'rgba(0,20,10,0.5)',borderTop:'1px solid rgba(212,175,55,0.15)'}}>{children}</div>}
    </div>
  )
}

function GuiaStep({ n, text }: {n:number, text:string}) {
  return (
    <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
      <span style={{background:'#D4AF37',color:'#001a0a',borderRadius:'50%',width:24,height:24,display:'inline-flex',alignItems:'center',justifyContent:'center',fontFamily:"'Bebas Neue'",fontSize:13,flexShrink:0}}>{n}</span>
      <span style={{fontSize:13,lineHeight:1.6,color:'#FAFAFA'}}>{text}</span>
    </div>
  )
}

// ── Podium animado ──────────────────────────────────────────────────────────
function PodiumDisplay({ players, scores }: { players: string[], scores: Record<string,number> }) {
  const sorted = [...players].sort((a,b)=>(scores[b]||0)-(scores[a]||0)).slice(0,3)
  const order = [sorted[1], sorted[0], sorted[2]] // prata, ouro, bronze
  const heights = [120, 160, 90]
  const medals = ['🥈','🥇','🥉']
  const colors = ['#9E9E9E','#D4AF37','#CD7F32']

  return (
    <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:8,padding:'20px 0 0',height:220}}>
      {order.map((name,i)=>{
        if(!name) return null
        const pts = scores[name]||0
        const initials = name.split(' ').map((w:string)=>w[0]).join('').substring(0,2).toUpperCase()
        return (
          <div key={name} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,animation:`podiumRise 0.6s ease ${i*0.15}s both`}}>
            <span style={{fontSize:22}}>{medals[i]}</span>
            <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${colors[i]},${colors[i]}88)`,border:`2px solid ${colors[i]}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#001a0a',fontFamily:"'Barlow Condensed',sans-serif"}}>{initials}</div>
            <div style={{fontSize:11,color:'#FAFAFA',fontWeight:600,textAlign:'center',maxWidth:70,lineHeight:1.2}}>{name.split(' ')[0]}</div>
            <div style={{width:70,height:heights[i],background:`linear-gradient(to top,${colors[i]}33,${colors[i]}11)`,border:`1px solid ${colors[i]}44`,borderRadius:'6px 6px 0 0',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:colors[i]}}>{pts}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Gráfico de evolução ─────────────────────────────────────────────────────
function EvolucaoChart({ history, players, C }: any) {
  if(!history||history.length===0) return <div style={{color:C.textMuted,fontSize:13,padding:'20px 0',textAlign:'center'}}>Nenhuma rodada finalizada ainda.</div>

  // Acumula pontos por rodada
  const accumulated: Record<string, number[]> = {}
  players.forEach((p:string) => { accumulated[p] = [] })

  let running: Record<string,number> = {}
  history.forEach((r:any) => {
    players.forEach((p:string) => {
      running[p] = (running[p]||0) + (r.scores?.[p]||0)
      accumulated[p].push(running[p])
    })
  })

  const maxVal = Math.max(...Object.values(accumulated).flat(), 1)
  const W = 300, H = 120
  const padL = 30, padB = 20, padT = 10, padR = 10
  const chartW = W - padL - padR
  const chartH = H - padB - padT

  const colors = ['#D4AF37','#00A651','#3498db','#e74c3c','#9b59b6','#e67e22','#1abc9c','#e91e63','#607d8b','#795548','#ff5722','#8bc34a','#03a9f4','#ff9800']

  const getX = (i:number) => padL + (i / Math.max(history.length-1,1)) * chartW
  const getY = (val:number) => padT + chartH - (val / maxVal) * chartH

  // Top 5 para não poluir
  const top5 = [...players].sort((a,b)=>(running[b]||0)-(running[a]||0)).slice(0,5)

  return (
    <div style={{overflowX:'auto'}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',maxWidth:W,display:'block'}}>
        {/* Grid lines */}
        {[0,0.25,0.5,0.75,1].map(t=>{
          const y = padT + chartH * (1-t)
          return <g key={t}>
            <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="rgba(212,175,55,0.1)" strokeWidth={0.5}/>
            <text x={padL-4} y={y+3} textAnchor="end" fontSize={6} fill="rgba(255,255,255,0.3)">{Math.round(maxVal*t)}</text>
          </g>
        })}
        {/* Rótulos rodadas */}
        {history.map((_:any,i:number)=>(
          <text key={i} x={getX(i)} y={H-4} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.3)">R{i+1}</text>
        ))}
        {/* Linhas dos jogadores */}
        {top5.map((p:string, pi:number)=>{
          const pts = accumulated[p]
          if(pts.length < 2) return null
          const d = pts.map((v,i)=>`${i===0?'M':'L'}${getX(i)},${getY(v)}`).join(' ')
          return <g key={p}>
            <path d={d} fill="none" stroke={colors[pi%colors.length]} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.85}/>
            <circle cx={getX(pts.length-1)} cy={getY(pts[pts.length-1])} r={3} fill={colors[pi%colors.length]}/>
          </g>
        })}
      </svg>
      {/* Legenda */}
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
        {top5.map((p:string,pi:number)=>(
          <div key={p} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.textMuted}}>
            <div style={{width:12,height:3,borderRadius:2,background:colors[pi%colors.length]}}/>
            {p.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pizza de distribuição de palpites ────────────────────────────────────────
function PizzaDistribuicao({ matches, palpites, C, dm }: any) {
  if(!matches||matches.length===0) return null

  // Agrega para o primeiro jogo com palpites (o mais relevante)
  const jogoComPalpites = matches.find((m:any)=>{
    return Object.values(palpites).some((p:any)=>p[m.id]&&p[m.id].h!=='')
  })
  if(!jogoComPalpites) return null

  const m = jogoComPalpites
  let homeWin=0, draw=0, awayWin=0, total=0
  Object.values(palpites).forEach((p:any)=>{
    const pal=p[m.id]
    if(!pal||pal.h==='') return
    const h=parseInt(pal.h), a=parseInt(pal.a)
    if(isNaN(h)||isNaN(a)) return
    total++
    if(h>a) homeWin++
    else if(h===a) draw++
    else awayWin++
  })
  if(total===0) return null

  const slices = [
    {label:m.home, val:homeWin, color:'#D4AF37'},
    {label:'Empate', val:draw, color:'#9b59b6'},
    {label:m.away, val:awayWin, color:'#3498db'},
  ].filter(s=>s.val>0)

  // SVG pizza simples
  const R=50, cx=60, cy=60
  let cumAngle = -Math.PI/2
  const paths: any[] = []
  slices.forEach(s=>{
    const angle = (s.val/total)*2*Math.PI
    const x1=cx+R*Math.cos(cumAngle), y1=cy+R*Math.sin(cumAngle)
    const x2=cx+R*Math.cos(cumAngle+angle), y2=cy+R*Math.sin(cumAngle+angle)
    const large=angle>Math.PI?1:0
    paths.push({...s, d:`M${cx},${cy} L${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} Z`, pct:Math.round(s.val/total*100)})
    cumAngle+=angle
  })

  return (
    <div className="card" style={{marginBottom:16}}>
      <div className="section-title" style={{fontSize:15,marginBottom:4}}>🗳 Distribuição de Palpites</div>
      <div style={{fontSize:11,color:C.textMuted,marginBottom:10}}>{m.home} × {m.away}</div>
      <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <svg viewBox="0 0 120 120" style={{width:100,height:100,flexShrink:0}}>
          {paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.9}/>)}
          <circle cx={cx} cy={cy} r={22} fill={dm?'#0a1f10':'#f0f7f0'}/>
          <text x={cx} y={cy+4} textAnchor="middle" fontSize={11} fontWeight="bold" fill={dm?'#D4AF37':'#005a2a'}>{total}</text>
        </svg>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {paths.map((p,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:10,height:10,borderRadius:2,background:p.color,flexShrink:0}}/>
              <span style={{fontSize:12,color:C.text}}>{p.label}</span>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:14,color:p.color,marginLeft:'auto'}}>{p.pct}%</span>
              <span style={{fontSize:11,color:C.textMuted}}>({p.val})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Heatmap de performance ───────────────────────────────────────────────────
function HeatmapPerformance({ player, history, C }: any) {
  if(!history||history.length===0) return (
    <div style={{fontSize:12,color:C.textMuted,padding:'8px 0'}}>Nenhuma rodada finalizada ainda.</div>
  )

  const maxPts = Math.max(...history.map((r:any)=>r.scores?.[player]||0), 1)

  function heatColor(pts: number): string {
    if(pts===0) return 'rgba(255,255,255,0.06)'
    const ratio = pts/maxPts
    if(ratio < 0.33) return '#c0392b'
    if(ratio < 0.66) return '#e67e22'
    if(ratio < 0.85) return '#f1c40f'
    return '#00c060'
  }

  const [tooltip, setTooltip] = useState<string|null>(null)

  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:C.textMuted,letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>🔥 Performance por Rodada</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
        {history.map((r:any,i:number)=>{
          const pts = r.scores?.[player]||0
          const color = heatColor(pts)
          const label = `${r.roundName||`R${i+1}`} · ${pts} pts`
          return (
            <div key={i} title={label}
              onMouseEnter={()=>setTooltip(label)}
              onMouseLeave={()=>setTooltip(null)}
              onTouchStart={()=>setTooltip(label)}
              onTouchEnd={()=>setTimeout(()=>setTooltip(null),1500)}
              style={{
                width:28,height:28,borderRadius:4,background:color,
                display:'flex',alignItems:'center',justifyContent:'center',
                cursor:'default',transition:'transform .1s',
                fontSize:9,fontWeight:700,color:'rgba(0,0,0,.6)',
                fontFamily:"'Bebas Neue'"
              }}>
              R{i+1}
            </div>
          )
        })}
      </div>
      {tooltip && (
        <div style={{fontSize:11,color:C.gold,marginTop:6,fontFamily:"'Barlow Condensed'",letterSpacing:1}}>{tooltip}</div>
      )}
      <div style={{display:'flex',gap:8,marginTop:6,alignItems:'center'}}>
        {[{c:'#c0392b',l:'Ruim'},{c:'#e67e22',l:'OK'},{c:'#f1c40f',l:'Bom'},{c:'#00c060',l:'Ótimo'}].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:3,fontSize:10,color:C.textMuted}}>
            <div style={{width:8,height:8,borderRadius:2,background:c}}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Estatísticas pessoais ───────────────────────────────────────────────────
function EstatisticasPessoais({ player, history, C }: any) {
  let totalJogos = 0, exatos = 0, vencedor = 0, saldo = 0, rodadas = 0

  history.forEach((r:any) => {
    if(r.scores?.[player] !== undefined) rodadas++
    if(r.tiebreak?.[player]) {
      const t = r.tiebreak[player]
      exatos  += t.exact   || 0
      vencedor+= t.correct || 0  // correct = acertou vencedor (inclui exatos)
      saldo   += t.saldo   || 0  // saldo = acertou saldo mas não exato
      totalJogos += (t.exact||0) + (t.correct||0) + (t.saldo||0)
    }
  })

  // % sobre total de jogos participados (estimado como rodadas * 2 jogos médios)
  const totalEstimado = Math.max(rodadas * 2, 1)
  const pctExato    = Math.round((exatos   / totalEstimado) * 100)
  const pctVencedor = Math.round((vencedor / totalEstimado) * 100)
  const pctSaldo    = Math.round((saldo    / totalEstimado) * 100)

  // Conquistas
  const conquistas = []
  if(exatos   >= 1)  conquistas.push({icon:'🎯', label:'Sniper',      desc:'1+ placar exato'})
  if(exatos   >= 5)  conquistas.push({icon:'🔥', label:'Em Chamas',   desc:'5+ placares exatos'})
  if(rodadas  >= 3)  conquistas.push({icon:'💪', label:'Veterano',    desc:'3+ rodadas'})
  if(vencedor >= 10) conquistas.push({icon:'⚡', label:'Consistente', desc:'10+ vencedores certos'})
  if(saldo    >= 5)  conquistas.push({icon:'📐', label:'Calculista',  desc:'5+ saldos acertados'})

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
        <div style={{background:'rgba(0,50,25,0.5)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:8,padding:'12px 8px',textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:C.gold,lineHeight:1}}>{rodadas}</div>
          <div style={{fontSize:9,color:C.textMuted,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>Rodadas</div>
        </div>
        <div style={{background:'rgba(0,50,25,0.5)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:8,padding:'12px 8px',textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:'#00c060',lineHeight:1}}>{exatos}</div>
          <div style={{fontSize:9,color:C.textMuted,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>Exatos</div>
        </div>
        <div style={{background:'rgba(0,50,25,0.5)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:8,padding:'12px 8px',textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:'#3498db',lineHeight:1}}>{vencedor}</div>
          <div style={{fontSize:9,color:C.textMuted,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>Vencedor</div>
        </div>
        <div style={{background:'rgba(0,50,25,0.5)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:8,padding:'12px 8px',textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:'#e67e22',lineHeight:1}}>{saldo}</div>
          <div style={{fontSize:9,color:C.textMuted,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>Saldo</div>
        </div>
      </div>

      {/* Heatmap de performance */}
      <HeatmapPerformance player={player} history={history} C={C}/>

      {/* Barras de % */}
      {[
        {label:'% Placar exato',   pct:pctExato,    color:'#D4AF37,#F0D060'},
        {label:'% Acertei o vencedor', pct:pctVencedor, color:'#3498db,#5dade2'},
        {label:'% Ganhei por saldo',   pct:pctSaldo,    color:'#e67e22,#f39c12'},
      ].map(({label,pct,color})=>(
        <div key={label} style={{marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.textMuted,marginBottom:4}}>
            <span>{label}</span><span style={{color:`#${color.split(',')[0].replace('#','')}`}}>{pct}%</span>
          </div>
          <div style={{height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(to right,${color})`,borderRadius:3,transition:'width 1s ease'}}/>
          </div>
        </div>
      ))}

      {/* Conquistas */}
      {conquistas.length > 0 && (
        <div style={{marginTop:6}}>
          <div style={{fontSize:11,color:C.textMuted,letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>🏅 Conquistas</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {conquistas.map((c,i)=>(
              <div key={i} style={{background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.3)',borderRadius:6,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:16}}>{c.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:C.gold}}>{c.label}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {conquistas.length === 0 && rodadas === 0 && (
        <div style={{fontSize:12,color:C.textMuted,textAlign:'center',padding:'10px 0'}}>Participe das rodadas para desbloquear conquistas! 🏅</div>
      )}
    </div>
  )
}

// ── Timer visual ────────────────────────────────────────────────────────────
function CountdownTimer({ diffMs, C }: { diffMs: number, C: any }) {
  const hours = Math.floor(diffMs / 3600000)
  const mins = Math.floor((diffMs % 3600000) / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  const urgent = diffMs < 30 * 60 * 1000 // menos de 30min

  if(diffMs <= 0) return null

  return (
    <div style={{
      display:'inline-flex',alignItems:'center',gap:6,
      background: urgent ? 'rgba(192,57,43,0.2)' : 'rgba(212,175,55,0.1)',
      border: `1px solid ${urgent ? 'rgba(192,57,43,0.5)' : 'rgba(212,175,55,0.3)'}`,
      borderRadius:6, padding:'4px 10px', fontSize:13,
      color: urgent ? '#e74c3c' : C.gold,
      fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1,
      animation: urgent ? 'pulse 1s ease infinite' : 'none'
    }}>
      {urgent ? '🔴' : '⏱'}
      {hours > 0 ? `${hours}h ${mins}min` : mins > 0 ? `${mins}min ${secs}s` : `${secs}s`}
    </div>
  )
}

export default function Home() {
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<string|null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [darkMode, setDarkMode] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetMasterConfirm, setResetMasterConfirm] = useState('')
  const [adminPassInput, setAdminPassInput] = useState('')
  const [modalError, setModalError] = useState('')
  const [notif, setNotif] = useState<{msg:string,type:string}|null>(null)
  const [authPassword, setAuthPassword] = useState('')
  const [localPalpites, setLocalPalpites] = useState<any>({})
  const [adminBuf, setAdminBuf] = useState<any>({})
  const [resultInputs, setResultInputs] = useState<any>({})
  const [extraResults, setExtraResults] = useState<any>({})
  const [corrOpen, setCorrOpen] = useState<any>({})
  const [manualPts, setManualPts] = useState<any>({})
  const [selectedCorrPlayer, setSelectedCorrPlayer] = useState<string|null>(null)
  const [scoringPhases, setScoringPhases] = useState<any[]>([])
  const [multipliersBuf, setMultipliersBuf] = useState<any>({})
  const [shamePlayer, setShamePlayer] = useState('')
  const [shameUrl, setShameUrl] = useState('')
  const [shameText, setShameText] = useState('')
  const [newPass, setNewPass] = useState('')
  const [masterConf, setMasterConf] = useState('')
  const [showNovidade, setShowNovidade] = useState(false)
  const [novidadeAtual, setNovidadeAtual] = useState<any>(null)
  const [novidadeBuf, setNovidadeBuf] = useState({titulo:'', resumo:''})
  const [adminsBuf, setAdminsBuf] = useState<any[]>([])
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMsg, setNotifMsg] = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [pushStatus, setPushStatus] = useState<'unknown'|'granted'|'denied'|'default'>('unknown')
  const [compareTarget, setCompareTarget] = useState<string|null>(null)
  const [projWindow, setProjWindow] = useState<number>(3) // janela de projeção em rodadas
  const [chatMsg, setChatMsg] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatLoading, setChatLoading] = useState(false)


  const chatEndRef = useRef<any>(null)
  const notifTimer = useRef<any>(null)

  // Tick a cada segundo para countdowns
  const [, setTick] = useState(0)
  useEffect(()=>{ const t=setInterval(()=>setTick(n=>n+1),1000); return()=>clearInterval(t) },[])

  const showNotif = useCallback((msg: string, type='success') => {
    if(notifTimer.current) clearTimeout(notifTimer.current)
    setNotif({msg,type})
    notifTimer.current = setTimeout(()=>setNotif(null),3500)
  },[])

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state')
      const json = await res.json()
      const s = json.state || defaultState()
      if(!s.adminPass) s.adminPass='Copa2026!'
      if(!s.shame) s.shame={player:'',photoUrl:'',text:''}
      if(s.palpitesOpen===undefined) s.palpitesOpen=true
      if(!s.roundFinalized) s.roundFinalized=false
      if(!s.scoringPhases) s.scoringPhases=defaultScoringPhases()
      if(!s.roundHistory) s.roundHistory=[]
      if(!s.correctedScores) s.correctedScores={}
      if(!s.totalPoints) s.totalPoints={}
      if(!s.palpites) s.palpites={}
      if(!s.results) s.results={}
      if(!s.multipliers) s.multipliers=defaultMultipliers()
      if(!s.novidades) s.novidades=[]
      if(!s.admins) s.admins=[]
      if(!s.adminLog) s.adminLog=[]
      if(s.round?.matches) {
        s.round.matches = s.round.matches.map((m:any)=>({
          date: m.date ?? '',
          locked: m.locked ?? false,
          hasQuemAvanca: m.hasQuemAvanca ?? false,
          hasPenaltis: m.hasPenaltis ?? false,
          ...m
        }))
      } else {
        s.round = s.round || { name:'', phase:'grupos', number:1, matches:[] }
      }
      setState(s)

      // ── Sincroniza localPalpites quando o estado muda (CORREÇÃO #1) ──
      setLocalPalpites((prev: any) => {
        if(!s.round?.matches?.length) return prev
        const updated = {...prev}
        s.round.matches.forEach((m: any) => {
          const existing = prev[m.id] || {}
          updated[m.id] = {
            h: existing.h ?? '',
            a: existing.a ?? '',
            quemAvanca: existing.quemAvanca ?? '',
            penaltis: existing.penaltis ?? '',
          }
        })
        return updated
      })
    } catch { setState(defaultState()) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ fetchState() },[fetchState])
  useEffect(()=>{ const t=setInterval(fetchState,30000); return()=>clearInterval(t) },[fetchState])

  function addAdminLog(newState: any, action: string) {
    if(!newState.adminLog) newState.adminLog=[]
    newState.adminLog.unshift({
      ts: new Date().toISOString(),
      action,
    })
    // manter só os últimos 50 logs
    if(newState.adminLog.length > 50) newState.adminLog = newState.adminLog.slice(0,50)
  }

  const saveState = useCallback(async (newState: any, password: string, logAction?: string) => {
    setSaving(true)
    try {
      if(logAction) addAdminLog(newState, logAction)
      const res = await fetch('/api/state',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({state:newState, password})
      })
      if(!res.ok) throw new Error()
      setState(newState)
    } catch { showNotif('Erro ao salvar!','error') }
    finally { setSaving(false) }
  },[showNotif])

  function loginAsPlayer(name: string) {
    setCurrentUser(name); setIsAdmin(false); setAuthPassword(''); setActiveTab('home')
    if(state) {
      const myPal = state.palpites[name]||{}
      const local: any={}
      state.round.matches.forEach((m:any)=>{
        local[m.id]=myPal[m.id]||{h:'',a:'',quemAvanca:'',penaltis:''}
      })
      setLocalPalpites(local)
      const novs: any[] = state.novidades||[]
      if(novs.length > 0) {
        const latest = novs[novs.length-1]
        const seen = localStorage.getItem('palpitao_novidade_seen')
        if(seen !== latest.id) {
          setNovidadeAtual(latest)
          setShowNovidade(true)
        }
      }
    }
  }

  function checkAdminPass() {
    if(!state) return
    if(adminPassInput===MASTER_PASS||adminPassInput===state.adminPass) {
      setAuthPassword(adminPassInput); setCurrentUser('Administração'); setIsAdmin(true)
      setShowModal(false); setAdminPassInput(''); setModalError(''); setActiveTab('home')
      setAdminBuf({ name:state.round.name, phase:state.round.phase, number:state.round.number||1, open:state.palpitesOpen, matches:JSON.parse(JSON.stringify(state.round.matches)) })
      setScoringPhases(JSON.parse(JSON.stringify(state.scoringPhases)))
      setMultipliersBuf(JSON.parse(JSON.stringify(state.multipliers||defaultMultipliers())))
      setShamePlayer(state.shame.player); setShameUrl(state.shame.photoUrl); setShameText(state.shame.text||'')
      setAdminsBuf(JSON.parse(JSON.stringify(state.admins||[])))
      const ri:any={}; const er:any={}
      state.round.matches.forEach((m:any)=>{
        ri[m.id]=state.results[m.id]||{h:'',a:''}
        er[m.id]=state.results[m.id]?.extra||{quemAvanca:'',foiPenaltis:false}
      })
      setResultInputs(ri); setExtraResults(er)
    } else { setModalError('Senha incorreta.') }
  }

  function logout() { setCurrentUser(null); setIsAdmin(false); setAuthPassword(''); setActiveTab('home') }

  function getCurrentPhase(s: any) {
    return s.scoringPhases.find((p:any)=>p.name.toLowerCase().includes(s.round.phase))||s.scoringPhases[0]
  }

  function getMultiplier(s: any) { return PHASE_MULTIPLIERS[s.round.phase]??1 }

  function parcialData(s: any) {
    return PLAYERS.map(p=>({
      name: p,
      roundPts: Object.values(s.correctedScores[p]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number,
      total: s.totalPoints[p]||0,
      hasPal: s.palpites[p]&&Object.keys(s.palpites[p]).length>0,
    })).sort((a,b)=>{
      if(b.roundPts !== a.roundPts) return b.roundPts - a.roundPts
      return b.total - a.total
    })
  }

  function rankingData(s: any) {
    return PLAYERS.map(p=>({
      name:p, total:s.totalPoints[p]||0,
      rodadas:s.roundHistory.filter((r:any)=>r.scores&&r.scores[p]!==undefined).length,
      exact:   s.roundHistory.reduce((acc:number,r:any)=>acc+(r.tiebreak?.[p]?.exact||0),0),
      vencedor:s.roundHistory.reduce((acc:number,r:any)=>acc+(r.tiebreak?.[p]?.correct||0),0),
      saldo:   s.roundHistory.reduce((acc:number,r:any)=>acc+(r.tiebreak?.[p]?.saldo||0),0),
    })).sort((a:any,b:any)=>{
      if(b.total!==a.total) return b.total-a.total
      if(b.exact!==a.exact) return b.exact-a.exact
      return b.vencedor-a.vencedor
    })
  }

  async function savePalpites() {
    if(!state||!currentUser) return
    if(!state.palpitesOpen){showNotif('Palpites bloqueados!','error');return}
    const newState = JSON.parse(JSON.stringify(state))
    if(!newState.palpites[currentUser]) newState.palpites[currentUser]={}
    state.round.matches.forEach((m:any, idx:number)=>{
      if(isMatchLocked(m,idx)) return
      const pal=localPalpites[m.id]||{h:'',a:'',quemAvanca:'',penaltis:''}
      newState.palpites[currentUser][m.id]=pal
    })
    newState.palpiteTimes[currentUser]=new Date().toISOString()
    await saveState(newState, authPassword||MASTER_PASS)
    showNotif('Palpites salvos! ★')
  }

  async function saveRoundConfig() {
    if(!state) return
    const newState = JSON.parse(JSON.stringify(state))
    newState.round.name=adminBuf.name; newState.round.phase=adminBuf.phase; newState.round.number=adminBuf.number||1
    newState.palpitesOpen=adminBuf.open; newState.round.matches=adminBuf.matches
    newState.roundFinalized=false
    await saveState(newState, authPassword, `Rodada salva: "${adminBuf.name}"`)
    showNotif('Rodada salva!')
    const ri:any={}; const er:any={}
    adminBuf.matches.forEach((m:any)=>{
      ri[m.id]=newState.results[m.id]||{h:'',a:''}
      er[m.id]=newState.results[m.id]?.extra||{quemAvanca:'',foiPenaltis:false}
    })
    setResultInputs(ri); setExtraResults(er)
  }

  async function applyCorrection() {
    if(!state) return
    const newState = JSON.parse(JSON.stringify(state))
    const phase = getCurrentPhase(newState)
    const mult = getMultiplier(newState)
    const scoreMult = newState.multipliers||defaultMultipliers()
    state.round.matches.forEach((m:any)=>{
      const r=resultInputs[m.id]
      if(r&&r.h!==''&&r.a!=='') newState.results[m.id]={...r, extra:extraResults[m.id]||{quemAvanca:'',foiPenaltis:false}}
    })
    PLAYERS.forEach(p=>{
      if(!newState.correctedScores[p]) newState.correctedScores[p]={}
      newState.round.matches.forEach((m:any)=>{
        const pal=newState.palpites[p]?.[m.id]
        const res=newState.results[m.id]
        if(pal&&res){
          const pts=calcPoints(pal,res,phase,mult,m,res.extra,scoreMult)
          if(pts!==null) newState.correctedScores[p][m.id]=pts
        }
      })
    })
    await saveState(newState, authPassword, `Pontuação calculada automaticamente — ${state.round.name||'rodada atual'}`); showNotif('Pontuação calculada! ⚡')
  }

  async function applyManualPts(player: string, matchId: string) {
    if(!state) return
    const key=`${player}-${matchId}`; const val=parseInt(manualPts[key]||'')
    if(isNaN(val)) return
    const newState=JSON.parse(JSON.stringify(state))
    if(!newState.correctedScores[player]) newState.correctedScores[player]={}
    newState.correctedScores[player][matchId]=val
    await saveState(newState, authPassword, `Correção manual: ${player} → ${val}pts no jogo ${matchId}`); showNotif('Pts manuais salvos!')
  }

  async function finalizeRound() {
    if(!state||!confirm('Finalizar a rodada? Pontuações serão registradas.')) return
    const newState=JSON.parse(JSON.stringify(state))
    const scores:any={}; const tiebreak:any={}
    PLAYERS.forEach(p=>{
      scores[p]=Object.values(newState.correctedScores[p]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number
      newState.totalPoints[p]=(newState.totalPoints[p]||0)+scores[p]
      let exact=0, correct=0
      newState.round.matches.forEach((m:any)=>{
        const pal=newState.palpites[p]?.[m.id]; const res=newState.results[m.id]
        if(pal&&res&&res.h!==''&&res.a!==''){
          const ph=parseInt(pal.h),pa=parseInt(pal.a),rh=parseInt(res.h),ra=parseInt(res.a)
          if(!isNaN(ph)&&!isNaN(pa)&&!isNaN(rh)&&!isNaN(ra)){
            if(ph===rh&&pa===ra) { exact++; correct++ }
            else if((ph-pa)===(rh-ra)) correct++
            else { const pw=ph>pa?1:ph<pa?-1:0,rw=rh>ra?1:rh<ra?-1:0; if(pw===rw) correct++ }
          }
        }
      })
      tiebreak[p]={exact,correct}
    })
    newState.roundHistory.push({roundName:newState.round.name,scores,tiebreak})
    newState.palpites={}; newState.palpiteTimes={}; newState.correctedScores={}; newState.results={}
    newState.roundFinalized=true; newState.round.name=''; newState.round.matches=[]
    await saveState(newState, authPassword, `Rodada finalizada: "${newState.roundHistory[newState.roundHistory.length-1]?.roundName||'rodada'}"`); showNotif('Rodada finalizada! 🏆')
  }

  async function clearPalpites() {
    if(!state||!confirm('Limpar todos os palpites?')) return
    const newState=JSON.parse(JSON.stringify(state))
    newState.palpites={}; newState.palpiteTimes={}; newState.correctedScores={}
    await saveState(newState, authPassword); showNotif('Palpites limpos.','error')
  }

  async function resetAll() {
    if(!state) return
    if(resetConfirm !== 'ZERAR') { showNotif('Digite ZERAR para confirmar','error'); return }
    if(resetMasterConfirm !== MASTER_PASS) { showNotif('Senha master incorreta!','error'); return }
    const fresh = defaultState()
    fresh.adminPass = state.adminPass
    fresh.scoringPhases = state.scoringPhases
    fresh.multipliers = state.multipliers
    await saveState(fresh, authPassword)
    setShowResetModal(false); setResetConfirm(''); setResetMasterConfirm('')
    showNotif('Dados zerados com sucesso!', 'error')
  }

  async function saveScoringConfig() {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state))
    newState.scoringPhases=scoringPhases; newState.multipliers=multipliersBuf
    await saveState(newState, authPassword); showNotif('Pontuação salva!')
  }

  async function saveAdmins() {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state))
    newState.admins=adminsBuf
    await saveState(newState, authPassword); showNotif('Admins salvos!')
  }

  async function saveShame() {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state))
    newState.shame={player:shamePlayer,photoUrl:shameUrl,text:shameText}
    await saveState(newState, authPassword); showNotif('Salvo!')
  }

  // Push status via OneSignal (CORREÇÃO #3 — com timeout para iPhone)
  useEffect(()=>{
    if(typeof window === 'undefined') return
    const win = window as any

    // Timeout de 2s: se não resolver, mostra botão direto (contorna iPhone Safari)
    const fallbackTimer = setTimeout(()=>{
      setPushStatus(s => s === 'unknown' ? 'default' : s)
    }, 2000)

    // Checa permissão nativa imediatamente
    try {
      if(typeof Notification !== 'undefined') {
        if(Notification.permission === 'granted') { setPushStatus('granted'); clearTimeout(fallbackTimer) }
        else if(Notification.permission === 'denied') { setPushStatus('denied'); clearTimeout(fallbackTimer) }
        else { setPushStatus('default'); clearTimeout(fallbackTimer) }
      }
    } catch { /* Safari pode não ter Notification */ }

    // Refina com OneSignal se disponível
    win.OneSignalDeferred = win.OneSignalDeferred || []
    win.OneSignalDeferred.push(function(OneSignal: any) {
      try {
        clearTimeout(fallbackTimer)
        if(OneSignal.Notifications.permission === true) setPushStatus('granted')
        else if(typeof Notification !== 'undefined' && Notification.permission === 'denied') setPushStatus('denied')
        else setPushStatus('default')
      } catch { setPushStatus('default') }
    })

    return () => clearTimeout(fallbackTimer)
  },[])

  async function requestPushPermission() {
    if(typeof window === 'undefined') return
    const win = window as any
    if(win.OneSignalDeferred) {
      win.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.Notifications.requestPermission()
          if(OneSignal.Notifications.permission === true) {
            setPushStatus('granted')
            showNotif('Notificações ativadas! 🔔', 'success')
          } else {
            setPushStatus('denied')
          }
        } catch (error) {
          console.error("Erro no OneSignal:", error)
        }
      })
    }
  }

  async function sendPushNotification() {
    if(!notifTitle.trim()||!notifMsg.trim()) { showNotif('Preencha título e mensagem','error'); return }
    setNotifSending(true)
    try {
      const res = await fetch('/api/notify', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ title: notifTitle, message: notifMsg, password: authPassword })
      })
      const data = await res.json()
      if(data.ok) { showNotif(`Notificação enviada para ${data.recipients} pessoas! 🔔`); setNotifTitle(''); setNotifMsg('') }
      else showNotif('Erro ao enviar notificação','error')
    } catch { showNotif('Erro ao enviar notificação','error') }
    finally { setNotifSending(false) }
  }

  async function saveNovidade() {
    if(!state||!novidadeBuf.titulo.trim()) return
    const newState=JSON.parse(JSON.stringify(state))
    if(!newState.novidades) newState.novidades=[]
    newState.novidades.push({
      id: 'nov_'+Date.now(),
      titulo: novidadeBuf.titulo.trim(),
      resumo: novidadeBuf.resumo.trim(),
      data: new Date().toLocaleDateString('pt-BR')
    })
    await saveState(newState, authPassword)
    setNovidadeBuf({titulo:'', resumo:''})
    showNotif('Novidade publicada! 🆕')
  }

  async function removeNovidade(id: string) {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state))
    newState.novidades=(newState.novidades||[]).filter((n:any)=>n.id!==id)
    await saveState(newState, authPassword)
    showNotif('Novidade removida.')
  }

  async function changeAdminPass() {
    if(!state) return
    if(masterConf!==MASTER_PASS){showNotif('Senha master incorreta!','error');return}
    if(newPass.length<4){showNotif('Senha muito curta!','error');return}
    const newState=JSON.parse(JSON.stringify(state)); newState.adminPass=newPass
    await saveState(newState, authPassword); setAuthPassword(newPass); setNewPass(''); setMasterConf(''); showNotif('Senha alterada!')
  }

  // ── Chat via Supabase ────────────────────────────────────────────────────
  const fetchChat = useCallback(async (roundName: string) => {
    try {
      const res = await fetch(`/api/chat?round=${encodeURIComponent(roundName||'geral')}`)
      const json = await res.json()
      if(json.messages) setChatMessages(json.messages)
    } catch {}
  }, [])

  useEffect(()=>{
    if(activeTab==='chat' && state) {
      fetchChat(state.round?.name || 'geral')
      const t = setInterval(()=>fetchChat(state.round?.name || 'geral'), 5000)
      return ()=>clearInterval(t)
    }
  },[activeTab, fetchChat, state])

  useEffect(()=>{
    if(chatEndRef.current) chatEndRef.current.scrollIntoView({behavior:'smooth'})
  },[chatMessages])

  async function sendChatMsg() {
    if(!chatMsg.trim()||!currentUser||!state) return
    const text = chatMsg.trim()
    setChatMsg('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ user: currentUser, text, round: state.round?.name||'geral' })
      })
      const json = await res.json()
      if(json.message) setChatMessages(prev=>[...prev, json.message])
    } catch {}
  }

  async function toggleChatReaction(msgId: string, emoji: string) {
    if(!currentUser) return
    const msg = chatMessages.find((m:any)=>m.id===msgId)
    if(!msg) return
    const cur: string[] = msg.reactions?.[emoji] || []
    const already = cur.includes(currentUser)
    const updated = already ? cur.filter((u:string)=>u!==currentUser) : [...cur, currentUser]
    const newReactions = {...msg.reactions, [emoji]: updated}
    // Otimista: atualiza local primeiro
    setChatMessages(prev=>prev.map((m:any)=>m.id===msgId?{...m,reactions:newReactions}:m))
    try {
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id: msgId, reactions: newReactions })
      })
    } catch {}
  }

  async function clearChat() {
    if(!state||!confirm('Limpar todo o chat desta rodada?')) return
    try {
      await fetch(`/api/chat?round=${encodeURIComponent(state.round?.name||'geral')}`, {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ password: authPassword||MASTER_PASS })
      })
      setChatMessages([])
      showNotif('Chat limpo!')
    } catch { showNotif('Erro ao limpar chat','error') }
  }

  // ── Projeção de campeão (%) ──────────────────────────────────────────────
  function calcProjecaoPct(s: any, windowSize: number): Record<string, number|null> {
    const hist = s.roundHistory
    if(hist.length < 2) return {}  // menos de 2 rodadas = sem dados
    const lastN = windowSize === 0 ? hist.length : Math.min(windowSize, hist.length)
    const recent = hist.slice(-lastN)
    const projecoes: Record<string,number> = {}
    PLAYERS.forEach(p => {
      const media = recent.reduce((acc:number,r:any)=>acc+(r.scores?.[p]||0),0) / lastN
      const totalAtual = s.totalPoints[p]||0
      const rodadasRestantes = Math.max(hist.length, 2)
      projecoes[p] = totalAtual + media * rodadasRestantes
    })
    const total = Object.values(projecoes).reduce((a,b)=>a+b, 0)
    if(total === 0) return {}
    const result: Record<string,number> = {}
    PLAYERS.forEach(p => { result[p] = Math.round((projecoes[p]/total)*100) })
    return result
  }

  // Compartilhar ranking ou parcial via WhatsApp (só admin)
  function shareRanking(tipo: 'geral'|'parcial') {
    if(!state) return
    const medals = ['🥇','🥈','🥉']
    let text = ''
    if(tipo === 'geral') {
      const sorted = rankingData(state)
      text = `🏆 *Palpitão Copa do Mundo*\n📊 *Ranking Geral*\n\n`
      sorted.slice(0,5).forEach((p:any,i:number)=>{
        text += `${medals[i]||`${i+1}.`} ${p.name} — ${p.total} pts\n`
      })
    } else {
      const parc = parcialData(state)
      text = `🏆 *Palpitão Copa do Mundo*\n⚽ *Parcial — ${state.round.name || 'Rodada Atual'}*\n\n`
      parc.slice(0,5).forEach((p:any,i:number)=>{
        const pts = p.roundPts > 0 ? `${p.roundPts} pts` : p.hasPal ? 'aguardando' : 'NP'
        text += `${medals[i]||`${i+1}.`} ${p.name} — ${pts}\n`
      })
    }
    text += `\n👉 Confira a tabela completa no nosso AppWeb!`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#001a0a',color:'#D4AF37',fontFamily:'Barlow,sans-serif',fontSize:18}}>Carregando Palpitão...</div>
  if(!state) return null

  const sorted = rankingData(state)
  const parcial = parcialData(state)
  const palpitaramCount = PLAYERS.filter(p=>state.palpites[p]&&Object.keys(state.palpites[p]).length>0).length
  const mult = getMultiplier(state)
  const dm = darkMode

  const C = dm ? {
    bg:'#001a0a', bgPanel:'rgba(0,30,15,0.85)', bgCard:'rgba(0,50,25,0.7)',
    bgRow:'rgba(0,20,10,0.5)', bgInput:'rgba(0,40,20,0.8)', bgStat:'rgba(0,50,25,0.5)',
    bgMatchCard:'rgba(0,30,15,0.7)', bgTabsNav:'rgba(0,20,10,0.5)',
    bgTableHead:'rgba(0,40,20,0.9)', bgAdminCard:'rgba(0,20,10,0.6)',
    border:'rgba(212,175,55,0.4)', borderFaint:'rgba(212,175,55,0.15)',
    text:'#FAFAFA', textMuted:'#B0A080', textSub:'rgba(255,255,255,0.2)',
    gold:'#D4AF37', goldLight:'#F0D060', goldDark:'#A07820',
    red:'#C0392B', green:'#00A651',
    shadow:'0 2px 16px rgba(0,0,0,0.6)', headerBg:'transparent',
  } : {
    bg:'#f0f4f0', bgPanel:'rgba(255,255,255,0.95)', bgCard:'rgba(255,255,255,0.9)',
    bgRow:'rgba(240,248,240,0.8)', bgInput:'rgba(230,245,230,0.9)', bgStat:'rgba(255,255,255,0.9)',
    bgMatchCard:'rgba(255,255,255,0.85)', bgTabsNav:'rgba(220,240,220,0.7)',
    bgTableHead:'rgba(10,80,40,0.9)', bgAdminCard:'rgba(240,250,240,0.8)',
    border:'rgba(0,100,50,0.35)', borderFaint:'rgba(0,100,50,0.15)',
    text:'#0a1a0a', textMuted:'#4a6a4a', textSub:'rgba(0,0,0,0.2)',
    gold:'#8a6800', goldLight:'#b08800', goldDark:'#6a5000',
    red:'#c0392b', green:'#007a30',
    shadow:'0 2px 16px rgba(0,0,0,0.12)', headerBg:'rgba(0,60,20,0.95)',
  }

  const guideTextStyle = {fontSize:13,lineHeight:1.7,color:C.text}
  const guideTipStyle = {background:dm?'rgba(212,175,55,0.08)':'rgba(212,175,55,0.12)',border:`1px solid rgba(212,175,55,0.25)`,borderRadius:6,padding:'10px 14px',fontSize:12,color:C.textMuted,marginTop:10}
  const guideHighlight = {color:C.gold,fontWeight:600}

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500;600&display=swap');
        :root{
          --gold:${C.gold};--gold-light:${C.goldLight};--gold-dark:${C.goldDark};
          --green-mid:#006633;--bg-panel:${C.bgPanel};--bg-card:${C.bgCard};
          --border-gold:1px solid ${C.border};--text-light:${C.text};--text-muted:${C.textMuted};
          --red:${C.red};--green-bright:${C.green};--radius:8px;
        }
        *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        button,input,select,textarea{touch-action:manipulation;-webkit-appearance:none;appearance:none;font-family:inherit;font-size:16px;}
        html{overflow-x:hidden;}
        body{font-family:'Barlow',sans-serif;background:${C.bg};color:${C.text};min-height:100vh;overflow-x:hidden;max-width:100%;transition:background .3s,color .3s;background-attachment:fixed;}
        ${dm?`body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 20%,rgba(0,100,50,.25) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(0,40,100,.2) 0%,transparent 50%);pointer-events:none;z-index:0;background-attachment:fixed;}
        body::after{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 15 L60 37 L30 52 L0 37 L0 15Z' fill='none' stroke='rgba(212,175,55,0.04)' stroke-width='1'/%3E%3C/svg%3E");background-size:60px 52px;pointer-events:none;z-index:0;}`:''}
        .app{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:0 16px 60px;}
        header{text-align:center;padding:20px 16px 16px;border-bottom:var(--border-gold);max-width:1200px;margin:0 auto;box-sizing:border-box;background:${C.headerBg};}
        .header-badge{display:inline-block;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--gold);border:1px solid var(--gold-dark);padding:3px 12px;border-radius:20px;margin-bottom:8px;}
        header h1{font-family:'Bebas Neue',sans-serif;letter-spacing:4px;line-height:1;margin-bottom:4px;display:flex;flex-direction:column;align-items:center;gap:2px;}
        .h1-main{font-size:clamp(28px,5vw,48px);color:${dm?'#FAFAFA':'#fff'};}
        .h1-sub{font-size:clamp(42px,8vw,80px);color:${dm?C.gold:'#F0D060'};letter-spacing:4px;}
        .header-sub{font-size:12px;color:${dm?C.textMuted:'rgba(255,255,255,0.7)'};letter-spacing:2px;text-transform:uppercase;font-weight:300;}
        .trophy-line{display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 0 0;font-size:16px;overflow:hidden;}
        .theme-btn{position:absolute;right:16px;top:20px;background:${dm?'rgba(0,50,25,0.6)':'rgba(255,255,255,0.2)'};border:1px solid ${dm?C.border:'rgba(255,255,255,0.3)'};color:${dm?C.gold:'#fff'};font-size:16px;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;}
        #login-screen{min-height:calc(100vh - 120px);display:flex;align-items:center;justify-content:center;}
        .login-box{background:${C.bgPanel};border:var(--border-gold);border-radius:16px;padding:24px 20px;width:100%;max-width:420px;text-align:center;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}
        .login-box h2{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:3px;color:var(--gold);margin-bottom:6px;}
        .login-box p{font-size:12px;color:var(--text-muted);margin-bottom:18px;}
        .player-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px;}
        .player-btn{background:${dm?'rgba(0,60,30,.6)':'rgba(0,80,40,.08)'};border:1px solid ${dm?'rgba(212,175,55,.25)':C.border};color:${C.text};font-size:13px;font-weight:500;padding:10px 8px;border-radius:6px;cursor:pointer;transition:all .2s;width:100%;}
        .player-btn:active{background:${dm?'rgba(0,100,50,.6)':'rgba(0,100,50,.15)'};border-color:var(--gold);color:var(--gold);}
        .admin-login-btn{width:100%;background:transparent;border:1px solid ${dm?'rgba(212,175,55,.3)':C.border};color:var(--text-muted);font-size:12px;padding:8px;border-radius:6px;cursor:pointer;margin-top:8px;letter-spacing:1px;}
        .modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1000;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}
        .modal-overlay.open{display:flex;}
        .modal{background:${dm?'#001a0a':C.bgPanel};border:var(--border-gold);border-radius:12px;padding:28px 22px;width:92%;max-width:360px;text-align:center;}
        .modal h3{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;}
        .modal p{font-size:13px;color:var(--text-muted);margin-bottom:18px;}
        .modal input{width:100%;background:${C.bgInput};border:1px solid ${dm?'rgba(212,175,55,.3)':C.border};color:${C.text};font-size:15px;padding:12px 16px;border-radius:6px;margin-bottom:12px;outline:none;text-align:center;letter-spacing:2px;}
        .modal-btns{display:flex;gap:10px;}
        .modal-error{font-size:12px;color:#e74c3c;margin-top:6px;min-height:16px;}
        .btn-primary{flex:1;background:var(--gold);color:#001a0a;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;padding:12px;border-radius:6px;cursor:pointer;}
        .btn-secondary{flex:1;background:transparent;color:var(--text-muted);border:1px solid ${dm?'rgba(255,255,255,.15)':C.border};font-size:13px;padding:12px;border-radius:6px;cursor:pointer;}
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:var(--border-gold);margin-bottom:22px;gap:10px;flex-wrap:wrap;}
        .topbar-user{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
        .user-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#006633,#003F8A);border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--gold);font-family:'Barlow Condensed',sans-serif;flex-shrink:0;}
        .user-name{font-size:14px;font-weight:500;color:${C.text};}
        .user-role{font-size:11px;color:var(--text-muted);}
        .topbar-actions{display:flex;gap:8px;flex-shrink:0;}
        .btn-sm{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;padding:7px 14px;border-radius:5px;cursor:pointer;border:none;}
        .btn-gold{background:var(--gold);color:#001a0a;}
        .btn-outline{background:transparent;border:1px solid ${dm?'rgba(212,175,55,.3)':C.border};color:var(--text-muted);}
        .btn-danger{background:${C.red};color:white;}
        .btn-green{background:${C.green};color:white;}
        .btn-whatsapp{background:#25D366;color:white;}
        .tabs-nav{display:flex;gap:2px;background:${C.bgTabsNav};border:var(--border-gold);border-radius:8px;padding:4px;margin-bottom:22px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .tabs-nav::-webkit-scrollbar{display:none;}
        .tab-btn{flex:0 0 auto;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;padding:9px 16px;border-radius:5px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;white-space:nowrap;}
        .tab-btn.active{background:var(--gold);color:#001a0a;}
        .section-title{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:var(--gold);margin-bottom:4px;display:flex;align-items:center;gap:10px;}
        .section-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right,${C.border},transparent);}
        .section-sub{font-size:12px;color:var(--text-muted);margin-bottom:16px;}
        .card{background:${C.bgCard};border:var(--border-gold);border-radius:var(--radius);padding:20px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .stat-card{background:${C.bgStat};border:var(--border-gold);border-radius:var(--radius);padding:16px 12px;text-align:center;}
        .stat-value{font-family:'Bebas Neue',sans-serif;font-size:34px;color:var(--gold);line-height:1;}
        .stat-label{font-size:11px;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;margin-top:4px;}
        .table-wrap{overflow-x:auto;border-radius:var(--radius);border:var(--border-gold);-webkit-overflow-scrolling:touch;}
        table.dt{width:100%;border-collapse:collapse;font-size:13px;}
        .dt thead th{background:${C.bgTableHead};color:${dm?C.gold:'#F0D060'};font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:10px 12px;text-align:left;border-bottom:var(--border-gold);white-space:nowrap;}
        .dt thead th.c{text-align:center;}.dt thead th.r{text-align:right;}
        .dt tbody td{padding:10px 12px;border-bottom:1px solid ${C.borderFaint};color:${C.text};vertical-align:middle;white-space:nowrap;background:${dm?'transparent':C.bgRow};}
        .dt tbody tr:last-child td{border-bottom:none;}
        .dt td.c{text-align:center;}.dt td.r{text-align:right;}
        .pos-badge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:700;font-family:'Barlow Condensed',sans-serif;flex-shrink:0;}
        .p1{background:var(--gold);color:#001a0a;}.p2{background:#9E9E9E;color:#001a0a;}.p3{background:#CD7F32;color:white;}.pn{background:${dm?'rgba(255,255,255,.08)':'rgba(0,0,0,.08)'};color:var(--text-muted);}
        .pts-badge{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:22px;border-radius:4px;font-size:11px;font-weight:700;padding:0 5px;}
        .pts-5{background:rgba(0,166,81,.3);color:${dm?'#00c060':C.green};border:1px solid rgba(0,166,81,.4);}
        .pts-3{background:rgba(212,175,55,.2);color:var(--gold);border:1px solid rgba(212,175,55,.35);}
        .pts-1{background:${dm?'rgba(255,255,255,.08)':'rgba(0,0,0,.08)'};color:var(--text-muted);border:1px solid ${dm?'rgba(255,255,255,.12)':'rgba(0,0,0,.12)'};}
        .pts-0{background:rgba(192,57,43,.2);color:#e74c3c;border:1px solid rgba(192,57,43,.25);}
        .pal-hdr{background:${dm?'linear-gradient(135deg,rgba(0,60,30,.8),rgba(0,40,80,.5))':'linear-gradient(135deg,rgba(0,80,40,.1),rgba(0,40,80,.08))'};border:var(--border-gold);border-radius:var(--radius);padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .pal-rname{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;color:var(--gold);}
        .st-open{color:${C.green};font-size:11px;letter-spacing:2px;text-transform:uppercase;}
        .st-closed{color:${C.red};font-size:11px;letter-spacing:2px;text-transform:uppercase;}
        .match-card{background:${C.bgMatchCard};border:1px solid ${C.borderFaint};border-radius:var(--radius);padding:20px 18px;margin-bottom:10px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;box-shadow:${C.shadow};}
        .match-card.locked{opacity:.65;border-color:${dm?'rgba(192,57,43,.3)':'rgba(192,57,43,.4)'};}
        .match-teams{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;}
        .team-flag{font-size:28px;}.team-name{font-size:17px;font-weight:700;color:${C.text};}.vs-txt{font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--gold);}
        .score-grp{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;}
        .score-in{width:56px;height:56px;background:${C.bgInput};border:1px solid ${dm?'rgba(212,175,55,.3)':C.border};color:${C.text};font-family:'Bebas Neue',sans-serif;font-size:26px;text-align:center;border-radius:6px;outline:none;}
        .score-in:focus{border-color:var(--gold);}
        .score-in:disabled{opacity:.4;cursor:not-allowed;}
        .score-sep{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--text-muted);}
        .classify-sel{background:${C.bgInput};border:1px solid ${dm?'rgba(212,175,55,.3)':C.border};color:${C.text};font-size:13px;padding:8px 12px;border-radius:6px;outline:none;cursor:pointer;width:100%;max-width:240px;}
        .classify-sel:disabled{opacity:.4;cursor:not-allowed;}
        .match-time{font-size:12px;color:var(--text-muted);letter-spacing:1px;width:100%;text-align:center;}
        .lock-badge{font-size:11px;color:${C.red};letter-spacing:1px;font-family:'Barlow Condensed',sans-serif;}
        .extras-row{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;}
        .extra-label{font-size:11px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;}
        .penaltis-grp{display:flex;gap:10px;justify-content:center;}
        .pen-btn{background:${dm?'rgba(0,40,20,.6)':'rgba(0,80,40,.08)'};border:1px solid ${dm?'rgba(212,175,55,.25)':C.border};color:${C.text};font-size:13px;padding:8px 20px;border-radius:6px;cursor:pointer;transition:all .2s;}
        .pen-btn.selected{background:var(--gold);color:#001a0a;border-color:var(--gold);}
        .pen-btn:disabled{opacity:.4;cursor:not-allowed;}
        .shame-box{background:${dm?'linear-gradient(135deg,rgba(50,0,0,.4),rgba(20,0,8,.3))':'rgba(255,240,240,.6)'};border:1px solid rgba(192,57,43,.3);border-radius:var(--radius);padding:18px;text-align:center;}
        .shame-ttl{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:#e74c3c;margin-bottom:4px;}
        .shame-sub{font-size:11px;color:var(--text-muted);margin-bottom:12px;}
        .parcial-chip{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;padding:3px 10px;border-radius:4px;text-transform:uppercase;}
        .chip-p{background:rgba(212,175,55,.15);color:var(--gold);border:1px solid rgba(212,175,55,.35);}
        .chip-f{background:rgba(0,166,81,.15);color:${C.green};border:1px solid rgba(0,166,81,.3);}
        .mult-badge{display:inline-flex;align-items:center;justify-content:center;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.35);color:var(--gold);font-family:'Bebas Neue',sans-serif;font-size:13px;padding:2px 8px;border-radius:4px;letter-spacing:1px;}
        .a-warn{background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.28);border-radius:var(--radius);padding:10px 14px;font-size:12px;color:#d08070;margin-bottom:16px;}
        .a-card{background:${C.bgAdminCard};border:1px solid ${C.border};border-radius:var(--radius);padding:16px;margin-bottom:12px;}
        .a-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;}
        .a-lbl{font-size:11px;color:var(--text-muted);letter-spacing:1px;min-width:80px;text-transform:uppercase;}
        .a-in{background:${C.bgInput};border:1px solid ${dm?'rgba(212,175,55,.25)':C.border};color:${C.text};font-size:13px;padding:7px 12px;border-radius:5px;outline:none;}
        .a-in.sm{width:60px;text-align:center;}.a-in.md{width:150px;}.a-in.lg{flex:1;min-width:140px;}
        .a-sel{background:${C.bgInput};border:1px solid ${dm?'rgba(212,175,55,.25)':C.border};color:${C.text};font-size:13px;padding:7px 12px;border-radius:5px;outline:none;cursor:pointer;}
        .toggle{position:relative;display:inline-block;width:40px;height:22px;}
        .toggle input{opacity:0;width:0;height:0;}
        .tsl{position:absolute;cursor:pointer;inset:0;background:${dm?'rgba(255,255,255,.13)':'rgba(0,0,0,.13)'};border-radius:22px;transition:.2s;}
        .tsl::before{content:'';position:absolute;width:16px;height:16px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.2s;}
        .toggle input:checked+.tsl{background:${C.green};}
        .toggle input:checked+.tsl::before{transform:translateX(18px);}
        .extras-admin{background:${dm?'rgba(0,60,30,.3)':'rgba(0,80,40,.06)'};border:1px solid ${C.borderFaint};border-radius:6px;padding:10px 12px;margin-top:8px;}
        .extras-admin-title{font-size:11px;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-family:'Barlow Condensed',sans-serif;font-weight:600;}
        .extras-checks{display:flex;gap:16px;flex-wrap:wrap;}
        .extra-check{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);cursor:pointer;}
        .extra-check input{width:14px;height:14px;cursor:pointer;accent-color:var(--gold);}
        .corr-p{background:${C.bgAdminCard};border:1px solid ${C.borderFaint};border-radius:var(--radius);margin-bottom:8px;overflow:hidden;}
        .corr-h{background:${dm?'rgba(0,40,20,.6)':'rgba(0,80,40,.08)'};padding:10px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:10px;touch-action:manipulation;}
        .corr-n{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:600;letter-spacing:1px;color:${C.text};}
        .corr-pts{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--gold);}
        .corr-b{padding:14px;border-top:1px solid ${C.borderFaint};}
        .corr-r{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid ${dm?'rgba(212,175,55,.06)':'rgba(0,0,0,.06)'};flex-wrap:wrap;font-size:13px;}
        .corr-r:last-child{border-bottom:none;}
        .add-btn{width:100%;background:${dm?'rgba(0,40,20,.5)':'rgba(0,80,40,.06)'};border:1px dashed ${dm?'rgba(212,175,55,.3)':C.border};color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;font-size:13px;letter-spacing:1px;padding:10px;border-radius:var(--radius);cursor:pointer;margin-top:8px;}
        .rm-btn{background:transparent;border:1px solid rgba(192,57,43,.3);color:rgba(192,57,43,.7);font-size:11px;padding:4px 10px;border-radius:4px;cursor:pointer;}
        .notif-bar{position:fixed;top:0;left:0;right:0;background:var(--gold);color:#001a0a;text-align:center;font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:2px;padding:4px;z-index:9998;}
        .notif-box{position:fixed;top:18px;right:18px;background:${dm?'rgba(0,30,15,.97)':C.bgPanel};border:1px solid var(--gold);border-radius:8px;padding:12px 18px;font-size:13px;color:${C.text};z-index:9999;max-width:260px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .parcial-table{width:100%;border-collapse:collapse;}
        .parcial-table th{background:${C.bgTableHead};color:${dm?C.gold:'#F0D060'};font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:10px 12px;text-align:left;border-bottom:var(--border-gold);}
        .parcial-table th.r{text-align:right;}
        .parcial-table td{padding:10px 12px;border-bottom:1px solid ${C.borderFaint};color:${C.text};vertical-align:middle;}
        .parcial-table tr:last-child td{border-bottom:none;}
        .parcial-table td.r{text-align:right;}
        .parcial-pts-val{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--gold);}
        .parcial-total-val{font-size:13px;color:var(--text-muted);}
        .pending-banner{background:${dm?'rgba(212,175,55,.1)':'rgba(212,175,55,.15)'};border:1px solid ${dm?'rgba(212,175,55,.4)':'rgba(212,175,55,.5)'};border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;cursor:pointer;}
        .reset-box{background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.3);border-radius:var(--radius);padding:16px;margin-bottom:12px;}
        .reset-title{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:#e74c3c;margin-bottom:6px;}
        .reset-desc{font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.5;}
        .date-warn{background:rgba(192,57,43,.1);border:1px solid rgba(192,57,43,.3);border-radius:5px;padding:6px 10px;font-size:11px;color:#e07060;margin-top:4px;display:flex;align-items:center;gap:6px;}
        .simulated-pts{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:${C.textMuted};background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2);borderRadius:4px;padding:2px 8px;border-radius:4px;}
        @keyframes podiumRise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .guia-hero{background:${dm?'linear-gradient(135deg,rgba(0,60,30,.7),rgba(0,30,60,.5))':'linear-gradient(135deg,rgba(0,80,40,.1),rgba(0,30,80,.05))'};border:var(--border-gold);border-radius:var(--radius);padding:20px;margin-bottom:20px;text-align:center;}
        .os-tab{flex:1;padding:10px;border-radius:6px;border:1px solid ${C.borderFaint};background:transparent;color:${C.textMuted};font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:600;letter-spacing:1px;cursor:pointer;transition:all .2s;}
        .os-tab.active{background:var(--gold);color:#001a0a;border-color:var(--gold);}
        .compare-row{cursor:pointer;transition:background .15s;}
        .compare-row:hover td{background:${dm?'rgba(212,175,55,.06)':'rgba(212,175,55,.1)'}!important;}
        .reaction-bar{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;}
        .reaction-btn{background:${dm?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)'};border:1px solid ${C.borderFaint};borderRadius:20px;padding:2px 8px;fontSize:12px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:all .15s;}
        .reaction-btn.mine{background:rgba(212,175,55,.15);border-color:var(--gold);}
        .live-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(192,57,43,.2);border:1px solid rgba(192,57,43,.4);borderRadius:4px;padding:2px 8px;fontSize:11px;color:#e74c3c;fontFamily:"'Barlow Condensed',sans-serif";letterSpacing:1;animation:pulse 1.5s ease infinite;}
        .chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 280px);min-height:300px;max-height:500px;}
        .chat-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin;}
        .chat-bubble{max-width:80%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.4;}
        .chat-bubble.mine{align-self:flex-end;background:var(--gold);color:#001a0a;border-radius:12px 12px 2px 12px;}
        .chat-bubble.other{align-self:flex-start;background:${dm?'rgba(0,50,25,.6)':'rgba(0,80,40,.1)'};color:${C.text};border:1px solid ${C.borderFaint};border-radius:12px 12px 12px 2px;}
        .chat-input-row{display:flex;gap:8px;padding:10px 0 0;border-top:1px solid ${C.borderFaint};}
        .previsao-bar{height:8px;background:'rgba(255,255,255,.08)';border-radius:4px;overflow:hidden;margin-top:4px;}
        @media(max-width:600px){.compare-row td{font-size:12px;}}
          .grid-2{grid-template-columns:1fr;}
          .tab-btn{font-size:11px;padding:8px 10px;}
          .topbar-actions .btn-sm{padding:7px 12px;font-size:11px;}
          .a-row{flex-direction:column;align-items:flex-start;}.a-in.md,.a-in.lg,.a-sel{width:100%;}
          .modal-btns{flex-direction:column;}.notif-box{top:10px;right:10px;left:10px;max-width:unset;}
        }
        @media(max-width:360px){.player-grid{grid-template-columns:1fr;}}
      `}</style>

      {saving && <div className="notif-bar">SALVANDO...</div>}
      {notif && <div className="notif-box" style={{borderColor:notif.type==='error'?'#e74c3c':C.gold}}>
        {notif.type==='error'?'✕ ':'★ '}{notif.msg}
      </div>}

      {/* Modal Admin */}
      {showModal && <div className="modal-overlay open">
        <div className="modal">
          <h3>Acesso Admin</h3>
          <div style={{background:'rgba(192,57,43,0.12)',border:'1px solid rgba(192,57,43,0.4)',borderRadius:8,padding:'10px 14px',marginBottom:14,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,letterSpacing:1,color:'#e07060',lineHeight:1.4}}>
            🤡 Tá achando que é adm?<br/><b style={{color:'#e74c3c'}}>Saí daqui palhaço!</b>
          </div>
          <p style={{fontSize:12,color:C.textMuted,marginBottom:14}}>(Se realmente for o administrador, digite a senha abaixo 👇)</p>
          <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkAdminPass()} placeholder="••••••" autoFocus/>
          <div className="modal-error">{modalError}</div>
          <div className="modal-btns">
            <button className="btn-secondary" onClick={()=>{setShowModal(false);setAdminPassInput('');setModalError('')}}>Cancelar</button>
            <button className="btn-primary" onClick={checkAdminPass}>Entrar</button>
          </div>
        </div>
      </div>}

      {/* Modal Reset */}
      {showResetModal && <div className="modal-overlay open">
        <div className="modal">
          <h3>⚠ Zerar Dados</h3>
          <p style={{color:'#e74c3c',fontSize:13,marginBottom:12}}>Isso apagará TODOS os palpites, pontuações, histórico e resultados. A ação é irreversível!</p>
          <p style={{fontSize:12,color:C.textMuted,marginBottom:8}}>Digite <b style={{color:C.gold}}>ZERAR</b> para confirmar:</p>
          <input type="text" value={resetConfirm} onChange={e=>setResetConfirm(e.target.value)} placeholder="ZERAR" style={{letterSpacing:4,textTransform:'uppercase'}}/>
          <p style={{fontSize:12,color:C.textMuted,marginBottom:8,marginTop:4}}>Confirme com a <b style={{color:C.gold}}>senha master</b>:</p>
          <input type="password" value={resetMasterConfirm} onChange={e=>setResetMasterConfirm(e.target.value)} placeholder="••••••"/>
          <div className="modal-btns" style={{marginTop:8}}>
            <button className="btn-secondary" onClick={()=>{setShowResetModal(false);setResetConfirm('');setResetMasterConfirm('')}}>Cancelar</button>
            <button style={{flex:1,background:C.red,color:'white',border:'none',fontFamily:"'Barlow Condensed'",fontSize:14,fontWeight:700,letterSpacing:2,padding:12,borderRadius:6,cursor:'pointer'}} onClick={resetAll}>ZERAR TUDO</button>
          </div>
        </div>
      </div>}

      {/* Modal Novidade */}
      {showNovidade && novidadeAtual && <div className="modal-overlay open">
        <div className="modal" style={{maxWidth:400}}>
          <div style={{background:'rgba(212,175,55,0.12)',border:'1px solid rgba(212,175,55,0.3)',borderRadius:8,padding:'8px 14px',marginBottom:16,display:'inline-block'}}>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:2,color:C.gold}}>🆕 NOVIDADE · {novidadeAtual.data}</span>
          </div>
          <h3 style={{marginBottom:10,fontSize:18}}>{novidadeAtual.titulo}</h3>
          {novidadeAtual.resumo && <p style={{fontSize:13,color:C.textMuted,marginBottom:20,lineHeight:1.6,textAlign:'left'}}>{novidadeAtual.resumo}</p>}
          <button className="btn-primary" style={{width:'100%'}} onClick={()=>{
            localStorage.setItem('palpitao_novidade_seen', novidadeAtual.id)
            setShowNovidade(false)
          }}>Entendi! 👍</button>
        </div>
      </div>}

      <div style={{position:'relative'}}>
        <header>
          <div className="header-badge">⚽ Edição Especial</div>
          <h1><span className="h1-main">PALPITÃO </span><span className="h1-sub">COPA DO MUNDO</span></h1>
          <div style={{fontSize:12,color:dm?C.textMuted:'rgba(255,255,255,0.7)',letterSpacing:2,textTransform:'uppercase',fontWeight:300}}>USA · México · Canadá</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,margin:'10px 0 0',fontSize:16,overflow:'hidden'}}>
            🏆 <span style={{fontSize:11,color:dm?'#A07820':'rgba(255,255,255,0.7)',letterSpacing:1,whiteSpace:'nowrap'}}>48 SELEÇÕES · 3 PAÍSES SEDE · 1 CAMPEÃO</span> 🏆
          </div>
        </header>
        <button className="theme-btn" onClick={()=>setDarkMode(!dm)}>{dm?'☀️':'🌙'}</button>
      </div>

      <div className="app">
        {/* LOGIN */}
        {!currentUser && <div id="login-screen">
          <div className="login-box">
            <h2>Entrar no Palpitão</h2>
            <p>Selecione seu nome para acessar</p>
            <div className="player-grid">
              {PLAYERS.map(p=><button key={p} className="player-btn" onClick={()=>loginAsPlayer(p)}>{p}</button>)}
            </div>
            <button className="admin-login-btn" onClick={()=>setShowModal(true)}>⚙ Acesso Administração</button>
          </div>
        </div>}

        {currentUser && <>
          <div className="topbar">
            <div className="topbar-user">
              <div className="user-avatar">{currentUser.split(' ').map((w:string)=>w[0]).join('').substring(0,2).toUpperCase()}</div>
              <div><div className="user-name">{currentUser}</div><div className="user-role">{isAdmin?'⚙ ADMINISTRAÇÃO':'PARTICIPANTE'}</div></div>
            </div>
            <div className="topbar-actions">
              <button className="btn-sm btn-gold" onClick={()=>{fetchState();showNotif('Atualizado!')}}>↻ Atualizar</button>
              <button className="btn-sm btn-outline" onClick={logout}>Sair</button>
            </div>
          </div>

          <div className="tabs-nav">
            {['home','palpites','chat','geral','ranking','historico','guia'].map(t=>{
              const hasNovidade = t==='home' && (()=>{
                const novs: any[] = state.novidades||[]
                if(!novs.length) return false
                const seen = typeof window !== 'undefined' ? localStorage.getItem('palpitao_novidade_seen') : null
                return seen !== novs[novs.length-1]?.id
              })()

              return (
                <button key={t} className={`tab-btn${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)} style={{position:'relative'}}>
                  {t==='home'?'🏠 Início':t==='palpites'?'✏ Palpites':t==='chat'?'💬 Chat':t==='geral'?'📊 Geral':t==='ranking'?'🏆 Ranking':t==='historico'?'📅 Histórico':'📖 Guia'}
                  {hasNovidade && <span style={{position:'absolute',top:4,right:4,width:7,height:7,borderRadius:'50%',background:'#e74c3c',border:'1px solid rgba(0,0,0,.3)'}}/>}
                </button>
              )
            })}
            {isAdmin && <button className={`tab-btn${activeTab==='admin'?' active':''}`} onClick={()=>setActiveTab('admin')}>⚙ Admin</button>}
          </div>

          {/* ── HOME ── */}
          {activeTab==='home' && <div>
            {/* Banner novidade */}
            {(()=>{
              const novs: any[] = state.novidades||[]
              if(!novs.length) return null
              const latest = novs[novs.length-1]
              const seen = typeof window !== 'undefined' ? localStorage.getItem('palpitao_novidade_seen') : null
              if(seen === latest.id) return null
              return (
                <div style={{background:dm?'rgba(0,60,120,.25)':'rgba(0,40,100,.08)',border:'1px solid rgba(100,150,255,.3)',borderRadius:'var(--radius)',padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}
                  onClick={()=>{setNovidadeAtual(latest);setShowNovidade(true)}}>
                  <span style={{fontSize:20}}>🆕</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:600,color:'#7ab0ff',letterSpacing:1}}>NOVIDADE · {latest.data}</div>
                    <div style={{fontSize:12,color:C.textMuted}}>{latest.titulo}</div>
                  </div>
                  <span style={{color:'#7ab0ff',fontSize:18}}>→</span>
                </div>
              )
            })()}

            {/* Banner palpite pendente */}
            {!isAdmin && state.palpitesOpen && state.round.matches.length>0 && !state.roundFinalized && (()=>{
              const myPal=state.palpites[currentUser!]||{}
              const pendentes=state.round.matches.filter((m:any,idx:number)=>!isMatchLocked(m,idx)&&(!myPal[m.id]||myPal[m.id].h===''))
              return pendentes.length>0?(
                <div className="pending-banner" onClick={()=>setActiveTab('palpites')}>
                  <span style={{fontSize:20}}>⚠️</span>
                  <div>
                    <div style={{fontFamily:"'Barlow Condensed'",fontSize:14,fontWeight:600,color:C.gold,letterSpacing:1}}>PALPITE PENDENTE</div>
                    <div style={{fontSize:12,color:C.textMuted}}>Você ainda não palpitou em {pendentes.length} jogo{pendentes.length>1?'s':''} desta rodada</div>
                  </div>
                  <span style={{marginLeft:'auto',color:C.gold,fontSize:18}}>→</span>
                </div>
              ):null
            })()}

            {/* ── Stats card mobile-first ── */}
            {(()=>{
              const myPos = !isAdmin ? sorted.findIndex((d:any)=>d.name===currentUser) : -1
              const myTotal = !isAdmin ? (state.totalPoints[currentUser!]||0) : 0
              const myRoundPts = !isAdmin ? (Object.values(state.correctedScores[currentUser!]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number) : 0
              const ptsParaSubir = myPos > 0 ? (sorted[myPos-1]?.total||0) - myTotal : 0
              const jogosRestantes = state.round.matches.filter((_:any, idx:number) => !isMatchLocked(state.round.matches[idx], idx)).length
              const proximoJogo = state.round.matches.reduce((closest:any, m:any, idx:number)=>{
                const diff = getCountdownMs(m, idx)
                if(diff > 0 && (closest === null || diff < getCountdownMs(closest.m, closest.idx)))
                  return {m, idx}
                return closest
              }, null)
              const proximoCountdown = proximoJogo ? getCountdown(proximoJogo.m, proximoJogo.idx) : null

              return (
                <div style={{background:dm?'linear-gradient(135deg,rgba(0,50,25,.7),rgba(0,30,60,.5))':'rgba(255,255,255,.9)',border:`1px solid ${C.border}`,borderRadius:12,padding:'18px 16px',marginBottom:20,boxShadow:C.shadow}}>
                  {/* Nome + número da rodada */}
                  <div style={{textAlign:'center',marginBottom:16}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:3,color:C.gold,lineHeight:1}}>
                      {state.round.name||'—'}
                    </div>
                    {state.round.number && (
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:600,letterSpacing:2,color:C.textMuted,textTransform:'uppercase',marginTop:2}}>
                        Rodada {state.round.number}
                      </div>
                    )}
                  </div>

                  {/* Pontuação em destaque (só para participantes) */}
                  {!isAdmin && (
                    <div style={{textAlign:'center',background:dm?'rgba(212,175,55,.08)':'rgba(212,175,55,.1)',border:`1px solid rgba(212,175,55,.25)`,borderRadius:10,padding:'14px 12px',marginBottom:14}}>
                      <div style={{fontSize:11,color:C.textMuted,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>Minha Pontuação</div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:C.gold,lineHeight:1}}>{myTotal}</div>
                      {myRoundPts > 0 && <div style={{fontSize:12,color:C.green,marginTop:2}}>+{myRoundPts} pts nesta rodada</div>}
                      {myPos >= 0 && (
                        <div style={{fontSize:12,color:C.textMuted,marginTop:4}}>
                          {myPos === 0
                            ? '🏆 Você é o líder!'
                            : `${myPos+1}º lugar · ${ptsParaSubir} pts para subir`
                          }
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info rápida */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{background:dm?'rgba(0,40,20,.5)':'rgba(0,80,40,.06)',border:`1px solid ${C.borderFaint}`,borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:C.text,lineHeight:1}}>{state.round.matches.length}</div>
                      <div style={{fontSize:10,color:C.textMuted,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>Jogos</div>
                    </div>
                    <div style={{background:dm?'rgba(0,40,20,.5)':'rgba(0,80,40,.06)',border:`1px solid ${C.borderFaint}`,borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:jogosRestantes>0?C.gold:C.red,lineHeight:1}}>{jogosRestantes}</div>
                      <div style={{fontSize:10,color:C.textMuted,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>Abertos</div>
                    </div>
                  </div>

                  {/* Próximo jogo countdown */}
                  {proximoCountdown && (
                    <div style={{marginTop:10,textAlign:'center',fontSize:12,color:C.textMuted,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                      <span>⏱</span>
                      <span>Próximo fecha em <b style={{color:Number(proximoCountdown.split('h')[0])<2?C.red:C.gold}}>{proximoCountdown}</b></span>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="grid-2" style={{marginBottom:20}}>
              <div className="card">
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                  <div className="section-title" style={{marginBottom:0,fontSize:17}}>Parcial</div>
                  <span className={`parcial-chip ${state.roundFinalized?'chip-f':'chip-p'}`}>{state.roundFinalized?'✔ FINALIZADA':'EM ANDAMENTO'}</span>
                  {mult>1&&<span className="mult-badge">×{mult}</span>}
                </div>
                <div style={{background:C.bgRow,border:`1px solid ${C.border}`,borderRadius:'var(--radius)',overflow:'hidden'}}>
                  <table className="parcial-table">
                    <thead><tr><th style={{width:32}}>#</th><th>Participante</th><th className="r">Pts Rod.</th><th className="r">Total</th></tr></thead>
                    <tbody>
                      {parcial.map((d,i)=>(
                        <tr key={d.name}>
                          <td>{posIcon(i)}</td>
                          <td style={{fontSize:13}}>{d.name}</td>
                          <td className="r">
                            {d.roundPts>0
                              ? <span className="parcial-pts-val">{d.roundPts}</span>
                              : d.hasPal
                                ? <span style={{color:C.textMuted,fontSize:13}}>—</span>
                                : <span style={{color:'rgba(192,57,43,.7)',fontSize:11,fontFamily:"'Barlow Condensed'",letterSpacing:1}}>NP</span>
                            }
                          </td>
                          <td className="r"><span className="parcial-total-val">{d.total}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="shame-box">
                  <div className="shame-ttl">🤦 Pior Palpiteiro</div>
                  <div className="shame-sub">Administração atualiza após cada rodada</div>
                  {state.shame.player&&<>
                    {state.shame.photoUrl&&<img src={state.shame.photoUrl} alt="" style={{width:'100%',maxWidth:320,borderRadius:8,border:'2px solid rgba(192,57,43,.5)',display:'block',margin:'0 auto 10px',objectFit:'cover'}}/>}
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:'#e74c3c',letterSpacing:2}}>😂 {state.shame.player}</div>
                    {state.shame.text&&<div style={{fontStyle:'italic',fontSize:13,color:'rgba(255,180,160,.85)',marginTop:6,lineHeight:1.4}}>{state.shame.text}</div>}
                  </>}
                </div>
                <div className="card">
                  <div className="section-title" style={{fontSize:15}}>Por Placar</div>
                  {state.round.matches.map((m:any)=>{
                    const counts:any={}
                    PLAYERS.forEach(p=>{const pal=state.palpites[p]?.[m.id];if(pal&&pal.h!==''){const k=`${pal.h}x${pal.a}`;counts[k]=(counts[k]||0)+1}})
                    const entries=Object.entries(counts).sort((a:any,b:any)=>b[1]-a[1])
                    if(!entries.length) return null
                    return <div key={m.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.borderFaint}`,flexWrap:'wrap',gap:6}}>
                      <span style={{color:C.textMuted,fontSize:12}}>{m.home} x {m.away}</span>
                      <span style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {entries.map(([k,v]:any)=><span key={k} style={{background:dm?'rgba(0,60,30,.5)':'rgba(0,80,40,.08)',border:`1px solid ${C.borderFaint}`,padding:'2px 8px',borderRadius:4,fontSize:12}}><b style={{color:C.gold}}>{k}</b> <span style={{color:C.textMuted}}>{v}x</span></span>)}
                      </span>
                    </div>
                  })}
                </div>
              </div>
            </div>

            {/* Pizza de distribuição de palpites */}
            {state.round.matches.length > 0 && Object.keys(state.palpites).length > 0 && (
              <PizzaDistribuicao matches={state.round.matches} palpites={state.palpites} C={C} dm={dm}/>
            )}

            {/* Podium — só aparece quando há histórico */}
            {state.roundHistory.length > 0 && (()=>{
              const totalPts: Record<string,number> = {}
              PLAYERS.forEach(p=>{ totalPts[p]=state.totalPoints[p]||0 })
              return (
                <div className="card" style={{marginBottom:20}}>
                  <div className="section-title" style={{fontSize:17}}>Pódio Atual</div>
                  <PodiumDisplay players={PLAYERS} scores={totalPts}/>
                </div>
              )
            })()}
          </div>}

          {/* ── PALPITES ── */}
          {activeTab==='palpites' && <div>
            <div className="section-title">Meus Palpites</div>
            {!state.palpitesOpen&&<div className="a-warn">🔒 Palpites bloqueados. Aguarde a administração abrir.</div>}

            {/* Banner cômico: jogos travados sem palpite */}
            {(()=>{
              if(!currentUser||isAdmin) return null
              const travadosSemPalpite = state.round.matches.filter((m:any,idx:number)=>{
                const locked = isMatchLocked(m,idx)
                const pal = state.palpites[currentUser!]?.[m.id]
                return locked && (!pal || pal.h === '')
              })
              if(!travadosSemPalpite.length) return null
              return (
                <div style={{background:'linear-gradient(135deg,rgba(192,57,43,.2),rgba(150,30,10,.15))',border:'1px solid rgba(192,57,43,.4)',borderRadius:'var(--radius)',padding:'14px 18px',marginBottom:16,textAlign:'center' as const}}>
                  <div style={{fontSize:28,marginBottom:6}}>🤡</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:3,color:'#e74c3c',marginBottom:4}}>
                    iii mané... esqueceu de palpitar foi?
                  </div>
                  <div style={{fontSize:13,color:C.textMuted}}>
                    {travadosSemPalpite.length === 1
                      ? `Você perdeu o prazo de ${travadosSemPalpite[0].home} x ${travadosSemPalpite[0].away} 💀`
                      : `Você perdeu o prazo de ${travadosSemPalpite.length} jogos 💀`
                    }
                  </div>
                </div>
              )
            })()}

            <div className="pal-hdr">
              <div className="pal-rname">{state.round.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {mult>1&&<span className="mult-badge">×{mult}</span>}
                <div className={state.palpitesOpen?'st-open':'st-closed'}>{state.palpitesOpen?'🟢 Abertos':'🔒 Fechados'}</div>
              </div>
            </div>

            {state.round.matches.length===0&&<div style={{color:C.textMuted,fontSize:13,padding:'20px 0'}}>Nenhum jogo configurado. Aguarde a administração.</div>}

            {state.round.matches.map((m:any,idx:number)=>{
              const pal=localPalpites[m.id]||{h:'',a:'',quemAvanca:'',penaltis:''}
              const locked=!state.palpitesOpen||isMatchLocked(m,idx)
              const diffMs = getCountdownMs(m, idx)
              const phase = getCurrentPhase(state)
              const scoreMult = state.multipliers||defaultMultipliers()
              const simPts = calcSimulatedPoints(pal, phase, mult, m, scoreMult)

              return <div key={m.id} className={`match-card${locked?' locked':''}`}>
                <div className="match-teams">
                  {m.homeLogo
                    ? <img src={m.homeLogo} alt={m.home} style={{width:40,height:40,objectFit:'contain'}}/>
                    : <span className="team-flag">{m.homeFlag||'🏳'}</span>}
                  <span className="team-name">{m.home}</span>
                  <span className="vs-txt">x</span>
                  <span className="team-name">{m.away}</span>
                  {m.awayLogo
                    ? <img src={m.awayLogo} alt={m.away} style={{width:40,height:40,objectFit:'contain'}}/>
                    : <span className="team-flag">{m.awayFlag||'🏳'}</span>}
                </div>
                <div className="score-grp">
                  <input className="score-in" type="number" inputMode="numeric" min={0} max={20} value={pal.h} disabled={locked}
                    onChange={e=>setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],h:e.target.value}}))}/>
                  <span className="score-sep">×</span>
                  <input className="score-in" type="number" inputMode="numeric" min={0} max={20} value={pal.a} disabled={locked}
                    onChange={e=>setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],a:e.target.value}}))}/>
                </div>

                {/* Pontuação simulada */}
                {simPts !== null && !locked && (
                  <div className="simulated-pts">
                    💡 Se esse for o resultado: <b style={{color:C.gold,marginLeft:4}}>+{simPts} pts</b>
                  </div>
                )}

                {m.hasQuemAvanca && (
                  <div className="extras-row">
                    <div className="extra-label">🏴 Quem avança?</div>
                    <select className="classify-sel" disabled={locked} value={pal.quemAvanca||''}
                      onChange={e=>setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],quemAvanca:e.target.value}}))}>
                      <option value="">Selecione...</option>
                      <option value={m.home}>{m.home}</option>
                      <option value={m.away}>{m.away}</option>
                    </select>
                  </div>
                )}
                {m.hasPenaltis && (
                  <div className="extras-row">
                    <div className="extra-label">⚽ Vai para pênaltis?</div>
                    <div className="penaltis-grp">
                      <button type="button" className={`pen-btn${pal.penaltis==='sim'?' selected':''}`} disabled={locked}
                        onClick={()=>!locked&&setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],penaltis:pal.penaltis==='sim'?'':'sim'}}))}>Sim</button>
                      <button type="button" className={`pen-btn${pal.penaltis==='nao'?' selected':''}`} disabled={locked}
                        onClick={()=>!locked&&setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],penaltis:pal.penaltis==='nao'?'':'nao'}}))}>Não</button>
                    </div>
                  </div>
                )}

                <div className="match-time">
                  {locked
                    ? <span className="lock-badge">🔒 Travado</span>
                    : <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
                        <span>⏱ {m.date?`${m.date} · `:''}{m.time||'—'}</span>
                        {/* Timer visual urgente quando menos de 1h */}
                        {diffMs > 0 && diffMs < 3600000 && <CountdownTimer diffMs={diffMs} C={C}/>}
                        {diffMs >= 3600000 && <span style={{color:C.goldLight,fontSize:12}}>· fecha em {getCountdown(m,idx)}</span>}
                      </span>
                  }
                </div>
              </div>
            })}

            {state.palpitesOpen&&<div style={{marginTop:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <button className="btn-sm btn-gold" style={{padding:'10px 24px',fontSize:14}} onClick={savePalpites} disabled={saving}>
                💾 {saving?'Salvando...':'Salvar Palpites'}
              </button>
              {state.palpiteTimes[currentUser!]&&<span style={{fontSize:12,color:C.textMuted}}>
                Último: {new Date(state.palpiteTimes[currentUser!]).toLocaleString('pt-BR')}
              </span>}
            </div>}
          </div>}

          {/* ── GERAL ── */}
          {activeTab==='geral'&&<div>
            <div className="section-title">Tabela Geral</div>
            <div className="section-sub">Palpites da rodada atual</div>
            <div className="table-wrap">
              <table className="dt">
                <thead><tr>
                  <th>Participante</th>
                  {state.round.matches.map((m:any)=><th key={m.id} className="c" style={{minWidth:80}}>{m.home}<br/><span style={{fontSize:10,color:dm?'rgba(212,175,55,.4)':'rgba(0,100,50,.4)'}}>x</span><br/>{m.away}</th>)}
                  <th className="r">Pts</th><th className="r">Hora</th>
                </tr></thead>
                <tbody>
                  {PLAYERS.map(p=>{
                    const pal=state.palpites[p]||{}
                    const time=state.palpiteTimes[p]?new Date(state.palpiteTimes[p]).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'
                    const roundPts=Object.values(state.correctedScores[p]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number
                    return <tr key={p}>
                      <td style={{minWidth:100}}>{p}</td>
                      {state.round.matches.map((m:any)=>{
                        const myPal=pal[m.id]
                        if(!myPal||myPal.h==='') return <td key={m.id} className="c"><span style={{color:C.textSub}}>—</span></td>
                        const pts=state.correctedScores[p]?.[m.id]??null
                        return <td key={m.id} className="c">
                          <span style={{fontFamily:"'Bebas Neue'",fontSize:15}}>{myPal.h}×{myPal.a}</span>
                          {pts!==null&&<><br/><span className={`pts-badge pts-${Math.min(pts,5)}`}>{pts}</span></>}
                        </td>
                      })}
                      <td className="r" style={{color:C.gold,fontFamily:"'Bebas Neue'",fontSize:17}}>{(roundPts as number)>0?(roundPts as number):'—'}</td>
                      <td className="r" style={{fontSize:11,color:C.textMuted}}>{time}</td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </div>}

          {/* ── RANKING ── */}
          {activeTab==='ranking'&&<div>
            <div className="section-title">Ranking Geral</div>
            <div className="section-sub">Pontuação acumulada · desempate por placares exatos e resultados corretos</div>

            {/* Pódio no ranking quando há histórico */}
            {state.roundHistory.length > 0 && (()=>{
              const totalPts: Record<string,number> = {}
              PLAYERS.forEach(p=>{ totalPts[p]=state.totalPoints[p]||0 })
              return (
                <div className="card" style={{marginBottom:16}}>
                  <PodiumDisplay players={PLAYERS} scores={totalPts}/>
                </div>
              )
            })()}

            {(()=>{
              const projecoes = calcProjecaoPct(state, projWindow)
              const hasProj = Object.keys(projecoes).length > 0
              return (
                <div className="table-wrap" style={{marginBottom:20}}>
                  <table className="dt">
                    <thead><tr>
                      <th style={{width:40}}>#</th>
                      <th>Participante</th>
                      <th className="r">Pontos</th>
                      <th className="r">Exatos</th>
                      <th className="r">Vencedor</th>
                      <th className="r">Saldo</th>
                      <th className="r" style={{color:'#9b59b6'}}>Projeção</th>
                    </tr></thead>
                    <tbody>
                      {sorted.map((d:any,i:number)=>{
                        const prevTotal = i>0?sorted[i-1].total:null
                        const tied = prevTotal===d.total && d.total > 0
                        const proj = projecoes[d.name]
                        return <tr key={d.name} style={tied?{background:dm?'rgba(212,175,55,.04)':'rgba(212,175,55,.08)'}:{}} onClick={()=>setCompareTarget(d.name)} className="compare-row">
                          <td>{posIcon(i)}</td>
                          <td style={{whiteSpace:'nowrap'}}>{d.name}{tied&&<span style={{fontSize:10,color:C.gold,marginLeft:4}}>≈</span>}</td>
                          <td className="r" style={{fontFamily:"'Bebas Neue'",fontSize:18,color:C.gold}}>{d.total}</td>
                          <td className="r" style={{color:C.textMuted}}>{d.exact}</td>
                          <td className="r" style={{color:C.textMuted}}>{d.vencedor}</td>
                          <td className="r" style={{color:C.textMuted}}>{d.saldo}</td>
                          <td className="r">
                            {!hasProj
                              ? <span style={{color:C.textSub,fontSize:13}}>—</span>
                              : <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:'#9b59b6'}}>{proj}%</span>
                            }
                          </td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()}

            {/* Dica comparativo */}
            {!isAdmin && <div style={{fontSize:11,color:C.textMuted,textAlign:'center',marginBottom:12,padding:'6px',background:dm?'rgba(212,175,55,.05)':'rgba(212,175,55,.08)',borderRadius:6,border:`1px solid ${C.borderFaint}`}}>
              👆 Toque em qualquer participante para ver o comparativo frente a frente
            </div>}

            {/* Gráfico de evolução */}
            {state.roundHistory.length > 0 && (
              <div className="card" style={{marginBottom:20}}>
                <div className="section-title" style={{fontSize:17,marginBottom:12}}>Evolução por Rodada</div>
                <EvolucaoChart history={state.roundHistory} players={PLAYERS} C={C}/>
              </div>
            )}

            {/* Estatísticas pessoais */}
            {!isAdmin && currentUser && (
              <div className="card">
                <div className="section-title" style={{fontSize:17,marginBottom:12}}>Minhas Estatísticas</div>
                <EstatisticasPessoais player={currentUser} history={state.roundHistory} C={C}/>
              </div>
            )}
          </div>}

          {/* ── HISTÓRICO ── */}
          {activeTab==='historico'&&<div>
            <div className="section-title">Histórico de Rodadas</div>
            <div className="section-sub">Pontuação por rodada finalizada</div>
            {state.roundHistory.length===0&&<div style={{color:C.textMuted,fontSize:13,padding:'20px 0'}}>Nenhuma rodada finalizada ainda.</div>}
            {[...state.roundHistory].reverse().map((r:any,ri:number)=>(
              <div key={ri} className="a-card" style={{marginBottom:14}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:C.gold,letterSpacing:2,marginBottom:10}}>{r.roundName||'Rodada'}</div>
                <div style={{background:C.bgRow,border:`1px solid ${C.border}`,borderRadius:'var(--radius)',overflow:'hidden'}}>
                  <table className="parcial-table">
                    <thead><tr><th style={{width:32}}>#</th><th>Participante</th><th className="r">Pts</th></tr></thead>
                    <tbody>
                      {[...PLAYERS].sort((a,b)=>(r.scores?.[b]||0)-(r.scores?.[a]||0)).map((p,i)=>{
                        const pts=r.scores?.[p]??0
                        return <tr key={p}>
                          <td>{posIcon(i)}</td>
                          <td style={{fontSize:13}}>{p}</td>
                          <td className="r">{pts>0?<span className="parcial-pts-val">{pts}</span>:<span style={{color:C.textSub,fontSize:12}}>—</span>}</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>}

          {/* ── CHAT ── */}
          {activeTab==='chat'&&<div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:4}}>
              <div className="section-title" style={{marginBottom:0}}>💬 Chat da Rodada</div>
              {isAdmin&&<button className="btn-sm btn-danger" style={{fontSize:11,padding:'5px 12px'}} onClick={clearChat}>🗑 Limpar</button>}
            </div>
            <div className="section-sub" style={{marginBottom:12}}>
              Reaja, provoque, comemore 😄 · <span style={{color:C.textMuted}}>{state.round.name||'—'}</span>
            </div>
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="chat-wrap">
                <div className="chat-messages">
                  {chatMessages.length===0&&<div style={{textAlign:'center',color:C.textMuted,fontSize:13,marginTop:20,padding:'0 16px'}}>Nenhuma mensagem ainda. Seja o primeiro! 💬</div>}
                  {chatMessages.map((m:any)=>{
                    const isMe = m.user===currentUser
                    const CHAT_EMOJIS = ['🤣','👍','🤬','🤡','🖕']
                    const hasReactions = m.reactions && Object.values(m.reactions).some((v:any)=>(v as any[]).length>0)
                    return (
                      <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start',marginBottom:6}}>
                        {!isMe&&<span style={{fontSize:10,color:C.textMuted,marginBottom:2,marginLeft:6}}>{m.user}</span>}
                        <div style={{position:'relative',maxWidth:'80%'}}>
                          <div className={`chat-bubble ${isMe?'mine':'other'}`}
                            onContextMenu={e=>{e.preventDefault()}}
                          >{m.text}</div>
                          {hasReactions&&(
                            <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:3,justifyContent:isMe?'flex-end':'flex-start'}}>
                              {CHAT_EMOJIS.map(emoji=>{
                                const users: string[] = m.reactions?.[emoji]||[]
                                if(!users.length) return null
                                const isMine = users.includes(currentUser||'')
                                return (
                                  <button key={emoji} onClick={()=>toggleChatReaction(m.id,emoji)}
                                    style={{background:isMine?'rgba(212,175,55,.2)':dm?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)',
                                      border:`1px solid ${isMine?C.gold:C.borderFaint}`,borderRadius:12,
                                      padding:'2px 7px',fontSize:13,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:3}}>
                                    {emoji}<span style={{fontSize:10,color:isMine?C.gold:C.textMuted}}>{users.length}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                          <div style={{display:'flex',gap:3,marginTop:3,justifyContent:isMe?'flex-end':'flex-start'}}>
                            {CHAT_EMOJIS.map(emoji=>(
                              <button key={emoji} onClick={()=>toggleChatReaction(m.id,emoji)}
                                style={{background:'transparent',border:`1px solid ${C.borderFaint}`,borderRadius:10,
                                  padding:'1px 5px',fontSize:11,cursor:'pointer',opacity:0.45,transition:'opacity .15s'}}
                                onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                                onMouseLeave={e=>(e.currentTarget.style.opacity='0.45')}
                              >{emoji}</button>
                            ))}
                          </div>
                        </div>
                        <span style={{fontSize:9,color:C.textSub,marginTop:1,marginLeft:6,marginRight:6}}>
                          {new Date(m.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
                        </span>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef}/>
                </div>
                <div className="chat-input-row" style={{padding:'8px 12px 12px'}}>
                  <input
                    className="a-in lg"
                    style={{flex:1,fontSize:16}}
                    value={chatMsg}
                    onChange={e=>setChatMsg(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&sendChatMsg()}
                    placeholder="Manda ver... 🔥"
                    maxLength={200}
                  />
                  <button className="btn-sm btn-gold" onClick={sendChatMsg} disabled={!chatMsg.trim()}>Enviar</button>
                </div>
              </div>
            </div>
          </div>}

          {/* ── GUIA ── */}
          {activeTab==='guia'&&<GuiaTab C={C} dm={dm} state={state} guideTextStyle={guideTextStyle} guideTipStyle={guideTipStyle} guideHighlight={guideHighlight} requestPushPermission={requestPushPermission} pushStatus={pushStatus}/>}

          {/* ── Modal Comparativo Frente a Frente ── */}
          {compareTarget && compareTarget !== currentUser && (
            <div className="modal-overlay open" onClick={()=>setCompareTarget(null)}>
              <div className="modal" style={{maxWidth:420,width:'95%'}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <h3 style={{fontSize:18}}>⚔️ Frente a Frente</h3>
                  <button onClick={()=>setCompareTarget(null)} style={{background:'transparent',border:'none',color:C.textMuted,fontSize:20,cursor:'pointer'}}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,marginBottom:14,textAlign:'center'}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:600,color:C.gold}}>{currentUser}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.textMuted}}>VS</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:600,color:'#3498db'}}>{compareTarget}</div>
                </div>
                {state.round.matches.map((m:any)=>{
                  const myPal  = state.palpites[currentUser!]?.[m.id]
                  const hisPal = state.palpites[compareTarget]?.[m.id]
                  const res    = state.results[m.id]
                  const hasRes = res&&res.h!==''&&res.a!==''

                  function palResult(pal:any) {
                    if(!pal||pal.h==='') return {label:'—', color:C.textSub}
                    if(!hasRes) return {label:`${pal.h}×${pal.a}`, color:C.text}
                    const ph=parseInt(pal.h),pa=parseInt(pal.a),rh=parseInt(res.h),ra=parseInt(res.a)
                    if(ph===rh&&pa===ra) return {label:`${pal.h}×${pal.a} ✅`, color:'#00c060'}
                    const pw=ph>pa?1:ph<pa?-1:0, rw=rh>ra?1:rh<ra?-1:0
                    if((ph-pa)===(rh-ra)) return {label:`${pal.h}×${pal.a} 📐`, color:C.gold}
                    if(pw===rw) return {label:`${pal.h}×${pal.a} 👍`, color:'#3498db'}
                    return {label:`${pal.h}×${pal.a} ❌`, color:C.red}
                  }

                  const my  = palResult(myPal)
                  const his = palResult(hisPal)

                  return (
                    <div key={m.id} style={{borderBottom:`1px solid ${C.borderFaint}`,paddingBottom:10,marginBottom:10}}>
                      <div style={{fontSize:11,color:C.textMuted,textAlign:'center',marginBottom:6}}>
                        {m.homeFlag} {m.home} × {m.away} {m.awayFlag}
                        {hasRes&&<span style={{marginLeft:6,color:C.gold,fontFamily:"'Bebas Neue',sans-serif"}}>{res.h}×{res.a}</span>}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,textAlign:'center'}}>
                        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:my.color}}>{my.label}</span>
                        <span style={{color:C.textSub,fontSize:12}}>×</span>
                        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:his.color}}>{his.label}</span>
                      </div>
                    </div>
                  )
                })}
                {state.round.matches.length===0&&<div style={{color:C.textMuted,fontSize:13,textAlign:'center',padding:'10px 0'}}>Nenhum jogo nesta rodada.</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,textAlign:'center',marginTop:8,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.gold}}>{Object.values(state.correctedScores[currentUser!]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number}</div>
                    <div style={{fontSize:10,color:C.textMuted}}>pts rodada</div>
                  </div>
                  <div style={{color:C.textSub}}>VS</div>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:'#3498db'}}>{Object.values(state.correctedScores[compareTarget]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number}</div>
                    <div style={{fontSize:10,color:C.textMuted}}>pts rodada</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ADMIN ── */}
          {activeTab==='admin'&&isAdmin&&<div>
            <div className="a-warn">⚠ Área restrita — alterações afetam todos os participantes.</div>

            {/* Compartilhar no WhatsApp */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Compartilhar no WhatsApp</div>
              <div className="a-card">
                <div style={{fontSize:12,color:C.textMuted,marginBottom:14,lineHeight:1.5}}>
                  Envie um resumo direto no WhatsApp. Escolha o que compartilhar:
                </div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  <button className="btn-sm btn-whatsapp" onClick={()=>shareRanking('geral')} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 18px'}}>
                    📊 Ranking Geral
                  </button>
                  <button className="btn-sm btn-whatsapp" onClick={()=>shareRanking('parcial')} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 18px'}}>
                    ⚽ Parcial da Rodada
                  </button>
                </div>
                <div style={{marginTop:10,fontSize:11,color:C.textMuted,lineHeight:1.5}}>
                  A mensagem incluirá o top 5 e o link do AppWeb.
                </div>
              </div>
            </div>

            {/* Configuração de Projeção */}
            <div style={{marginBottom:24}}>
              <div className="section-title">🔮 Projeção de Campeão</div>
              <div className="a-card">
                <div style={{fontSize:12,color:C.textMuted,marginBottom:12,lineHeight:1.5}}>
                  Define quantas rodadas usar para calcular a projeção (%) na tabela de ranking.
                </div>
                <div className="a-row">
                  <span className="a-lbl">Janela:</span>
                  <select className="a-sel" value={projWindow} onChange={e=>setProjWindow(Number(e.target.value))}>
                    <option value={2}>Últimas 2 rodadas</option>
                    <option value={3}>Últimas 3 rodadas</option>
                    <option value={5}>Últimas 5 rodadas</option>
                    <option value={10}>Últimas 10 rodadas</option>
                    <option value={0}>Campeonato inteiro</option>
                  </select>
                </div>
                <div style={{fontSize:11,color:C.textMuted,marginTop:6,lineHeight:1.5}}>
                  ⚠ Requer mínimo de 2 rodadas finalizadas. Com menos de 2, aparece "—" na tabela.
                </div>
              </div>
            </div>

            {/* Configuração da Rodada */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Configuração da Rodada</div>
              <div className="a-card">
                <div className="a-row">
                  <span className="a-lbl">Nome:</span>
                  <input className="a-in lg" value={adminBuf.name||''} onChange={e=>setAdminBuf((b:any)=>({...b,name:e.target.value}))} placeholder="ex: Fase de Grupos"/>
                </div>
                <div className="a-row">
                  <span className="a-lbl">Nº Rodada:</span>
                  <input className="a-in sm" type="number" min={1} value={adminBuf.number||1} onChange={e=>setAdminBuf((b:any)=>({...b,number:parseInt(e.target.value)||1}))} placeholder="1"/>
                  <span style={{fontSize:12,color:C.textMuted}}>Aparece como "Rodada {adminBuf.number||1}" abaixo do nome</span>
                </div>
                <div className="a-row"><span className="a-lbl">Fase:</span>
                  <select className="a-sel" value={adminBuf.phase||'grupos'} onChange={e=>setAdminBuf((b:any)=>({...b,phase:e.target.value}))}>
                    <option value="grupos">Fase de Grupos</option>
                    <option value="dezesseis">Dezesseis avos de Final</option>
                    <option value="oitavas">Oitavas de Final</option>
                    <option value="quartas">Quartas de Final</option>
                    <option value="semi">Semifinal</option>
                    <option value="terceiro">Disputa 3º Lugar</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div className="a-row"><span className="a-lbl">Palpites:</span>
                  <label className="toggle"><input type="checkbox" checked={adminBuf.open??true} onChange={e=>setAdminBuf((b:any)=>({...b,open:e.target.checked}))}/><span className="tsl"/></label>
                  <span style={{fontSize:13}}>{adminBuf.open?'Abertos':'Fechados'}</span>
                </div>
              </div>

              {(adminBuf.matches||[]).map((m:any,idx:number)=>(
                <div key={m.id} className="a-card">
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:13,color:C.gold,letterSpacing:1}}>JOGO {idx+1}</span>
                    <button className="rm-btn" onClick={()=>setAdminBuf((b:any)=>({...b,matches:b.matches.filter((x:any)=>x.id!==m.id)}))}>Remover</button>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Casa:</span>
                    {m.homeLogo
                      ? <img src={m.homeLogo} alt="" style={{width:40,height:40,objectFit:'contain',borderRadius:4}}/>
                      : <input className="a-in" style={{width:50}} value={m.homeFlag||''} placeholder="🏳" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,homeFlag:e.target.value}:x)}))}/>
                    }
                    <input className="a-in lg" value={m.home} placeholder="País Casa" onChange={e=>{
                      const logo = getSelecaoLogo(e.target.value)
                      setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,home:e.target.value,homeLogo:logo,homeFlag:logo?'':x.homeFlag}:x)}))
                    }}/>
                    {m.homeLogo&&<button className="rm-btn" style={{padding:'3px 8px',fontSize:10}} onClick={()=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,homeLogo:'',homeFlag:'🏳'}:x)}))}>✕</button>}
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Fora:</span>
                    {m.awayLogo
                      ? <img src={m.awayLogo} alt="" style={{width:40,height:40,objectFit:'contain',borderRadius:4}}/>
                      : <input className="a-in" style={{width:50}} value={m.awayFlag||''} placeholder="🏳" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,awayFlag:e.target.value}:x)}))}/>
                    }
                    <input className="a-in lg" value={m.away} placeholder="País Fora" onChange={e=>{
                      const logo = getSelecaoLogo(e.target.value)
                      setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,away:e.target.value,awayLogo:logo,awayFlag:logo?'':x.awayFlag}:x)}))
                    }}/>
                    {m.awayLogo&&<button className="rm-btn" style={{padding:'3px 8px',fontSize:10}} onClick={()=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,awayLogo:'',awayFlag:'🏳'}:x)}))}>✕</button>}
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Data:</span>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      <input className="a-in md" value={m.date||''} placeholder="DD/MM" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,date:e.target.value}:x)}))}/>
                      {/* CORREÇÃO #2 — Alerta data vazia */}
                      {!m.date && (
                        <div className="date-warn">⚠️ Sem data — travamento usará o dia atual!</div>
                      )}
                    </div>
                    <span className="a-lbl">Horário:</span>
                    <input className="a-in md" value={m.time||''} placeholder="ex: 19:00" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,time:e.target.value}:x)}))}/>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Travado:</span>
                    <label className="toggle"><input type="checkbox" checked={m.locked||false} onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,locked:e.target.checked}:x)}))}/><span className="tsl"/></label>
                    <span style={{fontSize:12,color:m.locked?C.red:C.textMuted}}>{m.locked?'🔒 Travado manualmente':'Automático'}</span>
                  </div>
                  <div className="extras-admin">
                    <div className="extras-admin-title">Extras</div>
                    <div className="extras-checks">
                      <label className="extra-check" style={{
                        background: m.hasQuemAvanca ? 'rgba(212,175,55,0.15)' : 'transparent',
                        border: `1px solid ${m.hasQuemAvanca ? C.gold : 'transparent'}`,
                        borderRadius: 6, padding: '6px 12px', transition: 'all .2s',
                        color: m.hasQuemAvanca ? C.gold : C.textMuted
                      }}>
                        <input type="checkbox" checked={m.hasQuemAvanca||false} onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,hasQuemAvanca:e.target.checked}:x)}))}/>
                        🏴 Quem Avança? {m.hasQuemAvanca && <span style={{marginLeft:4,fontSize:10,fontWeight:700}}>✓ ATIVO</span>}
                      </label>
                      <label className="extra-check" style={{
                        background: m.hasPenaltis ? 'rgba(212,175,55,0.15)' : 'transparent',
                        border: `1px solid ${m.hasPenaltis ? C.gold : 'transparent'}`,
                        borderRadius: 6, padding: '6px 12px', transition: 'all .2s',
                        color: m.hasPenaltis ? C.gold : C.textMuted
                      }}>
                        <input type="checkbox" checked={m.hasPenaltis||false} onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,hasPenaltis:e.target.checked}:x)}))}/>
                        ⚽ Pênaltis? {m.hasPenaltis && <span style={{marginLeft:4,fontSize:10,fontWeight:700}}>✓ ATIVO</span>}
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-btn" onClick={()=>setAdminBuf((b:any)=>({...b,matches:[...(b.matches||[]),{id:'m'+Date.now(),home:'',away:'',homeFlag:'',awayFlag:'',date:'',time:'',locked:false,hasQuemAvanca:false,hasPenaltis:false}]}))}>+ Adicionar Jogo</button>
              <div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap'}}>
                <button className="btn-sm btn-gold" onClick={saveRoundConfig}>💾 Salvar Rodada</button>
                <button className="btn-sm btn-green" onClick={finalizeRound}>✔ Finalizar Rodada</button>
                <button className="btn-sm btn-danger" onClick={clearPalpites}>🗑 Limpar Palpites</button>
              </div>
            </div>

            {/* Resultado & Correção */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Resultado & Correção</div>
              <div className="a-card">
                {state.round.matches.map((m:any)=>(
                  <div key={m.id} style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.borderFaint}`}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:8,color:C.text}}>{m.home||'?'} × {m.away||'?'}</div>
                    <div className="a-row" style={{marginBottom:6}}>
                      <span className="a-lbl">Placar:</span>
                      <input className="a-in sm" type="number" inputMode="numeric" min={0} value={resultInputs[m.id]?.h||''} placeholder="0" onChange={e=>setResultInputs((r:any)=>({...r,[m.id]:{...r[m.id],h:e.target.value}}))}/>
                      <span style={{color:C.textMuted}}>×</span>
                      <input className="a-in sm" type="number" inputMode="numeric" min={0} value={resultInputs[m.id]?.a||''} placeholder="0" onChange={e=>setResultInputs((r:any)=>({...r,[m.id]:{...r[m.id],a:e.target.value}}))}/>
                    </div>
                    {m.hasQuemAvanca&&<div className="a-row" style={{marginBottom:4}}>
                      <span className="a-lbl">Avançou:</span>
                      <select className="a-sel" value={extraResults[m.id]?.quemAvanca||''} onChange={e=>setExtraResults((er:any)=>({...er,[m.id]:{...er[m.id],quemAvanca:e.target.value}}))}>
                        <option value="">Selecione...</option>
                        <option value={m.home}>{m.home}</option>
                        <option value={m.away}>{m.away}</option>
                      </select>
                    </div>}
                    {m.hasPenaltis&&<div className="a-row">
                      <span className="a-lbl">Pênaltis:</span>
                      <label className="toggle"><input type="checkbox" checked={extraResults[m.id]?.foiPenaltis||false} onChange={e=>setExtraResults((er:any)=>({...er,[m.id]:{...er[m.id],foiPenaltis:e.target.checked}}))}/><span className="tsl"/></label>
                      <span style={{fontSize:12}}>{extraResults[m.id]?.foiPenaltis?'Sim':'Não'}</span>
                    </div>}
                  </div>
                ))}
                <button className="btn-sm btn-gold" onClick={applyCorrection}>⚡ Calcular Pontos Automaticamente</button>
              </div>
              {/* ── Quadro de Palpiteiros ── */}
              <div style={{marginTop:16}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:2,color:C.textMuted,textTransform:'uppercase',marginBottom:10}}>Quadro de Palpiteiros</div>
                {/* Grade de seleção */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:6,marginBottom:14}}>
                  {PLAYERS.map(p=>{
                    const roundPts=Object.values(state.correctedScores[p]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number
                    const hasPal = !!(state.palpites[p]&&Object.keys(state.palpites[p]).length>0)
                    const isSelected = selectedCorrPlayer===p
                    const initials = p.split(' ').map((w:string)=>w[0]).join('').substring(0,2).toUpperCase()
                    return (
                      <button key={p} onClick={()=>setSelectedCorrPlayer(isSelected?null:p)}
                        style={{
                          background: isSelected ? 'rgba(212,175,55,.18)' : dm?'rgba(0,40,20,.5)':'rgba(0,80,40,.06)',
                          border: `1px solid ${isSelected?C.gold:C.borderFaint}`,
                          borderRadius:8, padding:'10px 6px', cursor:'pointer',
                          display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                          transition:'all .15s'
                        }}>
                        <div style={{width:36,height:36,borderRadius:'50%',
                          background:hasPal?`linear-gradient(135deg,${C.gold},#a07820)`:'rgba(255,255,255,.08)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontFamily:"'Barlow Condensed'",fontWeight:700,fontSize:13,
                          color:hasPal?'#001a0a':C.textMuted,border:`2px solid ${isSelected?C.gold:'transparent'}`}}>
                          {initials}
                        </div>
                        <div style={{fontSize:11,color:isSelected?C.gold:C.text,fontWeight:isSelected?700:400,textAlign:'center',lineHeight:1.2}}>{p.split(' ')[0]}</div>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:roundPts>0?C.green:C.textMuted,lineHeight:1}}>{roundPts>0?`+${roundPts}`:'—'}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Painel do jogador selecionado */}
                {selectedCorrPlayer && (()=>{
                  const p = selectedCorrPlayer
                  const roundPts=Object.values(state.correctedScores[p]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number
                  return (
                    <div style={{background:dm?'rgba(0,30,15,.8)':'rgba(0,60,30,.06)',border:`1px solid ${C.gold}44`,borderRadius:10,padding:'14px 16px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,${C.gold},#a07820)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed'",fontWeight:700,fontSize:15,color:'#001a0a'}}>
                            {p.split(' ').map((w:string)=>w[0]).join('').substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:C.gold,letterSpacing:1}}>{p}</div>
                            <div style={{fontSize:11,color:C.textMuted}}>{roundPts} pts nesta rodada · {state.totalPoints[p]||0} total</div>
                          </div>
                        </div>
                        <button onClick={()=>setSelectedCorrPlayer(null)} style={{background:'transparent',border:`1px solid ${C.borderFaint}`,color:C.textMuted,borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12}}>✕ Fechar</button>
                      </div>

                      {state.round.matches.length===0 && <div style={{fontSize:13,color:C.textMuted,textAlign:'center',padding:'10px 0'}}>Nenhum jogo configurado.</div>}
                      {state.round.matches.map((m:any)=>{
                        const pal=state.palpites[p]?.[m.id]
                        const res=state.results[m.id]
                        const pts=state.correctedScores[p]?.[m.id]
                        const key=`${p}-${m.id}`
                        const locked = isMatchLocked(m, state.round.matches.indexOf(m))
                        return (
                          <div key={m.id} style={{padding:'10px 0',borderBottom:`1px solid ${C.borderFaint}`}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6,marginBottom:6}}>
                              <span style={{fontSize:13,fontWeight:600,color:C.text}}>{m.home} × {m.away}</span>
                              {locked && <span style={{fontSize:10,color:C.textMuted,background:'rgba(255,255,255,.06)',padding:'2px 6px',borderRadius:4}}>🔒 Travado</span>}
                            </div>
                            <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
                              <div style={{fontSize:12,color:C.textMuted}}>
                                Palpite: <b style={{color:pal&&pal.h!==''?C.text:C.textSub,fontFamily:"'Bebas Neue'",fontSize:15}}>
                                  {pal&&pal.h!==''?`${pal.h}×${pal.a}`:'NP'}
                                </b>
                              </div>
                              <div style={{fontSize:12,color:C.textMuted}}>
                                Resultado: <b style={{color:res&&res.h!==''?C.gold:C.textSub,fontFamily:"'Bebas Neue'",fontSize:15}}>
                                  {res&&res.h!==''?`${res.h}×${res.a}`:'—'}
                                </b>
                              </div>
                              {pts!==undefined && <span className={`pts-badge pts-${Math.min(pts,5)}`}>{pts}pt</span>}
                            </div>
                            <div style={{display:'flex',gap:6,alignItems:'center',marginTop:8}}>
                              <span style={{fontSize:11,color:C.textMuted}}>Corrigir pts:</span>
                              <input className="a-in sm" type="number" inputMode="numeric" min={0}
                                value={manualPts[key]??pts??''} placeholder="—"
                                onChange={e=>setManualPts((mp:any)=>({...mp,[key]:e.target.value}))}/>
                              <button className="btn-sm btn-outline" style={{padding:'5px 12px',fontSize:11}} onClick={()=>applyManualPts(p,m.id)}>✓ Ok</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Esquema de Pontuação */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Esquema de Pontuação</div>
              {scoringPhases.map((ph:any,phIdx:number)=>(
                <div key={ph.id} className="a-card">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                    <input className="a-in md" value={ph.name} onChange={e=>setScoringPhases(ps=>ps.map((p:any,i)=>i===phIdx?{...p,name:e.target.value}:p))} placeholder="Nome da fase"/>
                    <button className="rm-btn" onClick={()=>setScoringPhases(ps=>ps.filter((_:any,i)=>i!==phIdx))}>Remover</button>
                  </div>
                  {ph.rules.map((r:any,ri:number)=>(
                    <div key={ri} className="a-row" style={{marginBottom:6}}>
                      <input className="a-in lg" value={r.desc} placeholder="Descrição" onChange={e=>setScoringPhases(ps=>ps.map((p:any,i)=>i===phIdx?{...p,rules:p.rules.map((rr:any,j:number)=>j===ri?{...rr,desc:e.target.value}:rr)}:p))}/>
                      <input className="a-in sm" type="number" min={0} value={r.pts} onChange={e=>setScoringPhases(ps=>ps.map((p:any,i)=>i===phIdx?{...p,rules:p.rules.map((rr:any,j:number)=>j===ri?{...rr,pts:parseInt(e.target.value)||0}:rr)}:p))}/>
                      <button className="rm-btn" onClick={()=>setScoringPhases(ps=>ps.map((p:any,i)=>i===phIdx?{...p,rules:p.rules.filter((_:any,j:number)=>j!==ri)}:p))}>−</button>
                    </div>
                  ))}
                  <button className="add-btn" style={{marginTop:6}} onClick={()=>setScoringPhases(ps=>ps.map((p:any,i)=>i===phIdx?{...p,rules:[...p.rules,{desc:'',pts:0}]}:p))}>+ Regra</button>
                </div>
              ))}
              <button className="add-btn" onClick={()=>setScoringPhases(ps=>[...ps,{id:'ph'+Date.now(),name:'Nova Fase',rules:[{desc:'Acertar o vencedor',pts:1}]}])}>+ Adicionar Fase</button>
              <div className="a-card" style={{marginTop:12}}>
                <div style={{fontFamily:"'Barlow Condensed'",fontSize:13,fontWeight:600,color:C.gold,letterSpacing:1,marginBottom:10}}>Multiplicadores Extras</div>
                <div className="a-row">
                  <span className="a-lbl">Quem Avança (base):</span>
                  <input className="a-in sm" type="number" min={0} value={multipliersBuf.quemAvanca??2} onChange={e=>setMultipliersBuf((b:any)=>({...b,quemAvanca:parseInt(e.target.value)||0}))}/>
                  <span style={{fontSize:11,color:C.textMuted}}>× mult. da fase</span>
                </div>
                <div className="a-row">
                  <span className="a-lbl">Bônus Pênaltis:</span>
                  <input className="a-in sm" type="number" min={0} value={multipliersBuf.penaltisBonus??1} onChange={e=>setMultipliersBuf((b:any)=>({...b,penaltisBonus:parseInt(e.target.value)||0}))}/>
                  <span style={{fontSize:11,color:C.textMuted}}>pts fixos</span>
                </div>
              </div>
              <div style={{marginTop:12}}><button className="btn-sm btn-gold" onClick={saveScoringConfig}>💾 Salvar Pontuação</button></div>
            </div>

            {/* Pior Palpiteiro */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Pior Palpiteiro</div>
              <div className="a-card">
                <div className="a-row"><span className="a-lbl">Nome:</span>
                  <select className="a-sel" value={shamePlayer} onChange={e=>setShamePlayer(e.target.value)}>
                    <option value="">Nenhum</option>
                    {PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="a-row"><span className="a-lbl">Foto URL:</span>
                  <input className="a-in lg" value={shameUrl} onChange={e=>setShameUrl(e.target.value)} placeholder="https://..."/>
                </div>
                <div className="a-row" style={{alignItems:'flex-start'}}>
                  <span className="a-lbl" style={{paddingTop:6}}>Texto:</span>
                  <textarea value={shameText} onChange={e=>setShameText(e.target.value)}
                    placeholder="Mensagem opcional abaixo do nome..." rows={3}
                    style={{flex:1,background:C.bgInput,border:`1px solid ${dm?'rgba(212,175,55,.25)':C.border}`,color:C.text,fontSize:13,padding:'7px 12px',borderRadius:5,outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.4}}/>
                </div>
                <div style={{marginTop:10,display:'flex',gap:8}}>
                  <button className="btn-sm btn-gold" onClick={saveShame}>💾 Salvar</button>
                  <button className="btn-sm btn-outline" onClick={()=>{setShamePlayer('');setShameUrl('');setShameText('')}}>Limpar</button>
                </div>
              </div>
            </div>

            {/* Conheça os Adms */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Conheça os Adms</div>
              <div style={{fontSize:12,color:C.textMuted,marginBottom:12,lineHeight:1.5}}>
                Esses dados aparecem na aba Guia para todos os participantes.
              </div>
              {adminsBuf.map((adm:any, idx:number)=>(
                <div key={adm.id} className="a-card" style={{marginBottom:12}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:13,color:C.gold,letterSpacing:1}}>ADM {idx+1}</span>
                    <button className="rm-btn" onClick={()=>setAdminsBuf(b=>b.filter((_:any,i:number)=>i!==idx))}>Remover</button>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Nome:</span>
                    <input className="a-in lg" value={adm.nome||''} placeholder="Nome completo" onChange={e=>setAdminsBuf(b=>b.map((x:any,i:number)=>i===idx?{...x,nome:e.target.value}:x))}/>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Vulgo:</span>
                    <input className="a-in lg" value={adm.vulgo||''} placeholder="Apelido zueiro..." onChange={e=>setAdminsBuf(b=>b.map((x:any,i:number)=>i===idx?{...x,vulgo:e.target.value}:x))}/>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Foto URL:</span>
                    <input className="a-in lg" value={adm.foto||''} placeholder="https://..." onChange={e=>setAdminsBuf(b=>b.map((x:any,i:number)=>i===idx?{...x,foto:e.target.value}:x))}/>
                  </div>
                  <div className="a-row" style={{alignItems:'flex-start'}}>
                    <span className="a-lbl" style={{paddingTop:6}}>Descrição:</span>
                    <textarea value={adm.descricao||''} onChange={e=>setAdminsBuf(b=>b.map((x:any,i:number)=>i===idx?{...x,descricao:e.target.value}:x))}
                      placeholder="Textinho zueiro sobre esse adm..." rows={3}
                      style={{flex:1,background:C.bgInput,border:`1px solid ${dm?'rgba(212,175,55,.25)':C.border}`,color:C.text,fontSize:13,padding:'7px 12px',borderRadius:5,outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.4}}/>
                  </div>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:4}}>
                <button className="add-btn" onClick={()=>setAdminsBuf(b=>[...b,{id:'adm_'+Date.now(),nome:'',vulgo:'',foto:'',descricao:''}])}>+ Adicionar Adm</button>
                <button className="btn-sm btn-gold" onClick={saveAdmins}>💾 Salvar Adms</button>
              </div>
            </div>

            {/* Notificação Push */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Enviar Notificação Push</div>
              <div className="a-card">
                <div style={{fontSize:12,color:C.textMuted,marginBottom:12,lineHeight:1.5}}>
                  Envia uma notificação push para todos os participantes que ativaram as notificações.
                </div>
                <div className="a-row"><span className="a-lbl">Título:</span>
                  <input className="a-in lg" value={notifTitle} onChange={e=>setNotifTitle(e.target.value)} placeholder="ex: 🟢 Rodada aberta!"/>
                </div>
                <div className="a-row" style={{alignItems:'flex-start'}}>
                  <span className="a-lbl" style={{paddingTop:6}}>Mensagem:</span>
                  <textarea value={notifMsg} onChange={e=>setNotifMsg(e.target.value)}
                    placeholder="ex: A Rodada 3 está aberta! Você tem até 19h para palpitar." rows={3}
                    style={{flex:1,background:C.bgInput,border:`1px solid ${dm?'rgba(212,175,55,.25)':C.border}`,color:C.text,fontSize:13,padding:'7px 12px',borderRadius:5,outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.4}}/>
                </div>
                <div style={{marginTop:10,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                  <button className="btn-sm btn-gold" onClick={sendPushNotification} disabled={notifSending||!notifTitle.trim()||!notifMsg.trim()}>
                    {notifSending?'Enviando...':'🔔 Enviar para Todos'}
                  </button>
                  <span style={{fontSize:11,color:C.textMuted}}>Só recebem quem ativou as notificações</span>
                </div>
              </div>
            </div>

            {/* Novidades */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Novidades</div>
              <div className="a-card">
                <div style={{fontSize:12,color:C.textMuted,marginBottom:12,lineHeight:1.5}}>
                  Publique uma novidade para aparecer como pop-up quando os participantes entrarem no app.
                </div>
                <div className="a-row"><span className="a-lbl">Título:</span>
                  <input className="a-in lg" value={novidadeBuf.titulo} onChange={e=>setNovidadeBuf(b=>({...b,titulo:e.target.value}))} placeholder="ex: Nova aba Guia disponível!"/>
                </div>
                <div className="a-row" style={{alignItems:'flex-start'}}>
                  <span className="a-lbl" style={{paddingTop:6}}>Resumo:</span>
                  <textarea value={novidadeBuf.resumo} onChange={e=>setNovidadeBuf(b=>({...b,resumo:e.target.value}))}
                    placeholder="Breve descrição do que foi adicionado ou alterado..." rows={3}
                    style={{flex:1,background:C.bgInput,border:`1px solid ${dm?'rgba(212,175,55,.25)':C.border}`,color:C.text,fontSize:13,padding:'7px 12px',borderRadius:5,outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.4}}/>
                </div>
                <div style={{marginTop:10}}>
                  <button className="btn-sm btn-gold" onClick={saveNovidade} disabled={!novidadeBuf.titulo.trim()}>🆕 Publicar Novidade</button>
                </div>
              </div>
              {(state.novidades||[]).length > 0 && (
                <div className="a-card">
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:600,letterSpacing:1,color:C.textMuted,marginBottom:10}}>PUBLICADAS</div>
                  {[...(state.novidades||[])].reverse().map((n:any)=>(
                    <div key={n.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:`1px solid ${C.borderFaint}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.text}}>{n.titulo}</div>
                        {n.resumo&&<div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{n.resumo}</div>}
                        <div style={{fontSize:11,color:C.textMuted,marginTop:3}}>{n.data}</div>
                      </div>
                      <button className="rm-btn" onClick={()=>removeNovidade(n.id)}>Remover</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Log de Ações */}
            <div style={{marginBottom:24}}>
              <div className="section-title">📋 Log de Ações</div>
              <div className="a-card" style={{padding:0,overflow:'hidden'}}>
                {(state.adminLog||[]).length===0
                  ? <div style={{padding:'16px',fontSize:13,color:C.textMuted,textAlign:'center'}}>Nenhuma ação registrada ainda.</div>
                  : <div style={{maxHeight:260,overflowY:'auto'}}>
                      {(state.adminLog||[]).map((log:any, i:number)=>(
                        <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 14px',borderBottom:`1px solid ${C.borderFaint}`,background:i%2===0?'transparent':dm?'rgba(255,255,255,.02)':'rgba(0,0,0,.02)'}}>
                          <div style={{fontSize:10,color:C.textMuted,whiteSpace:'nowrap',flexShrink:0,paddingTop:1}}>
                            {new Date(log.ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                          </div>
                          <div style={{fontSize:12,color:C.text,lineHeight:1.4}}>{log.action}</div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>

            {/* Dados & Segurança */}
            <div style={{marginBottom:24}}>
              <div className="section-title">Dados & Segurança</div>
              <div className="reset-box">
                <div className="reset-title">🗑 Zerar Todos os Dados</div>
                <div className="reset-desc">Apaga palpites, pontuações, resultados e histórico.<br/>Mantém: pontuação, senha admin e jogadores.</div>
                <button className="btn-sm btn-danger" onClick={()=>setShowResetModal(true)}>⚠ Zerar Tudo</button>
              </div>
              <div className="a-card">
                <div style={{fontFamily:"'Barlow Condensed'",fontSize:13,fontWeight:600,color:C.gold,letterSpacing:1,marginBottom:10}}>Alterar Senha Admin</div>
                <div className="a-row"><span className="a-lbl">Nova Senha:</span><input className="a-in md" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nova senha admin"/></div>
                <div className="a-row"><span className="a-lbl">Senha Master:</span><input className="a-in md" type="password" value={masterConf} onChange={e=>setMasterConf(e.target.value)} placeholder="Confirmar com master"/></div>
                <div style={{marginTop:10}}><button className="btn-sm btn-danger" onClick={changeAdminPass}>🔑 Alterar Senha</button></div>
                <div style={{marginTop:8,fontSize:11,color:C.textMuted}}>A senha master nunca muda.</div>
              </div>
            </div>
          </div>}
        </>}
      </div>
    </>
  )
}

// ── ABA GUIA ────────────────────────────────────────────────────────────────
function GuiaTab({ C, dm, state, guideTextStyle, guideTipStyle, guideHighlight, requestPushPermission, pushStatus }: any) {
  const [osTab, setOsTab] = useState<'android'|'iphone'>('android')
  const admins: any[] = state?.admins || []

  return (
    <div>
      <div style={{background:dm?'linear-gradient(135deg,rgba(0,60,30,.7),rgba(0,30,60,.5))':'linear-gradient(135deg,rgba(0,80,40,.1),rgba(0,30,80,.05))',border:`1px solid ${C.border}`,borderRadius:8,padding:20,marginBottom:20,textAlign:'center'}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:4,color:C.gold,marginBottom:6}}>📖 GUIA DO PALPITÃO</div>
        <div style={{fontSize:13,color:C.textMuted,lineHeight:1.5}}>Tudo que você precisa saber para palpitar, pontuar e ganhar 🏆</div>
      </div>

      {/* ── Conheça os Adms ── */}
      {admins.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'12px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:16}}>👑 Conheça os Adms</div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
            {admins.map((adm:any)=>(
              <div key={adm.id} style={{background:dm?'rgba(0,40,20,.6)':'rgba(0,80,40,.06)',border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                {adm.foto && (
                  <img src={adm.foto} alt={adm.nome} style={{width:'100%',maxHeight:220,objectFit:'cover',display:'block'}}/>
                )}
                <div style={{padding:'14px 16px'}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap' as const,marginBottom:6}}>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:C.gold,letterSpacing:2}}>{adm.nome||'—'}</span>
                    {adm.vulgo && <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:600,color:C.textMuted,letterSpacing:1}}>"{adm.vulgo}"</span>}
                  </div>
                  {adm.descricao && <p style={{fontSize:13,color:C.text,lineHeight:1.6,margin:0}}>{adm.descricao}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'12px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>⚽ Pontuação</div>

      <GuiaItem title="Como funciona a pontuação?" icon="🎯" defaultOpen={true}>
        <div style={guideTextStyle}>
          {state.scoringPhases.map((ph:any)=>(
            <div key={ph.id} style={{marginBottom:14}}>
              <div style={{...guideHighlight,fontSize:13,marginBottom:8,color:C.gold}}>{ph.name}</div>
              {ph.rules.map((r:any,i:number)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <span style={{background:i===2?'rgba(0,166,81,.3)':i===1?'rgba(212,175,55,.2)':'rgba(255,255,255,.08)',color:i===2?'#00c060':i===1?C.gold:C.textMuted,border:`1px solid ${i===2?'rgba(0,166,81,.4)':i===1?'rgba(212,175,55,.35)':'rgba(255,255,255,.12)'}`,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700,minWidth:36,textAlign:'center' as const}}>
                    {r.pts}pts
                  </span>
                  <span style={{fontSize:13}}>{r.desc}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{borderTop:`1px solid ${C.borderFaint}`,paddingTop:10,marginTop:4,display:'flex',gap:16,flexWrap:'wrap' as const}}>
            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:C.textMuted}}>
              <span style={{background:'rgba(212,175,55,.2)',color:C.gold,border:'1px solid rgba(212,175,55,.35)',borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>+{state.multipliers?.quemAvanca??2}×</span>
              Bônus quem avança (× mult. da fase)
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:C.textMuted}}>
              <span style={{background:'rgba(255,255,255,.08)',color:C.textMuted,border:'1px solid rgba(255,255,255,.12)',borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>+{state.multipliers?.penaltisBonus??1}</span>
              Bônus acertar pênaltis
            </div>
          </div>
        </div>
        <div style={guideTipStyle}>
          💡 <b>Multiplicadores por fase:</b> Fase de Grupos ×1 · 16avos ×2 · Oitavas ×3 · Quartas ×4 · Semi ×5 · 3º Lugar e Final ×6
        </div>
      </GuiaItem>

      <GuiaItem title="Como funciona o desempate?" icon="⚖️">
        <div style={guideTextStyle}>
          <p style={{marginBottom:10}}>Quando dois ou mais participantes têm a mesma pontuação total, o desempate segue esta ordem:</p>
          <GuiaStep n={1} text="Maior número de placares exatos acertados (ex: acertou 2x1 quando o resultado foi 2x1)"/>
          <GuiaStep n={2} text="Maior número de resultados corretos (vencedor ou empate, independente do placar)"/>
          <GuiaStep n={3} text="Pedra, papel e tesoura ✂️ — pode o melhor vencer!"/>
        </div>
      </GuiaItem>

      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'16px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>🏆 Ranking & Estatísticas</div>

      <GuiaItem title="Como funciona o Ranking?" icon="🏆">
        <div style={guideTextStyle}>
          <p style={{marginBottom:10}}>O ranking acumula pontos de todas as rodadas finalizadas. As colunas da tabela:</p>
          <div style={{display:'flex',flexDirection:'column' as const,gap:8,marginBottom:12}}>
            {[
              {col:'Pontos',      desc:'Total acumulado de todas as rodadas.',                                                                   color:'#D4AF37'},
              {col:'Exatos',      desc:'Quantas vezes acertou o placar exato (ex: palpitou 2x1, resultado foi 2x1).',                          color:'#00c060'},
              {col:'Vencedor',    desc:'Quantas vezes acertou quem venceu ou empate, mesmo sem acertar o placar.',                              color:'#3498db'},
              {col:'Saldo',       desc:'Quantas vezes acertou a diferença de gols sem acertar o placar exato.',                                 color:'#e67e22'},
              {col:'Projeção %',  desc:'Chance estimada de ser campeão baseada na média recente. Requer ao menos 2 rodadas finalizadas.',       color:'#9b59b6'},
            ].map(({col,desc,color})=>(
              <div key={col} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <span style={{background:`${color}22`,color,border:`1px solid ${color}44`,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700,minWidth:82,textAlign:'center' as const,flexShrink:0}}>{col}</span>
                <span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{desc}</span>
              </div>
            ))}
          </div>
          <div style={guideTipStyle}>
            ⚖️ <b>Desempate:</b> Exatos → Vencedor → Saldo
          </div>
        </div>
      </GuiaItem>

      <GuiaItem title="Como funciona o Comparativo Frente a Frente?" icon="⚔️">
        <div style={guideTextStyle}>
          <p style={{marginBottom:8}}>Na aba <b style={guideHighlight}>Ranking</b>, toque em qualquer participante para ver seus palpites comparados lado a lado.</p>
          <p>Antes do admin lançar o resultado, você só vê seus próprios palpites — os do outro ficam ocultos até o resultado ser publicado.</p>
        </div>
      </GuiaItem>

      <GuiaItem title="O que são as Conquistas?" icon="🏅">
        <div style={guideTextStyle}>
          <p style={{marginBottom:10}}>Conquistas aparecem nas suas Estatísticas Pessoais (final da aba Ranking) conforme você evolui:</p>
          <div style={{display:'flex',flexDirection:'column' as const,gap:6}}>
            {[
              {icon:'🎯', label:'Sniper',      desc:'1+ placar exato acertado'},
              {icon:'🔥', label:'Em Chamas',   desc:'5+ placares exatos acertados'},
              {icon:'💪', label:'Veterano',    desc:'Participou de 3+ rodadas'},
              {icon:'⚡', label:'Consistente', desc:'10+ vencedores acertados'},
              {icon:'📐', label:'Calculista',  desc:'5+ saldos de gols acertados'},
            ].map(({icon,label,desc})=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
                <span style={{fontSize:20}}>{icon}</span>
                <div>
                  <span style={{fontSize:12,fontWeight:600,color:C.gold}}>{label}</span>
                  <span style={{fontSize:12,color:C.textMuted,marginLeft:6}}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GuiaItem>

      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'16px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>📋 Regras do Palpite</div>

      <GuiaItem title="Como e quando palpitar?" icon="✏️" defaultOpen={true}>
        <div style={guideTextStyle}>
          <GuiaStep n={1} text="Entre no app e selecione seu nome na tela inicial."/>
          <GuiaStep n={2} text='Vá até a aba "Palpites" e preencha o placar que você acredita que vai acontecer em cada jogo.'/>
          <GuiaStep n={3} text="Clique em Salvar Palpites. Você pode editar quantas vezes quiser até o prazo!"/>
        </div>
        <div style={guideTipStyle}>
          ⏱ <b>Prazo:</b> o 1º jogo da rodada trava no apito inicial. Os demais travam <b>30 minutos antes</b> do horário marcado.
        </div>
      </GuiaItem>

      <GuiaItem title="Quem não palpitar perde pontos?" icon="⚠️">
        <div style={guideTextStyle}>
          <p>Sim. Quem não enviar o palpite até o prazo recebe <b style={{color:C.red}}>0 pontos</b> naquele jogo — não existe palpite padrão.</p>
          <p style={{marginTop:8}}>Fique de olho no banner de aviso na tela Início que aparece quando você ainda tem palpites pendentes!</p>
        </div>
      </GuiaItem>

      <GuiaItem title="O que são os extras (Quem Avança / Pênaltis)?" icon="🏴">
        <div style={guideTextStyle}>
          <p style={{marginBottom:10}}>Em fases eliminatórias, o admin pode ativar perguntas extras:</p>
          <div style={{marginBottom:8}}>
            <span style={guideHighlight}>🏴 Quem Avança?</span>
            <p style={{marginTop:4}}>Você escolhe qual time passa para a próxima fase. Se acertar, ganha pontos bônus multiplicados pela fase.</p>
          </div>
          <div>
            <span style={guideHighlight}>⚽ Vai para Pênaltis?</span>
            <p style={{marginTop:4}}>Se você apostou em empate no tempo normal E acertou que foi para pênaltis, ganha pontos bônus fixos.</p>
          </div>
        </div>
      </GuiaItem>

      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'16px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>📱 Instalar no Celular</div>

      <GuiaItem title="Adicionar à tela inicial (app sem instalar)" icon="📲" defaultOpen={true}>
        <p style={{...guideTextStyle,marginBottom:14,color:C.textMuted}}>
          Adicionar o Palpitão à tela inicial deixa ele com cara de app — abre em tela cheia, sem barra do navegador. Selecione seu sistema:
        </p>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <button className={`os-tab${osTab==='android'?' active':''}`} onClick={()=>setOsTab('android')}>🤖 Android</button>
          <button className={`os-tab${osTab==='iphone'?' active':''}`} onClick={()=>setOsTab('iphone')}>🍎 iPhone</button>
        </div>
        {osTab==='android' && (
          <div>
            <div style={{...guideTextStyle,marginBottom:10,fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:600,letterSpacing:1,color:C.gold}}>USANDO CHROME (recomendado)</div>
            <GuiaStep n={1} text='Abra o site no Chrome e toque nos 3 pontinhos ⋮ no canto superior direito.'/>
            <GuiaStep n={2} text='Toque em "Adicionar à tela inicial" ou "Instalar app".'/>
            <GuiaStep n={3} text='Confirme tocando em "Adicionar". Pronto! O ícone aparece na sua tela.'/>
            <div style={guideTipStyle}>
              💡 Se aparecer um banner automático "Instalar Palpitão" na parte de baixo da tela, é só tocar nele — ainda mais fácil!
            </div>
          </div>
        )}
        {osTab==='iphone' && (
          <div>
            <div style={{...guideTextStyle,marginBottom:10,fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:600,letterSpacing:1,color:C.gold}}>USANDO SAFARI (obrigatório no iPhone)</div>
            <GuiaStep n={1} text='Abra o site no Safari (não funciona no Chrome do iPhone para isso).'/>
            <GuiaStep n={2} text='Toque no ícone de compartilhar 〒 na barra inferior do Safari.'/>
            <GuiaStep n={3} text='Role para baixo e toque em "Adicionar à Tela de Início".'/>
            <GuiaStep n={4} text='Confirme o nome e toque em "Adicionar" no canto superior direito.'/>
            <div style={guideTipStyle}>
              ⚠️ <b>iPhone:</b> notificações push só funcionam se o app estiver adicionado à tela inicial pelo Safari.
            </div>
          </div>
        )}
      </GuiaItem>

      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'16px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>🔔 Notificações</div>

      <GuiaItem title="Como ativar notificações?" icon="🔔">
        <div style={guideTextStyle}>
          <p style={{marginBottom:12}}>As notificações avisam quando uma nova rodada abre, para você não perder o prazo!</p>
          <div style={{marginBottom:12}}>
            <div style={{...guideHighlight,marginBottom:6}}>🤖 Android (Chrome)</div>
            <GuiaStep n={1} text="Adicione o app à tela inicial conforme o guia acima."/>
            <GuiaStep n={2} text='Quando o app pedir permissão de notificação, toque em "Permitir".'/>
            <GuiaStep n={3} text="Pronto! Você receberá alertas mesmo com o app fechado."/>
          </div>
          <div>
            <div style={{...guideHighlight,marginBottom:6}}>🍎 iPhone (Safari)</div>
            <GuiaStep n={1} text="Adicione o app à tela inicial pelo Safari (obrigatório)."/>
            <GuiaStep n={2} text="Abra o app pela tela inicial (não pelo Safari)."/>
            <GuiaStep n={3} text='Quando aparecer o pedido de permissão, toque em "Permitir".'/>
          </div>
          <div style={guideTipStyle}>
            ⚠️ Se você recusou a permissão antes, vá em Configurações do celular → Notificações → Palpitão e ative manualmente.
          </div>
        </div>

        {/* CORREÇÃO #3 — Status de notificação com loading */}
        <div style={{marginTop:14,padding:'14px 16px',background:dm?'rgba(0,40,20,.5)':'rgba(0,80,40,.06)',border:`1px solid ${C.border}`,borderRadius:8,textAlign:'center' as const}}>
          {pushStatus==='unknown'
            ? <div style={{color:C.textMuted,fontSize:13}}>Verificando status das notificações...</div>
            : pushStatus==='granted'
              ? <div style={{color:C.green,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:600,letterSpacing:1}}>✅ NOTIFICAÇÕES ATIVADAS!</div>
              : pushStatus==='denied'
                ? <div style={{color:C.red,fontSize:13,lineHeight:1.4}}>🚫 Bloqueadas. Acesse as configurações do seu navegador ou celular para permitir.</div>
                : <div>
                    <div style={{fontSize:13,color:C.textMuted,marginBottom:10}}>Toque abaixo para receber alertas e não perder os prazos!</div>
                    <button onClick={requestPushPermission} style={{background:C.gold,color:'#001a0a',border:'none',fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,letterSpacing:2,padding:'12px 24px',borderRadius:6,cursor:'pointer',width:'100%'}}>
                      🔔 ATIVAR NOTIFICAÇÕES
                    </button>
                  </div>
          }
        </div>
      </GuiaItem>

      <GuiaItem title="Quais notificações vou receber?" icon="📣">
        <div style={guideTextStyle}>
          {[
            {icon:'🟢', title:'Rodada aberta',        desc:'Quando o admin abre uma nova rodada de palpites.'},
            {icon:'⏱',  title:'Lembrete de prazo',    desc:'Aviso ~1 hora antes do primeiro jogo travar.'},
            {icon:'🚨', title:'Rodada em andamento',  desc:'Quando o primeiro jogo da rodada começa.'},
            {icon:'⚽', title:'Resultado disponível', desc:'Quando o admin lança a pontuação da rodada.'},
            {icon:'🆕', title:'Novidade no app',      desc:'Quando uma nova funcionalidade ou atualização é publicada.'},
          ].map(({icon,title,desc})=>(
            <div key={title} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:10}}>
              <span style={{fontSize:20}}>{icon}</span>
              <div><b style={guideHighlight}>{title}</b><br/><span style={{fontSize:13,color:C.textMuted}}>{desc}</span></div>
            </div>
          ))}
        </div>
      </GuiaItem>

      <div style={{height:20}}/>
    </div>
  )
}
