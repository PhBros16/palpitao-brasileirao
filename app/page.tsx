'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const PLAYERS = ['Ramon','Matheus Couto','Pedro Frozza','Pedro Gaúcho','Victor Bahia','Victor Simões','PH','André','Matheus Brito','Costa','Diniz','Samuel','Giovanni','Damus']
const MASTER_PASS = 'Mestre#26Pal'

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
    round:{ name:'Fase de Grupos - Rodada 1', phase:'grupos', matches:defaultMatches() },
    palpitesOpen:true,
    palpites:{}, palpiteTimes:{}, results:{},
    correctedScores:{}, totalPoints:{},
    roundHistory:[],
    shame:{ player:'', photoUrl:'', text:'' },
    roundFinalized:false,
    scoringPhases:defaultScoringPhases(),
    multipliers:defaultMultipliers(),
    novidades:[] as any[],
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
  if(hours > 0) return `${hours}h ${mins}min`
  return `${mins}min`
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

function posIcon(i: number) {
  const cls = i===0?'p1':i===1?'p2':i===2?'p3':'pn'
  return <span className={`pos-badge ${cls}`}>{i+1}</span>
}

// ── Guia accordion item ──────────────────────────────────────────────────────
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
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMsg, setNotifMsg] = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [pushStatus, setPushStatus] = useState<'unknown'|'granted'|'denied'|'default'>('unknown')
  const notifTimer = useRef<any>(null)

  const [, setTick] = useState(0)
  useEffect(()=>{ const t=setInterval(()=>setTick(n=>n+1),60000); return()=>clearInterval(t) },[])

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
      if(s.round?.matches) {
        s.round.matches = s.round.matches.map((m:any)=>({
          date:'', locked:false, hasQuemAvanca:false, hasPenaltis:false, ...m
        }))
      } else {
        s.round = s.round || { name:'', phase:'grupos', matches:[] }
      }
      setState(s)
    } catch { setState(defaultState()) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ fetchState() },[fetchState])
  useEffect(()=>{ const t=setInterval(fetchState,30000); return()=>clearInterval(t) },[fetchState])

  const saveState = useCallback(async (newState: any, password: string) => {
    setSaving(true)
    try {
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
      state.round.matches.forEach((m:any)=>{ local[m.id]=myPal[m.id]||{h:'',a:'',quemAvanca:'',penaltis:''} })
      setLocalPalpites(local)
      // Verificar novidade não lida
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
      setAdminBuf({ name:state.round.name, phase:state.round.phase, open:state.palpitesOpen, matches:JSON.parse(JSON.stringify(state.round.matches)) })
      setScoringPhases(JSON.parse(JSON.stringify(state.scoringPhases)))
      setMultipliersBuf(JSON.parse(JSON.stringify(state.multipliers||defaultMultipliers())))
      setShamePlayer(state.shame.player); setShameUrl(state.shame.photoUrl); setShameText(state.shame.text||'')
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
      exact: s.roundHistory.reduce((acc:number,r:any)=>acc+(r.tiebreak?.[p]?.exact||0),0),
      correct: s.roundHistory.reduce((acc:number,r:any)=>acc+(r.tiebreak?.[p]?.correct||0),0),
    })).sort((a:any,b:any)=>{
      if(b.total!==a.total) return b.total-a.total
      if(b.exact!==a.exact) return b.exact-a.exact
      return b.correct-a.correct
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
    newState.round.name=adminBuf.name; newState.round.phase=adminBuf.phase
    newState.palpitesOpen=adminBuf.open; newState.round.matches=adminBuf.matches
    newState.roundFinalized=false
    await saveState(newState, authPassword)
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
    await saveState(newState, authPassword); showNotif('Pontuação calculada! ⚡')
  }

  async function applyManualPts(player: string, matchId: string) {
    if(!state) return
    const key=`${player}-${matchId}`; const val=parseInt(manualPts[key]||'')
    if(isNaN(val)) return
    const newState=JSON.parse(JSON.stringify(state))
    if(!newState.correctedScores[player]) newState.correctedScores[player]={}
    newState.correctedScores[player][matchId]=val
    await saveState(newState, authPassword); showNotif('Pts manuais salvos!')
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
    await saveState(newState, authPassword); showNotif('Rodada finalizada! 🏆')
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
    const fresh = defaultState()
    fresh.adminPass = state.adminPass
    fresh.scoringPhases = state.scoringPhases
    fresh.multipliers = state.multipliers
    await saveState(fresh, authPassword)
    setShowResetModal(false); setResetConfirm('')
    showNotif('Dados zerados com sucesso!', 'error')
  }

  async function saveScoringConfig() {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state))
    newState.scoringPhases=scoringPhases; newState.multipliers=multipliersBuf
    await saveState(newState, authPassword); showNotif('Pontuação salva!')
  }

  async function saveShame() {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state))
    newState.shame={player:shamePlayer,photoUrl:shameUrl,text:shameText}
    await saveState(newState, authPassword); showNotif('Salvo!')
  }

  // Verificar status de notificação push
  useEffect(()=>{
    if(typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission as any)
    }
  },[])

  async function requestPushPermission() {
    if(typeof window === 'undefined') return
    const win = window as any
    if(win.OneSignalDeferred) {
      win.OneSignalDeferred.push(async (OneSignal: any) => {
        await OneSignal.Notifications.requestPermission()
        setPushStatus(Notification.permission as any)
        if(Notification.permission === 'granted') showNotif('Notificações ativadas! 🔔')
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
        button,input,select,textarea{touch-action:manipulation;-webkit-appearance:none;appearance:none;font-family:inherit;}
        html{overflow-x:hidden;}
        body{font-family:'Barlow',sans-serif;background:${C.bg};color:${C.text};min-height:100vh;overflow-x:hidden;max-width:100%;transition:background .3s,color .3s;}
        ${dm?`body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 20%,rgba(0,100,50,.25) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(0,40,100,.2) 0%,transparent 50%);pointer-events:none;z-index:0;}
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
        .team-flag{font-size:24px;}.team-name{font-size:15px;font-weight:600;color:${C.text};}.vs-txt{font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--gold);}
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
        /* GUIA */
        .guia-hero{background:${dm?'linear-gradient(135deg,rgba(0,60,30,.7),rgba(0,30,60,.5))':'linear-gradient(135deg,rgba(0,80,40,.1),rgba(0,30,80,.05))'};border:var(--border-gold);border-radius:var(--radius);padding:20px;margin-bottom:20px;text-align:center;}
        .guia-hero-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:4px;color:var(--gold);margin-bottom:6px;}
        .guia-hero-sub{font-size:13px;color:var(--text-muted);line-height:1.5;}
        .guia-section{margin-bottom:8px;}
        .guia-divider{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--text-muted);padding:12px 0 6px;border-bottom:1px solid ${C.borderFaint};margin-bottom:8px;}
        .os-tab-bar{display:flex;gap:8px;margin-bottom:14px;}
        .os-tab{flex:1;padding:10px;border-radius:6px;border:1px solid ${C.borderFaint};background:transparent;color:${C.textMuted};font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:600;letter-spacing:1px;cursor:pointer;transition:all .2s;}
        .os-tab.active{background:var(--gold);color:#001a0a;border-color:var(--gold);}
        @media(max-width:600px){
          .grid-4{grid-template-columns:1fr 1fr;gap:8px;}.stat-card{padding:12px 10px;}.stat-value{font-size:26px;}.stat-label{font-size:9px;}
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

      {showResetModal && <div className="modal-overlay open">
        <div className="modal">
          <h3>⚠ Zerar Dados</h3>
          <p style={{color:'#e74c3c',fontSize:13,marginBottom:12}}>Isso apagará TODOS os palpites, pontuações, histórico e resultados. A ação é irreversível!</p>
          <p style={{fontSize:12,color:C.textMuted,marginBottom:12}}>Digite <b style={{color:C.gold}}>ZERAR</b> para confirmar:</p>
          <input type="text" value={resetConfirm} onChange={e=>setResetConfirm(e.target.value)} placeholder="ZERAR" style={{letterSpacing:4,textTransform:'uppercase'}}/>
          <div className="modal-btns" style={{marginTop:8}}>
            <button className="btn-secondary" onClick={()=>{setShowResetModal(false);setResetConfirm('')}}>Cancelar</button>
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
          <div className="header-sub">USA · México · Canadá</div>
          <div className="trophy-line">🏆 <span style={{fontSize:11,color:dm?'#A07820':'rgba(255,255,255,0.7)',letterSpacing:1,whiteSpace:'nowrap'}}>48 SELEÇÕES · 3 PAÍSES SEDE · 1 CAMPEÃO</span> 🏆</div>
        </header>
        <button className="theme-btn" onClick={()=>setDarkMode(!dm)}>{dm?'☀️':'🌙'}</button>
      </div>

      <div className="app">
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
            {['home','palpites','geral','ranking','historico','guia'].map(t=>{
              const hasNovidade = t==='home' && (()=>{
                const novs: any[] = state.novidades||[]
                if(!novs.length) return false
                const seen = typeof window !== 'undefined' ? localStorage.getItem('palpitao_novidade_seen') : null
                return seen !== novs[novs.length-1]?.id
              })()
              return (
                <button key={t} className={`tab-btn${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)} style={{position:'relative'}}>
                  {t==='home'?'🏠 Início':t==='palpites'?'✏ Palpites':t==='geral'?'📊 Geral':t==='ranking'?'🏆 Ranking':t==='historico'?'📅 Histórico':'📖 Guia'}
                  {hasNovidade && <span style={{position:'absolute',top:4,right:4,width:7,height:7,borderRadius:'50%',background:'#e74c3c',border:'1px solid rgba(0,0,0,.3)'}}/>}
                </button>
              )
            })}
            {isAdmin && <button className={`tab-btn${activeTab==='admin'?' active':''}`} onClick={()=>setActiveTab('admin')}>⚙ Admin</button>}
          </div>

          {/* HOME */}
          {activeTab==='home' && <div>
            {/* Banner novidade não lida */}
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
            <div className="grid-4" style={{marginBottom:20}}>
              <div className="stat-card"><div className="stat-value">{state.round.name.split('-').pop()?.trim()||state.round.name||'—'}</div><div className="stat-label">Rodada</div></div>
              <div className="stat-card"><div className="stat-value">{state.round.matches.length}</div><div className="stat-label">Jogos</div></div>
              <div className="stat-card"><div className="stat-value">{palpitaramCount}/{PLAYERS.length}</div><div className="stat-label">Palpitaram</div></div>
              <div className="stat-card"><div className="stat-value" style={{fontSize:sorted[0]?.name.length>8?18:34}}>{sorted[0]?.name.split(' ').slice(0,2).join(' ')||'—'}</div><div className="stat-label">Líder</div></div>
            </div>
            <div className="grid-2" style={{marginBottom:20}}>
              <div className="card">
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                  <div className="section-title" style={{marginBottom:0,fontSize:17}}>Parcial</div>
                  <span className={`parcial-chip ${state.roundFinalized?'chip-f':'chip-p'}`}>{state.roundFinalized?'FINALIZADA':'PARCIAL'}</span>
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
          </div>}

          {/* PALPITES */}
          {activeTab==='palpites' && <div>
            <div className="section-title">Meus Palpites</div>
            {!state.palpitesOpen&&<div className="a-warn">🔒 Palpites bloqueados. Aguarde a administração abrir.</div>}
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
              const countdown=!locked?getCountdown(m,idx):null
              return <div key={m.id} className={`match-card${locked?' locked':''}`}>
                <div className="match-teams">
                  <span className="team-flag">{m.homeFlag||'🏳'}</span>
                  <span className="team-name">{m.home}</span>
                  <span className="vs-txt">x</span>
                  <span className="team-name">{m.away}</span>
                  <span className="team-flag">{m.awayFlag||'🏳'}</span>
                </div>
                <div className="score-grp">
                  <input className="score-in" type="number" inputMode="numeric" min={0} max={20} value={pal.h} disabled={locked}
                    onChange={e=>setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],h:e.target.value}}))}/>
                  <span className="score-sep">×</span>
                  <input className="score-in" type="number" inputMode="numeric" min={0} max={20} value={pal.a} disabled={locked}
                    onChange={e=>setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],a:e.target.value}}))}/>
                </div>
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
                    ?<span className="lock-badge">🔒 Travado</span>
                    :<span>⏱ {m.date?`${m.date} · `:''}{m.time||'—'}{countdown&&<span style={{color:C.goldLight,marginLeft:8,fontWeight:600}}>· fecha em {countdown}</span>}</span>
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

          {/* GERAL */}
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

          {/* RANKING */}
          {activeTab==='ranking'&&<div>
            <div className="section-title">Ranking Geral</div>
            <div className="section-sub">Pontuação acumulada · desempate por placares exatos e resultados corretos</div>
            <div className="table-wrap">
              <table className="dt">
                <thead><tr><th style={{width:40}}>#</th><th>Participante</th><th className="r">Pontos</th><th className="r">Exatos</th><th className="r">Corretos</th><th className="r">Rodadas</th></tr></thead>
                <tbody>
                  {sorted.map((d:any,i:number)=>{
                    const prevTotal = i>0?sorted[i-1].total:null
                    const tied = prevTotal===d.total && d.total > 0
                    return <tr key={d.name} style={tied?{background:dm?'rgba(212,175,55,.04)':'rgba(212,175,55,.08)'}:{}}>
                      <td>{posIcon(i)}</td>
                      <td style={{whiteSpace:'nowrap'}}>{d.name}{tied&&<span style={{fontSize:10,color:C.gold,marginLeft:4}}>≈</span>}</td>
                      <td className="r" style={{fontFamily:"'Bebas Neue'",fontSize:18,color:C.gold}}>{d.total}</td>
                      <td className="r" style={{color:C.textMuted}}>{d.exact}</td>
                      <td className="r" style={{color:C.textMuted}}>{d.correct}</td>
                      <td className="r" style={{color:C.textMuted}}>{d.rodadas}</td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </div>}

          {/* HISTÓRICO */}
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

          {/* GUIA */}
          {activeTab==='guia'&&<GuiaTab C={C} dm={dm} state={state} guideTextStyle={guideTextStyle} guideTipStyle={guideTipStyle} guideHighlight={guideHighlight}/>}

          {/* ADMIN */}
          {activeTab==='admin'&&isAdmin&&<div>
            <div className="a-warn">⚠ Área restrita — alterações afetam todos os participantes.</div>
            <div style={{marginBottom:24}}>
              <div className="section-title">Configuração da Rodada</div>
              <div className="a-card">
                <div className="a-row"><span className="a-lbl">Nome:</span>
                  <input className="a-in lg" value={adminBuf.name||''} onChange={e=>setAdminBuf((b:any)=>({...b,name:e.target.value}))} placeholder="ex: Fase de Grupos - R1"/>
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
                    <input className="a-in" style={{width:50}} value={m.homeFlag} placeholder="🏳" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,homeFlag:e.target.value}:x)}))}/>
                    <input className="a-in lg" value={m.home} placeholder="País Casa" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,home:e.target.value}:x)}))}/>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Fora:</span>
                    <input className="a-in" style={{width:50}} value={m.awayFlag} placeholder="🏳" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,awayFlag:e.target.value}:x)}))}/>
                    <input className="a-in lg" value={m.away} placeholder="País Fora" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,away:e.target.value}:x)}))}/>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Data:</span>
                    <input className="a-in md" value={m.date||''} placeholder="DD/MM" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,date:e.target.value}:x)}))}/>
                    <span className="a-lbl">Horário:</span>
                    <input className="a-in md" value={m.time||''} placeholder="19:00" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,time:e.target.value}:x)}))}/>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Travado:</span>
                    <label className="toggle"><input type="checkbox" checked={m.locked||false} onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,locked:e.target.checked}:x)}))}/><span className="tsl"/></label>
                    <span style={{fontSize:12,color:m.locked?C.red:C.textMuted}}>{m.locked?'🔒 Travado manualmente':'Automático'}</span>
                  </div>
                  <div className="extras-admin">
                    <div className="extras-admin-title">Extras</div>
                    <div className="extras-checks">
                      <label className="extra-check">
                        <input type="checkbox" checked={m.hasQuemAvanca||false} onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,hasQuemAvanca:e.target.checked}:x)}))}/>
                        🏴 Quem Avança?
                      </label>
                      <label className="extra-check">
                        <input type="checkbox" checked={m.hasPenaltis||false} onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,hasPenaltis:e.target.checked}:x)}))}/>
                        ⚽ Pênaltis?
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
              {PLAYERS.map(p=>{
                const roundPts=Object.values(state.correctedScores[p]||{}).reduce((a:number,b:unknown)=>a+(b as number),0) as number
                const pkey=p.replace(/\s/g,'_')
                return <div key={p} className="corr-p">
                  <div className="corr-h" onClick={()=>setCorrOpen((o:any)=>({...o,[pkey]:!o[pkey]}))}>
                    <span className="corr-n">{p}</span>
                    <span className="corr-pts">{roundPts} pts <span style={{fontSize:13,color:C.textMuted}}>{state.totalPoints[p]||0} total</span></span>
                  </div>
                  {corrOpen[pkey]&&<div className="corr-b">
                    {state.round.matches.map((m:any)=>{
                      const pal=state.palpites[p]?.[m.id]; const res=state.results[m.id]; const pts=state.correctedScores[p]?.[m.id]
                      const key=`${p}-${m.id}`
                      return <div key={m.id} className="corr-r">
                        <span style={{minWidth:120,color:C.textMuted,fontSize:12}}>{m.home} x {m.away}</span>
                        <span style={{fontSize:12}}>Palpite: <b>{pal&&pal.h!==''?`${pal.h}×${pal.a}`:<span style={{color:C.textSub}}>NP</span>}</b></span>
                        <span style={{fontSize:12}}>Result: <b style={{color:C.gold}}>{res&&res.h!==''?`${res.h}×${res.a}`:'—'}</b></span>
                        {pts!==undefined&&<span className={`pts-badge pts-${Math.min(pts,5)}`}>{pts}pt</span>}
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <input className="a-in sm" type="number" inputMode="numeric" min={0} value={manualPts[key]??pts??''} placeholder="—" onChange={e=>setManualPts((mp:any)=>({...mp,[key]:e.target.value}))}/>
                          <button className="btn-sm btn-outline" style={{padding:'5px 10px',fontSize:11}} onClick={()=>applyManualPts(p,m.id)}>Ok</button>
                        </div>
                      </div>
                    })}
                  </div>}
                </div>
              })}
            </div>

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

