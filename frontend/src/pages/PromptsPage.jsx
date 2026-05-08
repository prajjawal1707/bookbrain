import { useState } from 'react'
import { Zap, Copy, Check, RefreshCw, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'

export default function PromptsPage() {
  const { state, dispatch, showToast } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ persona:'strategic advisor', tone:'direct', include_reasoning_steps:true })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState('system')
  const active = state.activePackage
  const pkgs = state.packages

  const generate = async () => {
    if (!active) { showToast('Select a package first','error'); return }
    setLoading(true)
    try {
      const data = await api.generatePrompt({ raw_package:active, persona:form.persona, tone:form.tone, include_reasoning_steps:form.include_reasoning_steps })
      setResult(data); dispatch({ type:'SET_PROMPT', payload:data.generated_prompt }); showToast('Prompt generated!')
    } catch(e) { showToast(e.message,'error') }
    finally { setLoading(false) }
  }

  const copy = txt => {
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(()=>setCopied(false),2000); showToast('Copied to clipboard!')
  }

  const tabContent = result ? ({ system:result.generated_prompt?.system_prompt, template:result.generated_prompt?.instruction_template, chain:result.generated_prompt?.reasoning_chain?.join('\n') }[tab]||'') : ''

  return (
    <>
      <Topbar>
        {result && <button className="btn btn-sm" onClick={()=>copy(tabContent)}>{copied?<><Check size={12}/>Copied!</>:<><Copy size={12}/>Copy</>}</button>}
        <button className="btn btn-primary" onClick={generate} disabled={loading||!active}>
          {loading?<><span className="spinner"/>Generating…</>:<><Zap size={14}/>Generate Prompt</>}
        </button>
      </Topbar>

      <div className="content-area">
        <div className="grid-2 fade-up" style={{ marginBottom:20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Configuration</span></div>
            <div className="input-group">
              <label className="input-label">Source Package</label>
              <select className="select" value={active?.id||''} onChange={e=>{ const p=pkgs.find(x=>x.id===e.target.value); if(p) dispatch({type:'SET_ACTIVE',payload:p}) }}>
                <option value="">— Select a package —</option>
                {pkgs.map(p=><option key={p.id} value={p.id}>{p.book_title} ({p.total_principles} principles)</option>)}
              </select>
              {pkgs.length===0&&<div className="input-hint">No packages yet. <a href="/" style={{color:'var(--gold)'}}>Analyze a book first →</a></div>}
            </div>
            <div className="input-group">
              <label className="input-label">AI Persona</label>
              <input className="input" value={form.persona} onChange={e=>setForm(f=>({...f,persona:e.target.value}))} placeholder="e.g. strategic advisor, study coach, mentor"/>
            </div>
            <div className="input-group">
              <label className="input-label">Tone</label>
              <select className="select" value={form.tone} onChange={e=>setForm(f=>({...f,tone:e.target.value}))}>
                <option value="direct">Direct — Tactical, action-oriented</option>
                <option value="advisory">Advisory — Thoughtful, nuanced</option>
                <option value="formal">Formal — Professional, structured</option>
                <option value="socratic">Socratic — Question-led, guiding</option>
                <option value="conversational">Conversational — Natural, warm</option>
              </select>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={form.include_reasoning_steps} onChange={e=>setForm(f=>({...f,include_reasoning_steps:e.target.checked}))} style={{ width:16, height:16, accentColor:'var(--gold)' }}/>
              <span style={{ fontSize:13, color:'var(--ink-3)' }}>Include step-by-step reasoning chain</span>
            </label>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Active Package Preview</span></div>
            {active ? (
              <>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>{active.book_title}</div>
                {active.author && <div style={{ fontSize:12, color:'var(--ink-5)', marginBottom:8 }}>{active.author}</div>}
                <div style={{ fontSize:11, color:'var(--gold)', marginBottom:12 }}>{active.total_principles_extracted||active.total_principles} principles loaded</div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {(active.principles||[]).slice(0,6).map((p,i)=><span key={i} className={`tag risk-tag-${p.risk_level||'medium'}`} style={{fontSize:9}}>{p.principle_name}</span>)}
                  {(active.principles||[]).length>6&&<span className="tag tag-gray">+{active.principles.length-6} more</span>}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding:'24px' }}>
                <span style={{ fontSize:28, display:'block', marginBottom:8 }}>📦</span>
                <p style={{ fontSize:13 }}>Select a package above to preview</p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="card fade-up">
            <div className="card-header">
              <span className="card-title">Generated Output</span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span className="tag tag-gold">~{result.generated_prompt?.token_estimate} tokens</span>
                <button className="btn btn-sm" onClick={()=>copy(tabContent)}><Copy size={11}/>Copy</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--paper-3)', marginBottom:16 }}>
              {[['system','System Prompt'],['template','Instruction Template'],['chain','Reasoning Chain']].map(([k,l])=>(
                <button key={k} onClick={()=>setTab(k)} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, border:'none', background:'transparent', cursor:'pointer', color:tab===k?'var(--ink)':'var(--ink-5)', borderBottom:tab===k?'2px solid var(--gold)':'2px solid transparent', marginBottom:'-1px', fontFamily:'var(--font-sans)' }}>{l}</button>
              ))}
            </div>
            <div className="code-block" style={{ maxHeight:380, overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{tabContent}</div>
            {result.generated_prompt?.example_interaction && (
              <div style={{ marginTop:16, border:'1px solid var(--paper-3)', borderRadius:8, overflow:'hidden' }}>
                <div style={{ background:'var(--ink)', padding:'10px 14px', fontSize:11, fontWeight:600, color:'rgba(232,227,214,.6)', letterSpacing:1, textTransform:'uppercase' }}>Example Interaction</div>
                <div style={{ padding:'14px', background:'var(--paper-2)' }}>
                  <div style={{ marginBottom:10 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:1 }}>User</span>
                    <p style={{ fontSize:12, color:'var(--ink-3)', marginTop:4, lineHeight:1.6 }}>{result.generated_prompt.example_interaction.user}</p>
                  </div>
                  <div>
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:1 }}>AI Response</span>
                    <p style={{ fontSize:12, color:'var(--ink-3)', marginTop:4, lineHeight:1.6 }}>{result.generated_prompt.example_interaction.assistant_response}</p>
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginTop:16, display:'flex', gap:8 }}>
              <button className="btn btn-primary" onClick={()=>navigate('/advisor')}><MessageSquare size={13}/>Test in AI Advisor</button>
              <button className="btn" onClick={generate}><RefreshCw size={13}/>Regenerate</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
