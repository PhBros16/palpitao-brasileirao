'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const PLAYERS = ['Ramon','Matheus Couto','Pedro Frozza','Pedro Gaúcho','Victor Bahia','Victor Simões','PH','André','Matheus Brito','Costa','Diniz','Samuel','Giovanni','Damus']
const MASTER_PASS = 'Mestre#26Pal'

function defaultMatches() {
  return [
    { id:'m1', home:'Brasil', away:'Argentina', homeFlag:'🇧🇷', awayFlag:'🇦🇷', time:'16:00', isElim:false },
    { id:'m2', home:'França', away:'Alemanha', homeFlag:'🇫🇷', awayFlag:'🇩🇪', time:'19:00', isElim:false },
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
    hasClassify:false,
  }]
}

function defaultState(): any {
  return {
    adminPass:'Copa2026!',
    round:{ name:'Fase de Grupos - Rodada 1', phase:'grupos', matches:defaultMatches() },
    palpitesOpen:true,
    palpites:{}, palpiteTimes:{}, results:{},
    correctedScores:{}, totalPoints:{},
    roundHistory:[],
    shame:{ player:'', photoUrl:'' },
    roundFinalized:false,
    scoringPhases:defaultScoringPhases(),
  }
}

function calcPoints(pal: any, res: any, phase: any) {
  if(!pal||!res||res.h===''||res.a==='') return null
  const ph=parseInt(pal.h), pa=parseInt(pal.a)
  const rh=parseInt(res.h), ra=parseInt(res.a)
  if(isNaN(ph)||isNaN(pa)||isNaN(rh)||isNaN(ra)) return null
  const rules = phase?.rules || defaultScoringPhases()[0].rules
  if(ph===rh&&pa===ra) return rules[2]?.pts??5
  if((ph-pa)===(rh-ra)) return rules[1]?.pts??3
  const pw=ph>pa?1:ph<pa?-1:0, rw=rh>ra?1:rh<ra?-1:0
  if(pw===rw) return rules[0]?.pts??1
  return 0
}

function posIcon(i: number) {
  const cls = i===0?'p1':i===1?'p2':i===2?'p3':'pn'
  return <span className={`pos-badge ${cls}`}>{i+1}</span>
}

