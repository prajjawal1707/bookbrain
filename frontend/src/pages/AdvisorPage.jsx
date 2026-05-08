import { useState, useRef, useEffect } from 'react'
import { Send, Loader, Brain, ChevronDown, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'

const QUICK_PROMPTS = [
  'How does this principle apply to student life?',
  'Give me a real-world example from college.',
  'What is the risk of misusing this principle?',
  'How do I negotiate a better grade or deadline?',
  'My professor is difficult to deal with. Advice?',
  'How do I stand out in class without being disliked?',
]

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start', marginBottom:14, alignItems:'flex-end', gap:8 }}>
      {!isUser && (
        <div style={{ width:28, height:28, background:'var(--gold)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-serif)', fontSize:12, color:'var(--ink)', fontWeight:700, flexShrink:0 }}>B</div>
      )}
      <div style={{ maxWidth:'76%' }}>
        {!isUser && msg.principle && (
          <div style={{ fontSize:9, fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1, marginBottom:4, display:'flex', gap:5, alignItems:'center' }}>
            <Brain size={9}/> Applying: {msg.principle}
          </div>
        )}
        <div style={{ padding:'11px 14px', borderRadius:10, fontSize:13, lineHeight:1.7, background:isUser?'var(--ink)':'var(--paper)', color:isUser?'#e8e3d6':'var(--ink)', border:isUser?'none':'1px solid var(--paper-3)', borderBottomRightRadius:isUser?3:10, borderBottomLeftRadius:isUser?10:3 }}>
          {msg.content}
        </div>
        {!isUser && msg.reasoning?.length > 0 && (
          <div style={{ marginTop:5 }}>
            <button onClick={()=>setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, color:'var(--ink-5)', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-sans)', padding:0 }}>
              <ChevronDown size={10} style={{ transform:open?'rotate(180deg)':'none', transition:'transform .2s' }}/>
              Reasoning trace · {Math.round((msg.confidence||0.8)*100)}% confidence
            </button>
            {open && (
              <div style={{ marginTop:5, background:'var(--paper-2)', borderRadius:6, padding:'8px 10px' }}>
                {msg.reasoning.map((s,i) => <div key={i} style={{ fontSize:11, color:'var(--ink-4)', marginBottom:3, display:'flex', gap:6 }}><span style={{ color:'var(--teal)', flexShrink:0 }}>→</span>{s}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdvisorPage() {
  const { state, dispatch, showToast } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [style, setStyle] = useState('advisory')
  const [messages, setMessages] = useState(() => {
    const history = state.chatHistory || []
    return history.length > 0 ? history : [{
      role:'ai', content:'Hello! I\'m your AI study advisor, guided by the principles of the book you select. Ask me anything — about the principles, how to apply them in college, real-life scenarios, or strategic decisions. Select a book package above to get started.', principle:null
    }]
  })
  const bottomRef = useRef(null)
  const active = state.activePackage
  const pkgs = state.packages

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, loading])

  const send = async (queryOverride) => {
    const q = (queryOverride || input).trim()
    if (!q || loading) return
    if (!active) { showToast('Select a behavior package first','error'); return }
    setInput('')
    const userMsg = { role:'user', content:q }
    setMessages(m => [...m, userMsg])
    dispatch({ type:'ADD_CHAT_MSG', payload:userMsg })
    setLoading(true)
    try {
      const data = await api.respond({ user_query:q, behavior_package:active, persona:'study advisor and mentor', response_style:style })
      const r = data.ai_response
      const aiMsg = { role:'ai', content:r.response, principle:r.principle_applied, reasoning:r.reasoning_trace, confidence:r.confidence }
      setMessages(m => [...m, aiMsg])
      dispatch({ type:'ADD_CHAT_MSG', payload:aiMsg })
    } catch(e) {
      const errMsg = { role:'ai', content:`Error: ${e.message}. Please make sure the backend is running and your AI provider is configured in backend/.env` }
      setMessages(m => [...m, errMsg])
      showToast(e.message,'error')
    } finally { setLoading(false) }
  }

  const clearChat = () => {
    setMessages([{ role:'ai', content:'Chat cleared. Select a book package and ask me anything!', principle:null }])
    dispatch({ type:'CLEAR_CHAT' })
  }

  return (
    <>
      <Topbar>
        <select className="select" style={{ width:'auto', minWidth:210, fontSize:12 }} value={active?.id||''} onChange={e=>{ const p=pkgs.find(x=>x.id===e.target.value); if(p) dispatch({type:'SET_ACTIVE',payload:p}) }}>
          <option value="">— Select behavior package —</option>
          {pkgs.map(p=><option key={p.id} value={p.id}>{p.book_title}</option>)}
        </select>
        <select className="select" style={{ width:'auto', fontSize:12 }} value={style} onChange={e=>setStyle(e.target.value)}>
          <option value="advisory">Advisory</option>
          <option value="tactical">Tactical</option>
          <option value="detailed">Detailed</option>
          <option value="concise">Concise</option>
        </select>
        <button className="btn btn-sm btn-danger" onClick={clearChat}><Trash2 size={11}/></button>
      </Topbar>

      <div style={{ display:'flex', height:`calc(100vh - var(--topbar-h))` }}>
        {/* Main chat */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {active && (
            <div style={{ background:'var(--ink)', padding:'10px 20px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(232,227,214,.08)' }}>
              <div style={{ width:26, height:26, background:'var(--gold)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-serif)', fontSize:12, color:'var(--ink)', fontWeight:700 }}>B</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#e8e3d6' }}>AI Advisor — {active.book_title}</div>
                <div style={{ fontSize:10, color:'rgba(232,227,214,.4)' }}>{active.total_principles_extracted||active.total_principles} principles · {style} mode</div>
              </div>
              <div style={{ marginLeft:'auto', width:8, height:8, background:'var(--teal-2)', borderRadius:'50%' }}/>
            </div>
          )}

          <div className="chat-scroll" style={{ flex:1, overflowY:'auto', padding:'20px' }}>
            {!active && (
              <div className="empty-state">
                <span className="empty-icon">🧠</span>
                <h3>Select a behavior package</h3>
                <p>Choose a book from the dropdown to activate your AI advisor</p>
                <a href="/packages" className="btn btn-primary" style={{ marginTop:16, display:'inline-flex' }}>Browse Packages</a>
              </div>
            )}
            {messages.map((m, i) => <Bubble key={i} msg={m}/>)}
            {loading && (
              <div style={{ display:'flex', gap:8, alignItems:'center', color:'var(--ink-5)', fontSize:13, marginLeft:36 }}>
                <Loader size={14} style={{ animation:'spin .8s linear infinite' }}/> Applying principles…
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={{ padding:'14px 20px', borderTop:'1px solid var(--paper-3)', background:'var(--paper)', display:'flex', gap:10 }}>
            <input className="input" style={{ flex:1 }}
              placeholder={active ? 'Ask anything about the principles or your situation…' : 'Select a package to start…'}
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
              disabled={!active||loading}/>
            <button className="btn btn-primary" onClick={()=>send()} disabled={!active||loading||!input.trim()}>
              {loading ? <span className="spinner"/> : <Send size={14}/>}
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        {active && (
          <div style={{ width:240, flexShrink:0, borderLeft:'1px solid var(--paper-3)', overflowY:'auto', background:'var(--paper-2)', padding:'16px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Active Principles</div>
            {(active.principles||[]).slice(0,10).map((p,i) => (
              <div key={i} style={{ marginBottom:7, padding:'8px 10px', background:'var(--paper)', borderRadius:6, border:'1px solid var(--paper-3)', cursor:'default' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--paper-3)'}>
                <div style={{ fontSize:11, fontWeight:600, marginBottom:2 }}>{p.principle_name}</div>
                <div style={{ fontSize:10, color:'var(--ink-5)', lineHeight:1.4 }}>{p.core_insight?.slice(0,65)}{p.core_insight?.length>65?'…':''}</div>
                <span className={`tag risk-tag-${p.risk_level||'medium'}`} style={{ marginTop:4, display:'inline-flex', fontSize:9 }}>{p.risk_level}</span>
              </div>
            ))}

            <div style={{ marginTop:14, padding:'10px 12px', background:'var(--gold-bg)', borderRadius:8, border:'1px solid var(--gold-border)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>💡 Quick Questions</div>
              {QUICK_PROMPTS.map((q,i) => (
                <button key={i} onClick={()=>send(q)} style={{ display:'block', width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--ink-3)', padding:'4px 0', fontFamily:'var(--font-sans)', lineHeight:1.4, borderBottom:'1px solid rgba(196,147,42,0.15)', paddingBottom:6, marginBottom:6 }}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--ink-3)'}>
                  → {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
