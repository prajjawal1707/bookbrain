import { useState } from 'react'
import { Sparkles, BookOpen, ChevronDown, ChevronUp, AlertTriangle, Package, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'

const SAMPLE_TEXT = `LAW 1: NEVER OUTSHINE THE MASTER

Always make those above you feel comfortably superior. In your desire to please and impress them, do not go too far in displaying your talents or you might accomplish the opposite — inspire fear and insecurity. Make your masters appear more brilliant than they are and you will attain the heights of power.

Observance: Nicolas Fouquet, Louis XIV's finance minister, threw the most lavish party of the century for the King at his chateau. Rather than winning favor, Fouquet was arrested within three weeks. He had outshone the master.

LAW 2: NEVER PUT TOO MUCH TRUST IN FRIENDS, LEARN HOW TO USE ENEMIES

Be wary of friends — they will betray you more quickly, for they are easily aroused to envy. But hire a former enemy and he will be more loyal, because he has more to prove. You have more to fear from friends than from enemies.

LAW 3: CONCEAL YOUR INTENTIONS

Keep people off-balance by never revealing the purpose behind your actions. If they have no clue what you are up to, they cannot prepare a defense. Guide them far enough down the wrong path and by the time they realize your intentions, it will be too late.

LAW 4: ALWAYS SAY LESS THAN NECESSARY

When trying to impress with words, the more you say, the more common you appear. Even if you are saying something banal, it will seem original if you make it vague and sphinxlike. Powerful people impress and intimidate by saying less.

LAW 6: COURT ATTENTION AT ALL COST

Everything is judged by its appearance; what is unseen counts for nothing. Never let yourself get lost in the crowd. Stand out. Be conspicuous, at whatever cost. Make yourself a magnet of attention by appearing larger, more colorful, more mysterious than the bland and timid masses.`

const PIPELINE = [
  {icon:'🧹',label:'Clean',   desc:'Remove noise'},
  {icon:'✂️', label:'Chunk',   desc:'Split text'},
  {icon:'🔍',label:'Extract', desc:'AI analysis'},
  {icon:'🧩',label:'Merge',   desc:'Deduplicate'},
  {icon:'📦',label:'Package', desc:'Finalize'},
]

const PRESET_BOOKS = [
  { title:'The 48 Laws of Power', author:'Robert Greene', depth:'standard' },
  { title:'Atomic Habits', author:'James Clear', depth:'standard' },
  { title:'Think and Grow Rich', author:'Napoleon Hill', depth:'standard' },
  { title:'The Art of War', author:'Sun Tzu', depth:'shallow' },
  { title:'How to Win Friends', author:'Dale Carnegie', depth:'standard' },
  { title:'Meditations', author:'Marcus Aurelius', depth:'deep' },
]

function PrincipleCard({ p, idx, packageId }) {
  const [open, setOpen] = useState(false)
  const { state, dispatch, showToast } = useApp()
  const isBookmarked = state.bookmarks.some(b => b.packageId === packageId && b.principleId === p.id)

  const bookmark = (e) => {
    e.stopPropagation()
    dispatch({ type:'TOGGLE_BOOKMARK', payload:{ packageId, principleId:p.id, principalName:p.principle_name, packageTitle:p.package_title } })
    showToast(isBookmarked ? 'Bookmark removed' : '⭐ Bookmarked!')
  }

  return (
    <div style={{border:'1px solid var(--paper-3)',borderRadius:8,overflow:'hidden',marginBottom:8,transition:'border-color .15s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--paper-3)'}>
      <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
        <div style={{width:26,height:26,flexShrink:0,background:'var(--ink)',color:'var(--gold-2)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)',fontSize:11}}>{String(idx).padStart(2,'0')}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{p.principle_name}</div>
          <div style={{fontSize:11,color:'var(--ink-5)',lineHeight:1.5}}>{p.core_insight}</div>
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center',flexShrink:0}}>
          <button onClick={bookmark} style={{background:'none',border:'none',cursor:'pointer',padding:3,color:isBookmarked?'var(--gold)':'var(--ink-5)',fontSize:14}}>
            {isBookmarked ? '⭐' : '☆'}
          </button>
          <span className={`tag risk-tag-${p.risk_level||'medium'}`}>{(p.risk_level||'medium').toUpperCase()}</span>
          <span className="tag tag-gray">{p.category}</span>
          {open?<ChevronUp size={13} style={{color:'var(--ink-5)'}}/>:<ChevronDown size={13} style={{color:'var(--ink-5)'}}/>}
        </div>
      </div>
      {open && (
        <div style={{padding:'0 14px 14px 50px',borderTop:'1px solid var(--paper-2)',background:'var(--paper-2)'}}>
          <p style={{fontSize:12,color:'var(--ink-3)',margin:'10px 0',lineHeight:1.7}}>{p.description}</p>
          <div className="grid-2" style={{gap:12}}>
            {p.when_to_apply?.length>0&&<div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>✅ Apply when</div>
              {p.when_to_apply.map((w,i)=><div key={i} style={{fontSize:11,color:'var(--ink-4)',marginBottom:3}}>• {w}</div>)}
            </div>}
            {p.when_not_to_apply?.length>0&&<div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--crimson)',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>⛔ Avoid when</div>
              {p.when_not_to_apply.map((w,i)=><div key={i} style={{fontSize:11,color:'var(--ink-4)',marginBottom:3}}>• {w}</div>)}
            </div>}
          </div>
          {p.example_scenarios?.length>0&&(
            <div style={{marginTop:10,background:'var(--blue-bg)',borderRadius:7,padding:'10px 12px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--blue)',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>📖 Example Scenario</div>
              <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.6}}>
                <strong>Situation:</strong> {p.example_scenarios[0].situation}<br/>
                <strong>Action:</strong> {p.example_scenarios[0].application}<br/>
                <strong>Outcome:</strong> {p.example_scenarios[0].expected_outcome}
              </div>
            </div>
          )}
          {p.keywords?.length>0&&<div style={{marginTop:8,display:'flex',gap:5,flexWrap:'wrap'}}>{p.keywords.map(k=><span key={k} className="tag tag-gray">{k}</span>)}</div>}
        </div>
      )}
    </div>
  )
}

export default function AnalyzePage() {
  const { state, dispatch, showToast } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', author:'', text:'', extraction_depth:'standard', focus_areas:[] })
  const [loading, setLoading] = useState(false)
  const [pipeStep, setPipeStep] = useState(-1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showPresets, setShowPresets] = useState(false)
  const [nameInput, setNameInput] = useState(state.studentName)

  const toggleFocus = a => setForm(f => ({ ...f, focus_areas:f.focus_areas.includes(a)?f.focus_areas.filter(x=>x!==a):[...f.focus_areas,a] }))

  const simulate = async () => {
    for(let i=0;i<PIPELINE.length;i++){ setPipeStep(i); await new Promise(r=>setTimeout(r,600+Math.random()*400)) }
    setPipeStep(5)
  }

  const submit = async () => {
    if(!form.title.trim()||!form.text.trim()){ setError('Please provide a title and text.'); return }
    if(form.text.length<300){ setError('Text must be at least 300 characters.'); return }
    setError(null); setResult(null); setLoading(true); setPipeStep(0)
    try {
      const [,data] = await Promise.all([
        simulate(),
        api.analyzeBook({ title:form.title, author:form.author||undefined, text:form.text, extraction_depth:form.extraction_depth, focus_areas:form.focus_areas.length?form.focus_areas:undefined })
      ])
      setResult(data)
      dispatch({ type:'ADD_PACKAGE', payload:data.package })
      dispatch({ type:'UPDATE_STREAK' })
      dispatch({ type:'INCREMENT_STUDIED', payload:data.package.total_principles_extracted })
      showToast(`✓ Extracted ${data.package.total_principles_extracted} principles from "${form.title}"`)
    } catch(e){ setError(e.message); showToast(e.message,'error'); setPipeStep(-1) }
    finally{ setLoading(false) }
  }

  return (
    <>
      <Topbar>
        {!state.studentName && (
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input className="input" style={{width:160,fontSize:12}} placeholder="Your name (optional)" value={nameInput} onChange={e=>setNameInput(e.target.value)}
              onBlur={()=>nameInput&&dispatch({type:'SET_STUDENT_NAME',payload:nameInput})}/>
          </div>
        )}
        <button className="btn btn-sm" onClick={()=>setShowPresets(s=>!s)}><BookOpen size={12}/>Presets</button>
        <button className="btn btn-sm" onClick={()=>setForm(f=>({...f,title:'The 48 Laws of Power',author:'Robert Greene',text:SAMPLE_TEXT}))}>Sample</button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading?<><span className="spinner"/>Analyzing…</>:<><Sparkles size={14}/>Run Analysis</>}
        </button>
      </Topbar>

      <div className="content-area">
        {/* Hero */}
        <div className="fade-up" style={{background:'var(--ink)',borderRadius:'var(--radius-lg)',padding:'26px 30px',marginBottom:20,display:'flex',alignItems:'center',gap:32,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:-40,top:-40,width:280,height:280,background:'radial-gradient(circle,rgba(196,147,42,0.1) 0%,transparent 65%)',pointerEvents:'none'}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'var(--gold)',marginBottom:8}}>Free AI · For College Students</div>
            <h1 style={{color:'#fdf5e0',fontSize:'1.75rem',marginBottom:8}}>Turn any book into a<br/>personal study system</h1>
            <p style={{fontSize:13,color:'rgba(232,227,214,0.5)',maxWidth:440,lineHeight:1.6}}>Paste any chapter, analyze it with free AI, then study with flashcards, quizzes, and an AI tutor — all built automatically from the text.</p>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-gold btn-sm" onClick={()=>navigate('/flashcards')}>⚡ Flashcards</button>
              <button className="btn btn-sm" style={{background:'rgba(255,255,255,0.1)',color:'rgba(232,227,214,0.8)',border:'1px solid rgba(232,227,214,0.2)'}} onClick={()=>navigate('/quiz')}>🧠 Quiz Me</button>
            </div>
          </div>
          <div style={{display:'flex',gap:24,flexShrink:0}}>
            {[['📚',state.packages.length||0,'Books'],['🎯',state.totalPrinciplesStudied||0,'Studied'],['🔥',state.studyStreak||0,'Day Streak']].map(([icon,n,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <span style={{fontSize:18,display:'block',marginBottom:2}}>{icon}</span>
                <span style={{fontFamily:'var(--font-serif)',fontSize:24,color:'var(--gold-2)',display:'block'}}>{n}</span>
                <span style={{fontSize:10,color:'rgba(232,227,214,.3)',letterSpacing:1,textTransform:'uppercase'}}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Presets */}
        {showPresets && (
          <div className="card fade-up" style={{marginBottom:20}}>
            <div className="card-header"><span className="card-title">Popular Books — Quick Start</span><button className="btn btn-sm" onClick={()=>setShowPresets(false)}>✕ Close</button></div>
            <div className="grid-3" style={{gap:8}}>
              {PRESET_BOOKS.map(b=>(
                <button key={b.title} onClick={()=>{setForm(f=>({...f,title:b.title,author:b.author,extraction_depth:b.depth}));setShowPresets(false)}}
                  style={{padding:'10px 12px',background:'var(--paper-2)',border:'1px solid var(--paper-3)',borderRadius:8,cursor:'pointer',textAlign:'left',transition:'all .15s',fontFamily:'var(--font-sans)'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--paper-3)'}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--ink)',marginBottom:2}}>{b.title}</div>
                  <div style={{fontSize:10,color:'var(--ink-5)'}}>{b.author}</div>
                </button>
              ))}
            </div>
            <div style={{marginTop:12,padding:'10px 14px',background:'var(--gold-bg)',borderRadius:8,fontSize:12,color:'var(--ink-3)',border:'1px solid var(--gold-border)'}}>
              💡 Select a book preset, then paste the actual text below. The preset only fills the title and author fields.
            </div>
          </div>
        )}

        <div className="grid-2 fade-up fade-up-1" style={{marginBottom:20}}>
          <div className="card">
            <div className="card-header"><span className="card-title">Book Details</span><span className="tag tag-blue">Step 1</span></div>
            <div className="input-group">
              <label className="input-label">Book Title *</label>
              <input className="input" placeholder="e.g. The 48 Laws of Power" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            </div>
            <div className="input-group">
              <label className="input-label">Author</label>
              <input className="input" placeholder="e.g. Robert Greene" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))}/>
            </div>
            <div className="input-group">
              <label className="input-label">Extraction Depth</label>
              <select className="select" value={form.extraction_depth} onChange={e=>setForm(f=>({...f,extraction_depth:e.target.value}))}>
                <option value="shallow">Shallow — Fast, great for 1-2 chapters</option>
                <option value="standard">Standard — Balanced, recommended</option>
                <option value="deep">Deep — Thorough, full text analysis</option>
              </select>
              <div className="input-hint">For college assignments, "Standard" works best for most chapters.</div>
            </div>
            <div className="input-group" style={{marginBottom:0}}>
              <label className="input-label">Focus Areas (optional)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                {['principles','tactics','philosophy','warnings'].map(a=>(
                  <button key={a} onClick={()=>toggleFocus(a)} className={`btn btn-sm ${form.focus_areas.includes(a)?'btn-gold':''}`}>{a}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Book Text *</span>
              <span style={{fontSize:11,color:'var(--ink-5)'}}>{form.text.length.toLocaleString()} chars · ~{Math.max(1,Math.round(form.text.split(' ').filter(Boolean).length/250))} pages</span>
            </div>
            <textarea className="textarea" style={{minHeight:260,fontSize:12}} value={form.text}
              placeholder="Paste your book chapter or text here (minimum 300 characters).&#10;&#10;Works great with:&#10;• Textbook chapters&#10;• Classic literature&#10;• Self-help books&#10;• Business books&#10;• Philosophy texts"
              onChange={e=>setForm(f=>({...f,text:e.target.value}))}/>
          </div>
        </div>

        {(loading||result) && (
          <div className="card fade-up" style={{marginBottom:20}}>
            <div className="card-header">
              <span className="card-title">Extraction Pipeline</span>
              {loading?<span className="tag tag-gold pulse">● Processing</span>:<span className="tag tag-teal">✓ Complete</span>}
            </div>
            <div style={{display:'flex',borderRadius:8,overflow:'hidden',border:'1px solid var(--paper-3)'}}>
              {PIPELINE.map((s,i)=>{
                const done=pipeStep>i||(!loading&&result); const active=pipeStep===i&&loading
                return <div key={s.label} style={{flex:1,padding:'12px 8px',textAlign:'center',background:done?'var(--teal-bg)':active?'var(--gold-bg)':'var(--paper-2)',borderRight:i<4?'1px solid var(--paper-3)':'none',transition:'background .3s'}}>
                  <div style={{fontSize:18,marginBottom:3}}>{s.icon}</div>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--ink-3)'}}>{s.label}</div>
                  <div style={{fontSize:9,marginTop:2,color:done?'var(--teal)':active?'var(--gold)':'var(--ink-5)'}}>{done?'✓ done':active?'● running':s.desc}</div>
                </div>
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="fade-up" style={{background:'var(--crimson-bg)',border:'1px solid rgba(155,44,44,.2)',borderRadius:'var(--radius-md)',padding:'13px 16px',marginBottom:20,display:'flex',gap:10}}>
            <AlertTriangle size={15} style={{color:'var(--crimson)',flexShrink:0,marginTop:1}}/>
            <div>
              <div style={{fontSize:13,color:'var(--crimson)',fontWeight:600,marginBottom:3}}>{error}</div>
              {error.includes('connect')||error.includes('fetch') ? (
                <div style={{fontSize:12,color:'var(--crimson)'}}>Make sure the backend is running: <code style={{fontFamily:'var(--font-mono)'}}>uvicorn app.main:app --reload --port 8000</code></div>
              ) : null}
            </div>
          </div>
        )}

        {result && (
          <div className="fade-up">
            <div className="grid-4" style={{marginBottom:20}}>
              {[['📚',result.package.total_principles_extracted,'Principles'],['📝',(result.text_stats?.word_count||0).toLocaleString(),'Words'],['📄',result.text_stats?.estimated_pages||'—','Est. Pages'],['🔬',result.package.extraction_depth,'Depth']].map(([icon,val,label])=>(
                <div key={label} style={{background:'var(--paper-2)',borderRadius:8,padding:'14px',textAlign:'center'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:22}}>{val}</div>
                  <div style={{fontSize:10,color:'var(--ink-5)',textTransform:'uppercase',letterSpacing:1,marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>

            {/* Study actions */}
            <div style={{background:'var(--gold-bg)',border:'1px solid var(--gold-border)',borderRadius:'var(--radius-md)',padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>📖 Ready to study "{result.package.book_title}"</div>
                <div style={{fontSize:11,color:'var(--ink-4)'}}>{result.package.total_principles_extracted} principles extracted. Choose how you want to study:</div>
              </div>
              <button className="btn btn-primary" onClick={()=>navigate('/flashcards')}><span>⚡</span> Flashcards</button>
              <button className="btn btn-gold" onClick={()=>navigate('/quiz')}><span>🧠</span> Quiz Mode</button>
              <button className="btn" onClick={()=>navigate('/advisor')}><span>💬</span> AI Tutor</button>
              <button className="btn" onClick={()=>navigate('/notes')}><span>📝</span> Take Notes</button>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Extracted Principles — {result.package.book_title}</span>
                <code style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--gold)'}}>ID: {result.package_id}</code>
              </div>
              {(result.package.principles||[]).slice(0,12).map((p,i)=>(
                <PrincipleCard key={p.id||i} p={{...p,package_title:result.package.book_title}} idx={i+1} packageId={result.package_id}/>
              ))}
              {result.package.principles?.length>12&&<div style={{textAlign:'center',padding:'10px',fontSize:13,color:'var(--ink-4)'}}>+{result.package.principles.length-12} more in full package</div>}
              <hr className="divider"/>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="btn btn-primary" onClick={()=>navigate('/packages')}><Package size={13}/>View Package</button>
                <button className="btn" onClick={()=>navigate('/flashcards')}>⚡ Flashcards</button>
                <button className="btn" onClick={()=>navigate('/quiz')}>🧠 Quiz</button>
                <button className="btn" onClick={()=>navigate('/advisor')}>💬 AI Tutor</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
