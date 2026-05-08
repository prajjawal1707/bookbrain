import { useState, useEffect } from 'react'
import { Trash2, ChevronDown, ChevronUp, Zap, MessageSquare, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'

function PackageCard({ pkg, onDelete }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const colors = ['linear-gradient(135deg,#1a1a2e,#16213e)','linear-gradient(135deg,#1b4332,#2d6a4f)','linear-gradient(135deg,#3d0c02,#6b1e10)','linear-gradient(135deg,#1a2a4a,#2d4a7a)','linear-gradient(135deg,#2a1a3e,#4a2d6e)']
  const ci = (pkg.book_title?.charCodeAt(0)||0) % colors.length

  return (
    <div className="card" style={{ marginBottom:14 }}>
      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
        <div style={{ width:52, height:68, borderRadius:6, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:colors[ci], fontFamily:'var(--font-serif)', fontSize:8, color:'rgba(255,255,255,.7)', textAlign:'center', padding:6, lineHeight:1.3 }}>
          {pkg.book_title?.slice(0,20)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:2 }}>{pkg.book_title}</div>
              {pkg.author && <div style={{ fontSize:12, color:'var(--ink-5)', marginBottom:6 }}>{pkg.author}</div>}
              {pkg.summary && <div style={{ fontSize:11, color:'var(--ink-5)', lineHeight:1.5 }}>{pkg.summary.slice(0,120)}{pkg.summary.length>120?'…':''}</div>}
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <span className="tag tag-gold">{pkg.total_principles} principles</span>
              <span className="tag tag-gray">{new Date(pkg.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
            <button className="btn btn-sm btn-primary" onClick={()=>{ dispatch({type:'SET_ACTIVE',payload:pkg}); navigate('/prompts') }}><Zap size={11}/>Prompt</button>
            <button className="btn btn-sm" onClick={()=>{ dispatch({type:'SET_ACTIVE',payload:pkg}); navigate('/advisor') }}><MessageSquare size={11}/>AI Tutor</button>
            <button className="btn btn-sm" onClick={()=>{ dispatch({type:'SET_ACTIVE',payload:pkg}); navigate('/flashcards') }}>⚡ Flashcards</button>
            <button className="btn btn-sm" onClick={()=>{ dispatch({type:'SET_ACTIVE',payload:pkg}); navigate('/quiz') }}>🧠 Quiz</button>
            <button className="btn btn-sm" onClick={()=>setOpen(o=>!o)}>{open?<ChevronUp size={11}/>:<ChevronDown size={11}/>} Details</button>
            <button className="btn btn-sm btn-danger" onClick={()=>onDelete(pkg.id)}><Trash2 size={11}/></button>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--paper-3)' }}>
          <code style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--gold)', background:'var(--gold-bg)', padding:'2px 8px', borderRadius:4, display:'inline-block', marginBottom:12 }}>ID: {pkg.id}</code>

          {pkg.philosophical_framework?.worldview && (
            <div style={{ background:'var(--paper-2)', borderRadius:8, padding:'12px 14px', marginBottom:12 }}>
              <div className="grid-2" style={{ gap:14 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Worldview</div>
                  <p style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.6 }}>{pkg.philosophical_framework.worldview}</p>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Decision Model</div>
                  <p style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.6 }}>{pkg.philosophical_framework.decision_making_model}</p>
                </div>
              </div>
            </div>
          )}

          {pkg.behavioral_guidelines?.length>0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Guidelines</div>
              {pkg.behavioral_guidelines.map((g,i) => <div key={i} style={{ fontSize:12, color:'var(--ink-3)', marginBottom:4, display:'flex', gap:8 }}><span style={{ color:'var(--teal)', flexShrink:0 }}>•</span>{g}</div>)}
            </div>
          )}

          {pkg.cautions?.length>0 && (
            <div style={{ background:'var(--crimson-bg)', borderRadius:8, padding:'10px 14px', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--crimson)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>⚠ Cautions</div>
              {pkg.cautions.map((c,i) => <div key={i} style={{ fontSize:12, color:'var(--crimson)', marginBottom:3 }}>• {c}</div>)}
            </div>
          )}

          {pkg.principles?.length>0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>All Principles ({pkg.principles.length})</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {pkg.principles.map((p,i) => <span key={i} className={`tag risk-tag-${p.risk_level||'medium'}`}>{p.principle_name}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PackagesPage() {
  const { state, dispatch, showToast } = useApp()
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const d = await api.listPackages(); dispatch({ type:'SET_PACKAGES', payload:d.packages }) }
    catch(e) { showToast(e.message,'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const del = async id => {
    try {
      await api.deletePackage(id)
      dispatch({ type:'SET_PACKAGES', payload:state.packages.filter(p=>p.id!==id) })
      showToast('Package deleted')
    } catch(e) { showToast(e.message,'error') }
  }

  return (
    <>
      <Topbar>
        <button className="btn btn-sm" onClick={load} disabled={loading}><RefreshCw size={12}/>Refresh</button>
        <span className="tag tag-dark">{state.packages.length} books</span>
      </Topbar>
      <div className="content-area">
        {state.packages.length === 0 ? (
          <div className="empty-state fade-up">
            <span className="empty-icon">📦</span>
            <h3>No packages yet</h3>
            <p>Analyze a book to create your first behavior package</p>
            <a href="/" className="btn btn-primary" style={{ marginTop:16, display:'inline-flex' }}>Analyze a Book</a>
          </div>
        ) : (
          <div className="fade-up">
            {state.packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onDelete={del}/>)}
          </div>
        )}
      </div>
    </>
  )
}
