import { NavLink, useLocation } from 'react-router-dom'
import { BookOpen, Package, Zap, MessageSquare, Brain, Star, FileText, BarChart2, ChevronRight, Activity, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useApp } from '../lib/AppContext'

const NAV = [
  { section: 'Study Tools' },
  { to: '/',            icon: BookOpen,      label: 'Analyze Books'  },
  { to: '/flashcards',  icon: Brain,         label: 'Flashcards',    badge:'NEW' },
  { to: '/quiz',        icon: HelpCircle,    label: 'Quiz Mode',     badge:'NEW' },
  { to: '/notes',       icon: FileText,      label: 'My Notes'       },
  { to: '/dashboard',   icon: BarChart2,     label: 'Progress'       },
  { section: 'Library' },
  { to: '/packages',    icon: Package,       label: 'Book Packages'  },
  { to: '/prompts',     icon: Zap,           label: 'Prompt Builder' },
  { to: '/advisor',     icon: MessageSquare, label: 'AI Advisor'     },
  { to: '/bookmarks',   icon: Star,          label: 'Bookmarks'      },
]

const PAGE_META = {
  '/':           { title:'Analyze Books',      sub:'Extract structured knowledge from any book or chapter' },
  '/flashcards': { title:'Flashcards',         sub:'Study principles with interactive flip cards' },
  '/quiz':       { title:'Quiz Mode',          sub:'Test your knowledge with AI-generated questions' },
  '/notes':      { title:'Study Notes',        sub:'Your personal notes on principles and ideas' },
  '/dashboard':  { title:'Progress Dashboard', sub:'Track your learning streak and achievements' },
  '/packages':   { title:'Book Packages',      sub:'Your extracted knowledge modules' },
  '/prompts':    { title:'Prompt Builder',     sub:'Generate AI system prompts from packages' },
  '/advisor':    { title:'AI Advisor',         sub:'Chat with a principle-guided AI tutor' },
  '/bookmarks':  { title:'Bookmarks',          sub:'Principles you saved for later review' },
}

function Sidebar() {
  const [healthy, setHealthy] = useState(null)
  const [provider, setProvider] = useState(null)
  const { state } = useApp()

  useEffect(() => {
    api.health().then(d => { setHealthy(true); setProvider(d.ai_provider) }).catch(() => setHealthy(false))
  }, [])

  return (
    <aside style={{position:'fixed',top:0,left:0,width:'var(--sidebar-w)',height:'100vh',background:'var(--ink)',display:'flex',flexDirection:'column',zIndex:100,borderRight:'1px solid rgba(232,227,214,0.06)'}}>
      <div style={{padding:'20px 18px 16px',borderBottom:'1px solid rgba(232,227,214,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,background:'var(--gold)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-serif)',fontSize:16,color:'var(--ink)',fontWeight:700,flexShrink:0}}>B</div>
          <div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:19,color:'#fdf5e0',letterSpacing:'-0.3px'}}>BookBrain</div>
            <div style={{fontSize:9,color:'rgba(232,227,214,0.28)',letterSpacing:'1.5px',textTransform:'uppercase',marginTop:1}}>Student Edition</div>
          </div>
        </div>
        {state.studentName && (
          <div style={{marginTop:10,padding:'6px 10px',background:'rgba(232,227,214,0.06)',borderRadius:7,fontSize:11,color:'rgba(232,227,214,0.5)',display:'flex',alignItems:'center',gap:6}}>
            <span>👤</span>{state.studentName}
            {state.studyStreak>0 && <span style={{marginLeft:'auto',color:'var(--gold-2)',fontWeight:600}}>🔥{state.studyStreak}</span>}
          </div>
        )}
      </div>
      <nav style={{flex:1,padding:'10px',overflowY:'auto'}}>
        {NAV.map((item,i) => {
          if(item.section) return <div key={i} style={{fontSize:9,color:'rgba(232,227,214,0.22)',letterSpacing:'1.8px',textTransform:'uppercase',padding:'12px 10px 5px',fontWeight:600}}>{item.section}</div>
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.to==='/'}
              style={({isActive})=>({display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:8,fontSize:13,fontWeight:500,color:isActive?'var(--gold-2)':'rgba(232,227,214,0.52)',background:isActive?'rgba(196,147,42,0.14)':'transparent',textDecoration:'none',marginBottom:2,transition:'all .12s'})}>
              {({isActive})=><>
                <Icon size={14} style={{flexShrink:0,opacity:isActive?1:0.65}}/>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge&&<span style={{fontSize:8,fontWeight:700,background:'var(--gold)',color:'var(--ink)',padding:'1px 5px',borderRadius:3}}>{item.badge}</span>}
                {isActive&&<ChevronRight size={11} style={{opacity:.45}}/>}
              </>}
            </NavLink>
          )
        })}
      </nav>
      <div style={{padding:'12px',borderTop:'1px solid rgba(232,227,214,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
          <Activity size={10} style={{color:healthy===true?'var(--teal-2)':healthy===false?'var(--crimson)':'rgba(232,227,214,.25)'}}/>
          <span style={{fontSize:10,color:'rgba(232,227,214,.32)'}}>
            {healthy===true?`AI: ${provider?.provider||'connected'}`:healthy===false?'Backend offline':'Connecting…'}
          </span>
        </div>
        {healthy===false&&<div style={{background:'rgba(155,44,44,.15)',border:'1px solid rgba(155,44,44,.25)',borderRadius:7,padding:'8px 10px',fontSize:10,color:'rgba(232,100,100,.8)',lineHeight:1.5}}>
          Start backend:<br/><code style={{fontFamily:'var(--font-mono)',opacity:.8}}>uvicorn app.main:app --reload</code>
        </div>}
        {healthy===true&&provider&&<div style={{background:'rgba(196,147,42,0.10)',border:'1px solid rgba(196,147,42,0.18)',borderRadius:8,padding:'8px 12px'}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--gold-2)',marginBottom:1}}>{provider.local?'🖥 Local AI (Ollama)':'☁ Cloud AI (Free)'}</div>
          <div style={{fontSize:10,color:'rgba(232,227,214,0.35)'}}>{provider.model}</div>
        </div>}
      </div>
    </aside>
  )
}

export function Topbar({children}) {
  const {pathname} = useLocation()
  const meta = PAGE_META[pathname]||PAGE_META['/']
  return (
    <header style={{height:'var(--topbar-h)',borderBottom:'1px solid var(--paper-3)',display:'flex',alignItems:'center',padding:'0 32px',gap:12,background:'var(--paper)',position:'sticky',top:0,zIndex:50}}>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:'var(--ink)',letterSpacing:'-0.2px'}}>{meta.title}</div>
        <div style={{fontSize:11,color:'var(--ink-5)',marginTop:1}}>{meta.sub}</div>
      </div>
      {children}
    </header>
  )
}

export default function Layout({children}) {
  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="page-main">{children}</main>
    </div>
  )
}