// ── ABA GUIA (componente separado para não poluir o Home) ───────────────────
function GuiaTab({ C, dm, state, guideTextStyle, guideTipStyle, guideHighlight }: any) {
  const [osTab, setOsTab] = useState<'android'|'iphone'>('android')

  return (
    <div>
      {/* Hero */}
      <div style={{background:dm?'linear-gradient(135deg,rgba(0,60,30,.7),rgba(0,30,60,.5))':'linear-gradient(135deg,rgba(0,80,40,.1),rgba(0,30,80,.05))',border:`1px solid ${C.border}`,borderRadius:8,padding:20,marginBottom:20,textAlign:'center'}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:4,color:C.gold,marginBottom:6}}>📖 GUIA DO PALPITÃO</div>
        <div style={{fontSize:13,color:C.textMuted,lineHeight:1.5}}>Tudo que você precisa saber para palpitar, pontuar e ganhar 🏆</div>
      </div>

      {/* PONTUAÇÃO */}
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'12px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>{'⚽ Pontuação'}</div>

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

      {/* REGRAS */}
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'16px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>{'📋 Regras do Palpite'}</div>

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

      {/* INSTALAR */}
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'16px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>{'📱 Instalar no Celular'}</div>

      <GuiaItem title="Adicionar à tela inicial (app sem instalar)" icon="📲" defaultOpen={true}>
        <p style={{...guideTextStyle,marginBottom:14,color:C.textMuted}}>
          Adicionar o Palpitão à tela inicial deixa ele com cara de app — abre em tela cheia, sem barra do navegador. Selecione seu sistema:
        </p>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <button className="os-tab" style={{flex:1,padding:10,borderRadius:6,border:`1px solid ${osTab==='android'?C.gold:C.borderFaint}`,background:osTab==='android'?C.gold:'transparent',color:osTab==='android'?'#001a0a':C.textMuted,fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:600,letterSpacing:1,cursor:'pointer'}} onClick={()=>setOsTab('android')}>🤖 Android</button>
          <button className="os-tab" style={{flex:1,padding:10,borderRadius:6,border:`1px solid ${osTab==='iphone'?C.gold:C.borderFaint}`,background:osTab==='iphone'?C.gold:'transparent',color:osTab==='iphone'?'#001a0a':C.textMuted,fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:600,letterSpacing:1,cursor:'pointer'}} onClick={()=>setOsTab('iphone')}>🍎 iPhone</button>
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
              ⚠️ <b>iPhone:</b> notificações push só funcionam se o app estiver adicionado à tela inicial pelo Safari. Sem isso, as notificações não chegam.
            </div>
          </div>
        )}
      </GuiaItem>

      {/* NOTIFICAÇÕES */}
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,letterSpacing:3,textTransform:'uppercase' as const,color:C.textMuted,padding:'16px 0 6px',borderBottom:`1px solid ${C.borderFaint}`,marginBottom:8}}>{'🔔 Notificações'}</div>

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
        {/* Botão de ativar direto */}
        <div style={{marginTop:14,padding:'14px 16px',background:dm?'rgba(0,40,20,.5)':'rgba(0,80,40,.06)',border:`1px solid ${C.border}`,borderRadius:8,textAlign:'center' as const}}>
          {pushStatus==='granted'
            ? <div style={{color:C.green,fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:600,letterSpacing:1}}>✅ Notificações já ativadas!</div>
            : pushStatus==='denied'
              ? <div style={{color:C.red,fontSize:13}}>🚫 Notificações bloqueadas. Ative nas configurações do navegador.</div>
              : <div>
                  <div style={{fontSize:13,color:C.textMuted,marginBottom:10}}>Ative as notificações para ser avisado quando uma rodada abrir!</div>
                  <button onClick={requestPushPermission} style={{background:C.gold,color:'#001a0a',border:'none',fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,letterSpacing:2,padding:'10px 24px',borderRadius:6,cursor:'pointer'}}>
                    🔔 ATIVAR NOTIFICAÇÕES
                  </button>
                </div>
          }
        </div>
      </GuiaItem>

      <GuiaItem title="Quais notificações vou receber?" icon="📣">
        <div style={guideTextStyle}>
          <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:10}}>
            <span style={{fontSize:20}}>🟢</span>
            <div><b style={guideHighlight}>Rodada aberta</b><br/><span style={{fontSize:13,color:C.textMuted}}>Quando o admin abre uma nova rodada de palpites.</span></div>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:10}}>
            <span style={{fontSize:20}}>⏱</span>
            <div><b style={guideHighlight}>Lembrete de prazo</b><br/><span style={{fontSize:13,color:C.textMuted}}>Aviso quando falta pouco tempo para o primeiro jogo travar.</span></div>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <span style={{fontSize:20}}>🏆</span>
            <div><b style={guideHighlight}>Resultado disponível</b><br/><span style={{fontSize:13,color:C.textMuted}}>Quando o admin lançar a pontuação da rodada.</span></div>
          </div>
        </div>
        <div style={guideTipStyle}>
          🚧 O sistema de notificações está em desenvolvimento. Em breve você poderá ativar diretamente aqui no app!
        </div>
      </GuiaItem>

      <div style={{height:20}}/>
    </div>
  )
}