export default function Home() {
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<string|null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [showModal, setShowModal] = useState(false)
  const [adminPassInput, setAdminPassInput] = useState('')
  const [modalError, setModalError] = useState('')
  const [notif, setNotif] = useState<{msg:string,type:string}|null>(null)
  const [authPassword, setAuthPassword] = useState('')
  const [localPalpites, setLocalPalpites] = useState<any>({})
  const [adminBuf, setAdminBuf] = useState<any>({})
  const [resultInputs, setResultInputs] = useState<any>({})
  const [corrOpen, setCorrOpen] = useState<any>({})
  const [manualPts, setManualPts] = useState<any>({})
  const [scoringPhases, setScoringPhases] = useState<any[]>([])
  const [shamePlayer, setShamePlayer] = useState('')
  const [shameUrl, setShameUrl] = useState('')
  const [newPass, setNewPass] = useState('')
  const [masterConf, setMasterConf] = useState('')
  const notifTimer = useRef<any>(null)

  const showNotif = useCallback((msg: string, type='success') => {
    if(notifTimer.current) clearTimeout(notifTimer.current)
    setNotif({msg,type})
    notifTimer.current = setTimeout(()=>setNotif(null),3000)
  },[])

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state')
      const json = await res.json()
      const s = json.state || defaultState()
      if(!s.adminPass) s.adminPass='Copa2026!'
      if(!s.shame) s.shame={player:'',photoUrl:''}
      if(s.palpitesOpen===undefined||s.palpitesOpen===null) s.palpitesOpen=true
      if(!s.roundFinalized) s.roundFinalized=false
      if(!s.scoringPhases) s.scoringPhases=defaultScoringPhases()
      if(!s.roundHistory) s.roundHistory=[]
      if(!s.correctedScores) s.correctedScores={}
      if(!s.totalPoints) s.totalPoints={}
      if(!s.palpites) s.palpites={}
      if(!s.results) s.results={}
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
      state.round.matches.forEach((m:any)=>{ local[m.id]=myPal[m.id]||{h:'',a:'',classify:''} })
      setLocalPalpites(local)
    }
  }

  function checkAdminPass() {
    if(!state) return
    if(adminPassInput===MASTER_PASS||adminPassInput===state.adminPass) {
      setAuthPassword(adminPassInput); setCurrentUser('Administração'); setIsAdmin(true)
      setShowModal(false); setAdminPassInput(''); setModalError(''); setActiveTab('home')
      setAdminBuf({ name:state.round.name, phase:state.round.phase, open:state.palpitesOpen, matches:JSON.parse(JSON.stringify(state.round.matches)) })
      setScoringPhases(JSON.parse(JSON.stringify(state.scoringPhases)))
      setShamePlayer(state.shame.player); setShameUrl(state.shame.photoUrl)
      const ri: any={}
      state.round.matches.forEach((m:any)=>{ ri[m.id]=state.results[m.id]||{h:'',a:''} })
      setResultInputs(ri)
    } else { setModalError('Senha incorreta.') }
  }

  function logout() { setCurrentUser(null); setIsAdmin(false); setAuthPassword(''); setActiveTab('home') }

  function getCurrentPhase(s: any) {
    const phase = s.round.phase
    return s.scoringPhases.find((p:any)=>p.name.toLowerCase().includes(phase))||s.scoringPhases[0]
  }

  function rankingData(s: any) {
    return PLAYERS.map(p=>({
      name:p, total:s.totalPoints[p]||0,
      rodadas:s.roundHistory.filter((r:any)=>r.scores&&r.scores[p]!==undefined).length
    })).sort((a:any,b:any)=>b.total-a.total)
  }

  async function savePalpites() {
    if(!state||!currentUser) return
    if(!state.palpitesOpen){showNotif('Palpites bloqueados!','error');return}
    const newState = JSON.parse(JSON.stringify(state))
    if(!newState.palpites[currentUser]) newState.palpites[currentUser]={}
    state.round.matches.forEach((m:any)=>{
      const pal=localPalpites[m.id]||{h:'',a:'',classify:''}
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
    const ri:any={}; adminBuf.matches.forEach((m:any)=>{ ri[m.id]=newState.results[m.id]||{h:'',a:''} }); setResultInputs(ri)
  }

  async function applyCorrection() {
    if(!state) return
    const newState = JSON.parse(JSON.stringify(state))
    state.round.matches.forEach((m:any)=>{ const r=resultInputs[m.id]; if(r&&r.h!==''&&r.a!=='') newState.results[m.id]=r })
    const phase=getCurrentPhase(newState)
    PLAYERS.forEach(p=>{
      if(!newState.correctedScores[p]) newState.correctedScores[p]={}
      newState.round.matches.forEach((m:any)=>{
        const pal=newState.palpites[p]?.[m.id]; const res=newState.results[m.id]
        if(pal&&res){ const pts=calcPoints(pal,res,phase); if(pts!==null) newState.correctedScores[p][m.id]=pts }
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
    const newState=JSON.parse(JSON.stringify(state)); const scores:any={}
    PLAYERS.forEach(p=>{ scores[p]=Object.values(newState.correctedScores[p]||{}).reduce((a:any,b:any)=>a+b,0); newState.totalPoints[p]=(newState.totalPoints[p]||0)+scores[p] })
    newState.roundHistory.push({roundName:newState.round.name,scores})
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

  async function saveScoringConfig() {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state)); newState.scoringPhases=scoringPhases
    await saveState(newState, authPassword); showNotif('Pontuação salva!')
  }

  async function saveShame() {
    if(!state) return
    const newState=JSON.parse(JSON.stringify(state)); newState.shame={player:shamePlayer,photoUrl:shameUrl}
    await saveState(newState, authPassword); showNotif('Salvo!')
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
  const palpitaramCount = PLAYERS.filter(p=>state.palpites[p]&&Object.keys(state.palpites[p]).length>0).length
  const currentPhase = getCurrentPhase(state)
  const showClassify = currentPhase?.hasClassify===true

  return (
    <>
      <style>{`
        :root{--gold:#D4AF37;--gold-light:#F0D060;--gold-dark:#A07820;--green-mid:#006633;--bg-panel:rgba(0,30,15,0.85);--bg-card:rgba(0,50,25,0.7);--border-gold:1px solid rgba(212,175,55,0.4);--text-light:#FAFAFA;--text-muted:#B0A080;--red:#C0392B;--green-bright:#00A651;--radius:8px;}
        *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        button,input,select{touch-action:manipulation;-webkit-appearance:none;appearance:none;font-family:inherit;}
        body{font-family:'Barlow',sans-serif;background:#001a0a;color:var(--text-light);min-height:100vh;overflow-x:hidden;}
        body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 20%,rgba(0,100,50,.25) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(0,40,100,.2) 0%,transparent 50%);pointer-events:none;z-index:0;}
        body::after{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 15 L60 37 L30 52 L0 37 L0 15Z' fill='none' stroke='rgba(212,175,55,0.04)' stroke-width='1'/%3E%3C/svg%3E");background-size:60px 52px;pointer-events:none;z-index:0;}
        .app{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:0 16px 60px;}
        header{text-align:center;padding:32px 0 24px;border-bottom:var(--border-gold);}
        .header-badge{display:inline-block;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--gold);border:1px solid var(--gold-dark);padding:4px 14px;border-radius:20px;margin-bottom:12px;}
        header h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(42px,8vw,80px);letter-spacing:4px;color:var(--text-light);line-height:1;margin-bottom:6px;}
        header h1 span{color:var(--gold);}
        .header-sub{font-size:13px;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;font-weight:300;}
        .trophy-line{display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 0;font-size:20px;}
        #login-screen{min-height:80vh;display:flex;align-items:center;justify-content:center;}
        .login-box{background:var(--bg-panel);border:var(--border-gold);border-radius:16px;padding:36px 24px;width:100%;max-width:420px;text-align:center;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}
        .login-box h2{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:3px;color:var(--gold);margin-bottom:8px;}
        .login-box p{font-size:13px;color:var(--text-muted);margin-bottom:24px;}
        .player-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;}
        .player-btn{background:rgba(0,60,30,.6);border:1px solid rgba(212,175,55,.25);color:var(--text-light);font-size:13px;font-weight:500;padding:12px 8px;border-radius:6px;cursor:pointer;transition:all .2s;width:100%;}
        .player-btn:active{background:rgba(0,100,50,.6);border-color:var(--gold);color:var(--gold);}
        .admin-login-btn{width:100%;background:transparent;border:1px solid rgba(212,175,55,.3);color:var(--text-muted);font-size:12px;padding:9px;border-radius:6px;cursor:pointer;margin-top:10px;letter-spacing:1px;}
        .modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1000;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}
        .modal-overlay.open{display:flex;}
        .modal{background:#001a0a;border:var(--border-gold);border-radius:12px;padding:28px 22px;width:92%;max-width:360px;text-align:center;}
        .modal h3{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;}
        .modal p{font-size:13px;color:var(--text-muted);margin-bottom:18px;}
        .modal input{width:100%;background:rgba(0,40,20,.8);border:1px solid rgba(212,175,55,.3);color:var(--text-light);font-size:15px;padding:12px 16px;border-radius:6px;margin-bottom:12px;outline:none;text-align:center;letter-spacing:3px;}
        .modal-btns{display:flex;gap:10px;}
        .modal-error{font-size:12px;color:#e74c3c;margin-top:6px;min-height:16px;}
        .btn-primary{flex:1;background:var(--gold);color:#001a0a;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;padding:12px;border-radius:6px;cursor:pointer;}
        .btn-secondary{flex:1;background:transparent;color:var(--text-muted);border:1px solid rgba(255,255,255,.15);font-size:13px;padding:12px;border-radius:6px;cursor:pointer;}
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:var(--border-gold);margin-bottom:22px;gap:10px;flex-wrap:wrap;}
        .topbar-user{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
        .user-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--green-mid),#003F8A);border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--gold);font-family:'Barlow Condensed',sans-serif;flex-shrink:0;}
        .user-name{font-size:14px;font-weight:500;color:var(--text-light);}
        .user-role{font-size:11px;color:var(--text-muted);}
        .topbar-actions{display:flex;gap:8px;flex-shrink:0;}
        .btn-sm{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;padding:7px 14px;border-radius:5px;cursor:pointer;border:none;}
        .btn-gold{background:var(--gold);color:#001a0a;}
        .btn-outline{background:transparent;border:1px solid rgba(212,175,55,.3);color:var(--text-muted);}
        .btn-danger{background:var(--red);color:white;}
        .btn-green{background:var(--green-bright);color:white;}
        .tabs-nav{display:flex;gap:2px;background:rgba(0,20,10,.5);border:var(--border-gold);border-radius:8px;padding:4px;margin-bottom:22px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .tabs-nav::-webkit-scrollbar{display:none;}
        .tab-btn{flex:0 0 auto;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;padding:9px 16px;border-radius:5px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;white-space:nowrap;}
        .tab-btn.active{background:var(--gold);color:#001a0a;}
        .section-title{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:var(--gold);margin-bottom:4px;display:flex;align-items:center;gap:10px;}
        .section-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,.4),transparent);}
        .section-sub{font-size:12px;color:var(--text-muted);margin-bottom:16px;}
        .card{background:var(--bg-card);border:var(--border-gold);border-radius:var(--radius);padding:20px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .stat-card{background:rgba(0,50,25,.5);border:var(--border-gold);border-radius:var(--radius);padding:16px 12px;text-align:center;}
        .stat-value{font-family:'Bebas Neue',sans-serif;font-size:34px;color:var(--gold);line-height:1;}
        .stat-label{font-size:11px;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;margin-top:4px;}
        .table-wrap{overflow-x:auto;border-radius:var(--radius);border:var(--border-gold);-webkit-overflow-scrolling:touch;}
        table.dt{width:100%;border-collapse:collapse;font-size:13px;min-width:360px;}
        .dt thead th{background:rgba(0,40,20,.9);color:var(--gold);font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:10px 14px;text-align:left;border-bottom:var(--border-gold);white-space:nowrap;}
        .dt tbody td{padding:9px 14px;border-bottom:1px solid rgba(212,175,55,.07);color:var(--text-light);vertical-align:middle;}
        .dt tbody tr:last-child td{border-bottom:none;}
        .dt td.c{text-align:center;}.dt td.r{text-align:right;}
        .pos-badge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:700;font-family:'Barlow Condensed',sans-serif;}
        .p1{background:var(--gold);color:#001a0a;}.p2{background:#9E9E9E;color:#001a0a;}.p3{background:#CD7F32;color:white;}.pn{background:rgba(255,255,255,.08);color:var(--text-muted);}
        .pts-badge{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:22px;border-radius:4px;font-size:11px;font-weight:700;padding:0 5px;}
        .pts-5{background:rgba(0,166,81,.3);color:#00c060;border:1px solid rgba(0,166,81,.4);}
        .pts-3{background:rgba(212,175,55,.2);color:var(--gold);border:1px solid rgba(212,175,55,.35);}
        .pts-1{background:rgba(255,255,255,.08);color:var(--text-muted);border:1px solid rgba(255,255,255,.12);}
        .pts-0{background:rgba(192,57,43,.2);color:#e74c3c;border:1px solid rgba(192,57,43,.25);}
        .pal-hdr{background:linear-gradient(135deg,rgba(0,60,30,.8),rgba(0,40,80,.5));border:var(--border-gold);border-radius:var(--radius);padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .pal-rname{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;color:var(--gold);}
        .st-open{color:var(--green-bright);font-size:11px;letter-spacing:2px;text-transform:uppercase;}
        .st-closed{color:var(--red);font-size:11px;letter-spacing:2px;text-transform:uppercase;}
        .match-card{background:rgba(0,30,15,.7);border:1px solid rgba(212,175,55,.15);border-radius:var(--radius);padding:16px 18px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
        .match-teams{flex:1;min-width:160px;display:flex;align-items:center;gap:8px;}
        .team-flag{font-size:20px;}.team-name{font-size:13px;font-weight:500;}.vs-txt{font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--text-muted);}
        .score-grp{display:flex;align-items:center;gap:6px;}
        .score-in{width:46px;height:46px;background:rgba(0,50,25,.8);border:1px solid rgba(212,175,55,.3);color:var(--text-light);font-family:'Bebas Neue',sans-serif;font-size:22px;text-align:center;border-radius:6px;outline:none;}
        .score-in:focus{border-color:var(--gold);}
        .score-in:disabled{opacity:.4;}
        .score-sep{font-family:'Bebas Nye',sans-serif;font-size:18px;color:var(--text-muted);}
        .classify-sel{background:rgba(0,50,25,.8);border:1px solid rgba(212,175,55,.3);color:var(--text-light);font-size:12px;padding:6px 10px;border-radius:6px;outline:none;cursor:pointer;}
        .classify-sel:disabled{opacity:.4;}
        .match-time{font-size:11px;color:var(--text-muted);letter-spacing:1px;}
        .shame-box{background:linear-gradient(135deg,rgba(50,0,0,.4),rgba(20,0,8,.3));border:1px solid rgba(192,57,43,.3);border-radius:var(--radius);padding:18px;text-align:center;}
        .shame-ttl{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:#e74c3c;margin-bottom:4px;}
        .shame-sub{font-size:11px;color:var(--text-muted);margin-bottom:12px;}
        .parcial-chip{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;padding:3px 10px;border-radius:4px;text-transform:uppercase;}
        .chip-p{background:rgba(212,175,55,.15);color:var(--gold);border:1px solid rgba(212,175,55,.35);}
        .chip-f{background:rgba(0,166,81,.15);color:var(--green-bright);border:1px solid rgba(0,166,81,.3);}
        .a-warn{background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.28);border-radius:var(--radius);padding:10px 14px;font-size:12px;color:#d08070;margin-bottom:16px;}
        .a-card{background:rgba(0,20,10,.6);border:1px solid rgba(212,175,55,.2);border-radius:var(--radius);padding:16px;margin-bottom:12px;}
        .a-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;}
        .a-lbl{font-size:11px;color:var(--text-muted);letter-spacing:1px;min-width:80px;text-transform:uppercase;}
        .a-in{background:rgba(0,40,20,.8);border:1px solid rgba(212,175,55,.25);color:var(--text-light);font-size:13px;padding:7px 12px;border-radius:5px;outline:none;}
        .a-in.sm{width:60px;text-align:center;}.a-in.md{width:150px;}.a-in.lg{flex:1;min-width:140px;}
        .a-sel{background:rgba(0,40,20,.8);border:1px solid rgba(212,175,55,.25);color:var(--text-light);font-size:13px;padding:7px 12px;border-radius:5px;outline:none;cursor:pointer;}
        .toggle{position:relative;display:inline-block;width:40px;height:22px;}
        .toggle input{opacity:0;width:0;height:0;}
        .tsl{position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,.13);border-radius:22px;transition:.2s;}
        .tsl::before{content:'';position:absolute;width:16px;height:16px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.2s;}
        .toggle input:checked+.tsl{background:var(--green-bright);}
        .toggle input:checked+.tsl::before{transform:translateX(18px);}
        .corr-p{background:rgba(0,20,10,.6);border:1px solid rgba(212,175,55,.15);border-radius:var(--radius);margin-bottom:8px;overflow:hidden;}
        .corr-h{background:rgba(0,40,20,.6);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:10px;touch-action:manipulation;}
        .corr-n{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:600;letter-spacing:1px;}
        .corr-pts{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--gold);}
        .corr-b{padding:14px;border-top:1px solid rgba(212,175,55,.1);}
        .corr-r{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(212,175,55,.06);flex-wrap:wrap;font-size:13px;}
        .corr-r:last-child{border-bottom:none;}
        .add-btn{width:100%;background:rgba(0,40,20,.5);border:1px dashed rgba(212,175,55,.3);color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;font-size:13px;letter-spacing:1px;padding:10px;border-radius:var(--radius);cursor:pointer;margin-top:8px;}
        .rm-btn{background:transparent;border:1px solid rgba(192,57,43,.3);color:rgba(192,57,43,.7);font-size:11px;padding:4px 10px;border-radius:4px;cursor:pointer;}
        .notif-bar{position:fixed;top:0;left:0;right:0;background:var(--gold);color:#001a0a;text-align:center;font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:2px;padding:4px;z-index:9998;}
        .notif-box{position:fixed;top:18px;right:18px;background:rgba(0,30,15,.97);border:1px solid var(--gold);border-radius:8px;padding:12px 18px;font-size:13px;color:var(--text-light);z-index:9999;max-width:260px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        @media(max-width:600px){
          .grid-4{grid-template-columns:1fr 1fr;gap:8px;}.stat-card{padding:12px 10px;}.stat-value{font-size:26px;}.stat-label{font-size:9px;}
          .grid-2{grid-template-columns:1fr;}
          .tab-btn{font-size:11px;padding:8px 10px;}
          .topbar-actions .btn-sm{padding:7px 12px;font-size:11px;}
          .match-card{flex-direction:column;align-items:flex-start;}.match-teams{min-width:unset;width:100%;}.score-grp{width:100%;justify-content:center;}
          .a-row{flex-direction:column;align-items:flex-start;}.a-in.md,.a-in.lg,.a-sel{width:100%;}
          .modal-btns{flex-direction:column;}.notif-box{top:10px;right:10px;left:10px;max-width:unset;}
        }
        @media(max-width:360px){.player-grid{grid-template-columns:1fr;}}
      `}</style>

      {saving && <div className="notif-bar">SALVANDO...</div>}
      {notif && <div className="notif-box" style={{borderColor:notif.type==='error'?'#e74c3c':'var(--gold)'}}>
        {notif.type==='error'?'✕ ':'★ '}{notif.msg}
      </div>}

      {/* MODAL */}
      {showModal && <div className="modal-overlay open">
        <div className="modal">
          <h3>Acesso Admin</h3>
          <p>Digite a senha de administração</p>
          <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&checkAdminPass()} placeholder="••••••" autoFocus/>
          <div className="modal-error">{modalError}</div>
          <div className="modal-btns">
            <button className="btn-secondary" onClick={()=>{setShowModal(false);setAdminPassInput('');setModalError('')}}>Cancelar</button>
            <button className="btn-primary" onClick={checkAdminPass}>Entrar</button>
          </div>
        </div>
      </div>}

      {/* HEADER */}
      <header>
        <div className="header-badge">⚽ Edição Especial</div>
        <h1>PALPITÃO <span>COPA</span></h1>
        <div className="header-sub">Do Mundo 2026 · USA · México · Canadá</div>
        <div className="trophy-line">🏆 <span style={{fontSize:12,color:'#A07820',letterSpacing:2}}>TEMPORADA 2026</span> 🏆</div>
      </header>

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

        {/* MAIN APP */}
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
            {['home','palpites','geral','ranking'].map(t=>(
              <button key={t} className={`tab-btn${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>
                {t==='home'?'🏠 Início':t==='palpites'?'✏ Meus Palpites':t==='geral'?'📊 Tabela Geral':'🏆 Ranking'}
              </button>
            ))}
            {isAdmin && <button className={`tab-btn${activeTab==='admin'?' active':''}`} onClick={()=>setActiveTab('admin')}>⚙ Admin</button>}
          </div>

          {/* HOME */}
          {activeTab==='home' && <div>
            <div className="grid-4" style={{marginBottom:20}}>
              <div className="stat-card"><div className="stat-value">{state.round.name.split('-').pop()?.trim()||state.round.name}</div><div className="stat-label">Rodada</div></div>
              <div className="stat-card"><div className="stat-value">{state.round.matches.length}</div><div className="stat-label">Jogos</div></div>
              <div className="stat-card"><div className="stat-value">{palpitaramCount}/{PLAYERS.length}</div><div className="stat-label">Palpitaram</div></div>
              <div className="stat-card"><div className="stat-value" style={{fontSize:sorted[0]?.name.length>8?18:34}}>{sorted[0]?.name.split(' ').slice(0,2).join(' ')||'—'}</div><div className="stat-label">Líder</div></div>
            </div>
            <div className="grid-2" style={{marginBottom:20}}>
              <div className="card">
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                  <div className="section-title" style={{marginBottom:0,fontSize:17}}>Parcial</div>
                  <span className={`parcial-chip ${state.roundFinalized?'chip-f':'chip-p'}`}>{state.roundFinalized?'FINALIZADA':'PARCIAL'}</span>
                </div>
                <div className="table-wrap">
                  <table className="dt">
                    <thead><tr><th>Participante</th><th className="r">Pts Rodada</th><th className="r">Total</th></tr></thead>
                    <tbody>
                      {PLAYERS.map((p,i)=>{
                        const roundPts=Object.values(state.correctedScores[p]||{}).reduce((a:any,b:any)=>a+b,0)
                        const total=state.totalPoints[p]||0
                        const hasPal=state.palpites[p]&&Object.keys(state.palpites[p]).length>0
                        return <tr key={p}>
                          <td>{posIcon(i)} {p}</td>
                          <td className="r" style={{color:'var(--gold)'}}>
                            {(roundPts as number)>0?roundPts:hasPal?<span style={{color:'var(--text-muted)'}}>—</span>:<span style={{color:'rgba(192,57,43,.7)',fontSize:11}}>NP</span>}
                          </td>
                          <td className="r" style={{color:'var(--text-muted)'}}>{total}</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="shame-box">
                  <div className="shame-ttl">🤦 Pior Palpiteiro</div>
                  <div className="shame-sub">Administração atualiza após cada rodada</div>
                  {state.shame.player && <>
                    {state.shame.photoUrl && <img src={state.shame.photoUrl} alt="" style={{maxWidth:180,borderRadius:8,border:'2px solid rgba(192,57,43,.5)',display:'block',margin:'0 auto 10px'}}/>}
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:'#e74c3c',letterSpacing:2}}>😂 {state.shame.player}</div>
                  </>}
                </div>
                <div className="card">
                  <div className="section-title" style={{fontSize:15}}>Por Placar</div>
                  {state.round.matches.map((m:any)=>{
                    const counts:any={}
                    PLAYERS.forEach(p=>{const pal=state.palpites[p]?.[m.id];if(pal&&pal.h!==''){const k=`${pal.h}x${pal.a}`;counts[k]=(counts[k]||0)+1}})
                    const entries=Object.entries(counts).sort((a:any,b:any)=>b[1]-a[1])
                    if(!entries.length) return null
                    return <div key={m.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(212,175,55,.08)',flexWrap:'wrap',gap:6}}>
                      <span style={{color:'var(--text-muted)',fontSize:12}}>{m.home} x {m.away}</span>
                      <span style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {entries.map(([k,v]:any)=><span key={k} style={{background:'rgba(0,60,30,.5)',border:'1px solid rgba(212,175,55,.2)',padding:'2px 8px',borderRadius:4,fontSize:12}}><b style={{color:'var(--gold)'}}>{k}</b> <span style={{color:'var(--text-muted)'}}>{v}x</span></span>)}
                      </span>
                    </div>
                  })}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{fontSize:15}}>Pontuação</div>
              {state.scoringPhases.map((ph:any)=>(
                <div key={ph.id} style={{marginBottom:12}}>
                  <div style={{fontFamily:"'Barlow Condensed'",fontSize:13,fontWeight:600,color:'var(--gold)',letterSpacing:1,marginBottom:5}}>{ph.name}</div>
                  {ph.rules.map((r:any,i:number)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <span className={`pts-badge pts-${r.pts}`}>{r.pts} pt{r.pts!==1?'s':''}</span>
                      <span style={{fontSize:13}}>{r.desc}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>}

          {/* PALPITES */}
          {activeTab==='palpites' && <div>
            <div className="section-title">Meus Palpites</div>
            {!state.palpitesOpen && <div className="a-warn">🔒 Palpites bloqueados. Aguarde a administração abrir.</div>}
            <div className="pal-hdr">
              <div className="pal-rname">{state.round.name}</div>
              <div className={state.palpitesOpen?'st-open':'st-closed'}>{state.palpitesOpen?'🟢 Abertos':'🔒 Fechados'}</div>
            </div>
            {state.round.matches.length===0 && <div style={{color:'var(--text-muted)',fontSize:13,padding:'20px 0'}}>Nenhum jogo configurado. Aguarde a administração.</div>}
            {state.round.matches.map((m:any)=>{
              const pal=localPalpites[m.id]||{h:'',a:'',classify:''}
              const locked=!state.palpitesOpen
              return <div key={m.id} className="match-card">
                <div className="match-teams">
                  <span className="team-flag">{m.homeFlag||'🏳'}</span>
                  <span className="team-name" style={{textAlign:'right'}}>{m.home}</span>
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
                {(m.isElim||showClassify) && <div>
                  <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:3,letterSpacing:1}}>CLASSIFICA</div>
                  <select className="classify-sel" disabled={locked} value={pal.classify}
                    onChange={e=>setLocalPalpites((prev:any)=>({...prev,[m.id]:{...prev[m.id],classify:e.target.value}}))}>
                    <option value="">—</option>
                    <option value={m.home}>{m.home}</option>
                    <option value={m.away}>{m.away}</option>
                  </select>
                </div>}
                <div className="match-time">⏱ {m.time||'—'}</div>
              </div>
            })}
            {state.palpitesOpen && <div style={{marginTop:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <button className="btn-sm btn-gold" style={{padding:'10px 24px',fontSize:14}} onClick={savePalpites} disabled={saving}>
                💾 {saving?'Salvando...':'Salvar Palpites'}
              </button>
              {state.palpiteTimes[currentUser!] && <span style={{fontSize:12,color:'var(--text-muted)'}}>
                Último: {new Date(state.palpiteTimes[currentUser!]).toLocaleString('pt-BR')}
              </span>}
            </div>}
          </div>}

          {/* GERAL */}
          {activeTab==='geral' && <div>
            <div className="section-title">Tabela Geral</div>
            <div className="section-sub">Palpites da rodada atual</div>
            <div className="table-wrap">
              <table className="dt">
                <thead><tr>
                  <th>Participante</th>
                  {state.round.matches.map((m:any)=><th key={m.id} className="c">{m.home}<br/><span style={{fontSize:10,color:'rgba(212,175,55,.4)'}}>x</span><br/>{m.away}</th>)}
                  <th className="r">Pts</th><th className="r">Horário</th>
                </tr></thead>
                <tbody>
                  {PLAYERS.map(p=>{
                    const pal=state.palpites[p]||{}
                    const time=state.palpiteTimes[p]?new Date(state.palpiteTimes[p]).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'
                    const roundPts=Object.values(state.correctedScores[p]||{}).reduce((a:any,b:any)=>a+b,0)
                    return <tr key={p}>
                      <td>{p}</td>
                      {state.round.matches.map((m:any)=>{
                        const myPal=pal[m.id]
                        if(!myPal||myPal.h==='') return <td key={m.id} className="c"><span style={{color:'rgba(255,255,255,.2)'}}>—</span></td>
                        const pts=state.correctedScores[p]?.[m.id]??null
                        return <td key={m.id} className="c">
                          <span style={{fontFamily:"'Bebas Neue'",fontSize:15}}>{myPal.h}×{myPal.a}</span>
                          {pts!==null&&<><br/><span className={`pts-badge pts-${pts}`}>{pts}</span></>}
                        </td>
                      })}
                      <td className="r" style={{color:'var(--gold)',fontFamily:"'Bebas Neue'",fontSize:17}}>{(roundPts as number)>0?roundPts:'—'}</td>
                      <td className="r" style={{fontSize:11,color:'var(--text-muted)'}}>{time}</td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </div>}

          {/* RANKING */}
          {activeTab==='ranking' && <div>
            <div className="section-title">Ranking Geral</div>
            <div className="section-sub">Pontuação acumulada</div>
            <div className="table-wrap">
              <table className="dt">
                <thead><tr><th>#</th><th>Participante</th><th className="r">Pontos</th><th className="r">Rodadas</th><th className="r">Média</th></tr></thead>
                <tbody>
                  {sorted.map((d:any,i:number)=><tr key={d.name}>
                    <td>{posIcon(i)}</td><td>{d.name}</td>
                    <td className="r" style={{fontFamily:"'Bebas Neue'",fontSize:18,color:'var(--gold)'}}>{d.total}</td>
                    <td className="r" style={{color:'var(--text-muted)'}}>{d.rodadas}</td>
                    <td className="r" style={{color:'var(--text-muted)'}}>{d.rodadas>0?(d.total/d.rodadas).toFixed(1):'—'}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>}

          {/* ADMIN */}
          {activeTab==='admin' && isAdmin && <div>
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
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:13,color:'var(--gold)',letterSpacing:1}}>JOGO {idx+1}</span>
                    <button className="rm-btn" onClick={()=>setAdminBuf((b:any)=>({...b,matches:b.matches.filter((x:any)=>x.id!==m.id)}))}>Remover</button>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Casa:</span>
                    <input className="a-in" style={{width:50}} value={m.homeFlag} placeholder="🏳" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,homeFlag:e.target.value}:x)}))}/>
                    <input className="a-in lg" value={m.home} placeholder="País Casa" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,home:e.target.value}:x)}))}/>
                    <span className="a-lbl">Fora:</span>
                    <input className="a-in" style={{width:50}} value={m.awayFlag} placeholder="🏳" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,awayFlag:e.target.value}:x)}))}/>
                    <input className="a-in lg" value={m.away} placeholder="País Fora" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,away:e.target.value}:x)}))}/>
                  </div>
                  <div className="a-row">
                    <span className="a-lbl">Horário:</span>
                    <input className="a-in md" value={m.time} placeholder="19:00" onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,time:e.target.value}:x)}))}/>
                    <span className="a-lbl">Eliminatório:</span>
                    <label className="toggle"><input type="checkbox" checked={m.isElim} onChange={e=>setAdminBuf((b:any)=>({...b,matches:b.matches.map((x:any)=>x.id===m.id?{...x,isElim:e.target.checked}:x)}))}/><span className="tsl"/></label>
                  </div>
                </div>
              ))}
              <button className="add-btn" onClick={()=>setAdminBuf((b:any)=>({...b,matches:[...(b.matches||[]),{id:'m'+Date.now(),home:'',away:'',homeFlag:'',awayFlag:'',time:'',isElim:false}]}))}>+ Adicionar Jogo</button>
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
                  <div key={m.id} className="a-row" style={{marginBottom:6}}>
                    <span style={{fontSize:13,minWidth:160}}>{m.home||'?'} × {m.away||'?'}</span>
                    <input className="a-in sm" type="number" inputMode="numeric" min={0} value={resultInputs[m.id]?.h||''} placeholder="0"
                      onChange={e=>setResultInputs((r:any)=>({...r,[m.id]:{...r[m.id],h:e.target.value}}))}/>
                    <span style={{color:'var(--text-muted)'}}>×</span>
                    <input className="a-in sm" type="number" inputMode="numeric" min={0} value={resultInputs[m.id]?.a||''} placeholder="0"
                      onChange={e=>setResultInputs((r:any)=>({...r,[m.id]:{...r[m.id],a:e.target.value}}))}/>
                  </div>
                ))}
                <div style={{marginTop:10}}>
                  <button className="btn-sm btn-gold" onClick={applyCorrection}>⚡ Calcular Pontos Automaticamente</button>
                </div>
              </div>
              {PLAYERS.map(p=>{
                const roundPts=Object.values(state.correctedScores[p]||{}).reduce((a:any,b:any)=>a+b,0)
                const pkey=p.replace(/\s/g,'_')
                return <div key={p} className="corr-p">
                  <div className="corr-h" onClick={()=>setCorrOpen((o:any)=>({...o,[pkey]:!o[pkey]}))}>
                    <span className="corr-n">{p}</span>
                    <span className="corr-pts">{roundPts} pts <span style={{fontSize:13,color:'var(--text-muted)'}}>{state.totalPoints[p]||0} total</span></span>
                  </div>
                  {corrOpen[pkey] && <div className="corr-b">
                    {state.round.matches.map((m:any)=>{
                      const pal=state.palpites[p]?.[m.id]; const res=state.results[m.id]; const pts=state.correctedScores[p]?.[m.id]
                      const key=`${p}-${m.id}`
                      return <div key={m.id} className="corr-r">
                        <span style={{minWidth:130,color:'var(--text-muted)',fontSize:12}}>{m.home} x {m.away}</span>
                        <span>Palpite: <b>{pal&&pal.h!==''?`${pal.h}×${pal.a}`:<span style={{color:'rgba(255,255,255,.2)'}}>NP</span>}</b></span>
                        <span>Resultado: <b style={{color:'var(--gold)'}}>{res&&res.h!==''?`${res.h}×${res.a}`:'—'}</b></span>
                        {pts!==undefined&&<span className={`pts-badge pts-${pts}`}>{pts} pt{pts!==1?'s':''}</span>}
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <input className="a-in sm" type="number" inputMode="numeric" min={0} value={manualPts[key]??pts??''} placeholder="—"
                            onChange={e=>setManualPts((mp:any)=>({...mp,[key]:e.target.value}))}/>
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
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:12,color:'var(--text-muted)'}}>Tem classificado:</span>
                      <label className="toggle"><input type="checkbox" checked={ph.hasClassify} onChange={e=>setScoringPhases(ps=>ps.map((p:any,i)=>i===phIdx?{...p,hasClassify:e.target.checked}:p))}/><span className="tsl"/></label>
                      <button className="rm-btn" onClick={()=>setScoringPhases(ps=>ps.filter((_:any,i)=>i!==phIdx))}>Remover</button>
                    </div>
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
              <button className="add-btn" onClick={()=>setScoringPhases(ps=>[...ps,{id:'ph'+Date.now(),name:'Nova Fase',rules:[{desc:'Acertar o vencedor',pts:1}],hasClassify:false}])}>+ Adicionar Fase</button>
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
                <div style={{marginTop:10,display:'flex',gap:8}}>
                  <button className="btn-sm btn-gold" onClick={saveShame}>💾 Salvar</button>
                  <button className="btn-sm btn-outline" onClick={()=>{setShamePlayer('');setShameUrl('')}}>Limpar</button>
                </div>
              </div>
            </div>

            <div style={{marginBottom:24}}>
              <div className="section-title">Segurança</div>
              <div className="a-card">
                <div className="a-row"><span className="a-lbl">Nova Senha:</span><input className="a-in md" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nova senha admin"/></div>
                <div className="a-row"><span className="a-lbl">Senha Master:</span><input className="a-in md" type="password" value={masterConf} onChange={e=>setMasterConf(e.target.value)} placeholder="Confirmar com master"/></div>
                <div style={{marginTop:10}}><button className="btn-sm btn-danger" onClick={changeAdminPass}>🔑 Alterar Senha Admin</button></div>
                <div style={{marginTop:8,fontSize:11,color:'var(--text-muted)'}}>A senha master nunca muda.</div>
              </div>
            </div>
          </div>}
        </>}
      </div>
    </>
  )
}
