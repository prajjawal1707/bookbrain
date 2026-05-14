import { useState, useRef } from 'react'
import { Sparkles, BookOpen, ChevronDown, ChevronUp, AlertTriangle, Package, Upload, FileText, X } from 'lucide-react'
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

When trying to impress with words, the more you say, the more common you appear. Even if you are saying something banal, it will seem original if you make it vague and sphinxlike. Powerful people impress and intimidate by saying less.`

const PIPELINE = [
  { icon:'🧹', label:'Clean',   desc:'Remove noise'  },
  { icon:'✂️',  label:'Chunk',   desc:'Split text'    },
  { icon:'🔍', label:'Extract', desc:'AI analysis'   },
  { icon:'🧩', label:'Merge',   desc:'Deduplicate'   },
  { icon:'📦', label:'Package', desc:'Finalize'      },
]

// ── Principle Card ────────────────────────────────────────
function PrincipleCard({ p, idx, packageId }) {
  const [open, setOpen] = useState(false)
  const { state, dispatch, showToast } = useApp()
  const isBookmarked = state.bookmarks.some(
    b => b.packageId === packageId && b.principleId === p.id
  )

  const bookmark = (e) => {
    e.stopPropagation()
    dispatch({ type:'TOGGLE_BOOKMARK', payload:{ packageId, principleId:p.id, principalName:p.principle_name } })
    showToast(isBookmarked ? 'Bookmark removed' : '⭐ Bookmarked!')
  }

  return (
    <div style={{ border:'1px solid var(--paper-3)', borderRadius:8, overflow:'hidden', marginBottom:8 }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--paper-3)'}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', cursor:'pointer' }} onClick={()=>setOpen(o=>!o)}>
        <div style={{ width:26,height:26,flexShrink:0,background:'var(--ink)',color:'var(--gold-2)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)',fontSize:11 }}>
          {String(idx).padStart(2,'0')}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{p.principle_name}</div>
          <div style={{ fontSize:11, color:'var(--ink-5)', lineHeight:1.5 }}>{p.core_insight}</div>
        </div>
        <div style={{ display:'flex', gap:5, alignItems:'center', flexShrink:0 }}>
          <button onClick={bookmark} style={{ background:'none',border:'none',cursor:'pointer',padding:3,fontSize:15,color:isBookmarked?'var(--gold)':'var(--ink-5)' }}>
            {isBookmarked ? '⭐' : '☆'}
          </button>
          <span className={`tag risk-tag-${p.risk_level||'medium'}`}>{(p.risk_level||'medium').toUpperCase()}</span>
          <span className="tag tag-gray">{p.category}</span>
          {open ? <ChevronUp size={13} style={{color:'var(--ink-5)'}}/> : <ChevronDown size={13} style={{color:'var(--ink-5)'}}/>}
        </div>
      </div>
      {open && (
        <div style={{ padding:'0 14px 14px 50px', borderTop:'1px solid var(--paper-2)', background:'var(--paper-2)' }}>
          <p style={{ fontSize:12, color:'var(--ink-3)', margin:'10px 0', lineHeight:1.7 }}>{p.description}</p>
          <div className="grid-2" style={{ gap:12 }}>
            {p.when_to_apply?.length>0 && (
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:1,marginBottom:5 }}>✅ Apply when</div>
                {p.when_to_apply.map((w,i)=><div key={i} style={{fontSize:11,color:'var(--ink-4)',marginBottom:3}}>• {w}</div>)}
              </div>
            )}
            {p.when_not_to_apply?.length>0 && (
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:'var(--crimson)',textTransform:'uppercase',letterSpacing:1,marginBottom:5 }}>⛔ Avoid when</div>
                {p.when_not_to_apply.map((w,i)=><div key={i} style={{fontSize:11,color:'var(--ink-4)',marginBottom:3}}>• {w}</div>)}
              </div>
            )}
          </div>
          {p.keywords?.length>0 && (
            <div style={{ marginTop:8, display:'flex', gap:5, flexWrap:'wrap' }}>
              {p.keywords.map(k=><span key={k} className="tag tag-gray">{k}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── PDF Upload Zone ───────────────────────────────────────
function PdfUploadZone({ onTextExtracted, onTitleSuggested }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File too large. Maximum 20MB.')
      return
    }
    setUploading(true)
    setUploadError('')
    setUploadResult(null)
    try {
      const data = await api.uploadPdf(file)
      setUploadResult({ name: file.name, stats: data.stats, message: data.message })
      onTextExtracted(data.extracted_text)
      if (data.suggested_title) onTitleSuggested(data.suggested_title)
    } catch(e) {
      setUploadError(e.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const clear = () => {
    setUploadResult(null)
    setUploadError('')
    onTextExtracted('')
    onTitleSuggested('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      {!uploadResult && (
        <div
          onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}
          onDragOver={e=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onClick={()=>!uploading&&fileInputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?'var(--gold)':'var(--paper-3)'}`, borderRadius:'var(--radius-md)', padding:'32px 20px', textAlign:'center', cursor:uploading?'wait':'pointer', background:dragging?'var(--gold-bg)':'var(--paper-2)', transition:'all .2s' }}
        >
          {uploading ? (
            <>
              <span className="spinner" style={{ width:28,height:28,borderWidth:3,margin:'0 auto 12px',display:'block' }}/>
              <div style={{ fontSize:13,fontWeight:600,color:'var(--ink-3)',marginBottom:4 }}>Reading PDF…</div>
              <div style={{ fontSize:11,color:'var(--ink-5)' }}>Extracting text, please wait</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:36, marginBottom:10 }}>📄</div>
              <div style={{ fontSize:14,fontWeight:600,color:'var(--ink-2)',marginBottom:6 }}>
                {dragging ? 'Drop your PDF here' : 'Click to upload or drag & drop'}
              </div>
              <div style={{ fontSize:11,color:'var(--ink-5)',marginBottom:14 }}>Any text-based PDF · Max 20MB</div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 18px',background:'var(--ink)',color:'var(--gold-2)',borderRadius:6,fontSize:13,fontWeight:600 }}>
                <Upload size={14}/> Choose PDF
              </div>
            </>
          )}
        </div>
      )}

      {uploadResult && (
        <div style={{ border:'1.5px solid var(--teal)',borderRadius:'var(--radius-md)',padding:'16px',background:'var(--teal-bg)',display:'flex',gap:12,alignItems:'flex-start' }}>
          <div style={{ fontSize:28,flexShrink:0 }}>✅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13,fontWeight:600,color:'var(--teal)',marginBottom:4 }}>{uploadResult.name}</div>
            <div style={{ fontSize:12,color:'var(--ink-3)',marginBottom:8 }}>{uploadResult.message}</div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <span className="tag tag-teal">{uploadResult.stats.num_pages} pages</span>
              <span className="tag tag-teal">{uploadResult.stats.word_count?.toLocaleString()} words</span>
              <span className="tag tag-teal">{uploadResult.stats.total_chars?.toLocaleString()} chars</span>
            </div>
          </div>
          <button onClick={clear} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--teal)',padding:4,fontSize:16 }}>✕</button>
        </div>
      )}

      {uploadError && (
        <div style={{ marginTop:10,padding:'12px 14px',background:'var(--crimson-bg)',border:'1px solid rgba(155,44,44,.2)',borderRadius:8,fontSize:13,color:'var(--crimson)' }}>
          <div style={{ fontWeight:600,marginBottom:3 }}>⚠ {uploadError}</div>
          {(uploadError.includes('scanned')||uploadError.includes('image')||uploadError.includes('No text')) && (
            <div style={{ fontSize:11 }}>Try switching to Paste Text mode and paste the text manually.</div>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:'none' }}
        onChange={e=>handleFile(e.target.files[0])} />

      <div style={{ marginTop:10,padding:'9px 12px',background:'var(--gold-bg)',border:'1px solid var(--gold-border)',borderRadius:8,fontSize:11,color:'var(--ink-3)' }}>
        💡 Works with text-based PDFs (most ebooks, articles, textbooks). Scanned PDFs — use Paste Text instead.
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function AnalyzePage() {
  const { state, dispatch, showToast } = useApp()
  const navigate = useNavigate()
  const [inputMode, setInputMode] = useState('pdf')
  const [form, setForm] = useState({ title:'', author:'', text:'', extraction_depth:'standard', focus_areas:[] })
  const [loading, setLoading] = useState(false)
  const [pipeStep, setPipeStep] = useState(-1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const toggleFocus = a => setForm(f => ({
    ...f,
    focus_areas: f.focus_areas.includes(a) ? f.focus_areas.filter(x=>x!==a) : [...f.focus_areas, a]
  }))

  const simulate = async () => {
    for(let i=0;i<PIPELINE.length;i++){
      setPipeStep(i)
      await new Promise(r=>setTimeout(r,500+Math.random()*300))
    }
    setPipeStep(5)
  }

  const submit = async () => {
    if (!form.title.trim()) { setError('Please enter a book title.'); return }
    if (!form.text.trim())  { setError('Please upload a PDF or paste some text.'); return }
    if (form.text.length < 300) { setError('Text must be at least 300 characters. Try the sample text button.'); return }
    setError(null); setResult(null); setLoading(true); setPipeStep(0)
    try {
      const [, data] = await Promise.all([
        simulate(),
        api.analyzeBook({
          title: form.title,
          author: form.author || undefined,
          text: form.text,
          extraction_depth: form.extraction_depth,
          focus_areas: form.focus_areas.length ? form.focus_areas : undefined,
        })
      ])
      setResult(data)
      dispatch({ type:'ADD_PACKAGE', payload:data.package })
      dispatch({ type:'UPDATE_STREAK' })
      dispatch({ type:'INCREMENT_STUDIED', payload:data.package.total_principles_extracted })
      showToast(`✓ Extracted ${data.package.total_principles_extracted} principles from "${form.title}"`)
    } catch(e) {
      setError(e.message)
      showToast(e.message, 'error')
      setPipeStep(-1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Topbar>
        <button className="btn btn-sm" onClick={()=>setForm(f=>({...f,title:'The 48 Laws of Power',author:'Robert Greene',text:SAMPLE_TEXT}))}>
          📖 Load Sample
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <><span className="spinner"/>Analyzing…</> : <><Sparkles size={14}/>Run Analysis</>}
        </button>
      </Topbar>

      <div className="content-area">
        {/* Hero banner */}
        <div className="fade-up" style={{ background:'var(--ink)',borderRadius:'var(--radius-lg)',padding:'24px 28px',marginBottom:20,display:'flex',alignItems:'center',gap:28,position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',right:-40,top:-40,width:260,height:260,background:'radial-gradient(circle,rgba(196,147,42,0.1) 0%,transparent 65%)',pointerEvents:'none' }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'var(--gold)',marginBottom:8 }}>Upload PDF or Paste Text · Free AI</div>
            <h1 style={{ color:'#fdf5e0',fontSize:'1.7rem',marginBottom:8 }}>Turn any book into a<br/>personal study system</h1>
            <p style={{ fontSize:13,color:'rgba(232,227,214,0.5)',maxWidth:400,lineHeight:1.6 }}>
              Upload a PDF or paste text. AI extracts principles automatically, then you study with flashcards, quizzes, and an AI tutor.
            </p>
          </div>
          <div style={{ display:'flex',gap:22,flexShrink:0 }}>
            {[['📚',state.packages.length||0,'Books'],['🎯',state.totalPrinciplesStudied||0,'Studied'],['🔥',state.studyStreak||0,'Streak']].map(([icon,n,l])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <span style={{ fontSize:18,display:'block',marginBottom:2 }}>{icon}</span>
                <span style={{ fontFamily:'var(--font-serif)',fontSize:24,color:'var(--gold-2)',display:'block' }}>{n}</span>
                <span style={{ fontSize:10,color:'rgba(232,227,214,.3)',letterSpacing:1,textTransform:'uppercase' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2 fade-up fade-up-1" style={{ marginBottom:20 }}>
          {/* LEFT — Book details */}
          <div className="card">
            <div className="card-header"><span className="card-title">Book Details</span><span className="tag tag-blue">Step 1</span></div>

            <div className="input-group">
              <label className="input-label">Book Title *</label>
              <input className="input" placeholder="e.g. The 48 Laws of Power"
                value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            </div>

            <div className="input-group">
              <label className="input-label">Author (optional)</label>
              <input className="input" placeholder="e.g. Robert Greene"
                value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))}/>
            </div>

            <div className="input-group">
              <label className="input-label">Extraction Depth</label>
              <select className="select" value={form.extraction_depth} onChange={e=>setForm(f=>({...f,extraction_depth:e.target.value}))}>
                <option value="shallow">Shallow — Fast (1-2 chapters)</option>
                <option value="standard">Standard — Balanced (recommended)</option>
                <option value="deep">Deep — Full text, thorough</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom:0 }}>
              <label className="input-label">Focus Areas (optional)</label>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginTop:4 }}>
                {['principles','tactics','philosophy','warnings'].map(a=>(
                  <button key={a} onClick={()=>toggleFocus(a)} className={`btn btn-sm ${form.focus_areas.includes(a)?'btn-gold':''}`}>{a}</button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Input mode toggle */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Book Content</span>
              <div style={{ display:'flex',gap:4 }}>
                <button onClick={()=>setInputMode('pdf')} className={`btn btn-sm ${inputMode==='pdf'?'btn-primary':''}`}>
                  <FileText size={11}/> PDF Upload
                </button>
                <button onClick={()=>setInputMode('text')} className={`btn btn-sm ${inputMode==='text'?'btn-primary':''}`}>
                  <BookOpen size={11}/> Paste Text
                </button>
              </div>
            </div>

            {inputMode === 'pdf' ? (
              <PdfUploadZone
                onTextExtracted={text => setForm(f=>({...f, text}))}
                onTitleSuggested={title => { if (title && !form.title) setForm(f=>({...f, title})) }}
              />
            ) : (
              <div>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                  <span style={{ fontSize:11,color:'var(--ink-5)' }}>{form.text.length.toLocaleString()} characters</span>
                  <button className="btn btn-sm" onClick={()=>setForm(f=>({...f,title:'The 48 Laws of Power',author:'Robert Greene',text:SAMPLE_TEXT}))}>
                    Load Sample
                  </button>
                </div>
                <textarea className="textarea" style={{ minHeight:280,fontSize:12 }}
                  placeholder="Paste your book text here (min 300 characters)."
                  value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))}/>
                {form.text.length > 0 && form.text.length < 300 && (
                  <div style={{ marginTop:6,fontSize:11,color:'var(--crimson)' }}>
                    Need {300 - form.text.length} more characters minimum.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline */}
        {(loading || result) && (
          <div className="card fade-up" style={{ marginBottom:20 }}>
            <div className="card-header">
              <span className="card-title">Extraction Pipeline</span>
              {loading ? <span className="tag tag-gold">● Processing</span> : <span className="tag tag-teal">✓ Complete</span>}
            </div>
            <div style={{ display:'flex',borderRadius:8,overflow:'hidden',border:'1px solid var(--paper-3)' }}>
              {PIPELINE.map((s,i) => {
                const done = pipeStep>i||(!loading&&result)
                const active = pipeStep===i&&loading
                return (
                  <div key={s.label} style={{ flex:1,padding:'12px 8px',textAlign:'center',background:done?'var(--teal-bg)':active?'var(--gold-bg)':'var(--paper-2)',borderRight:i<4?'1px solid var(--paper-3)':'none',transition:'background .3s' }}>
                    <div style={{ fontSize:18,marginBottom:3 }}>{s.icon}</div>
                    <div style={{ fontSize:11,fontWeight:600,color:'var(--ink-3)' }}>{s.label}</div>
                    <div style={{ fontSize:9,marginTop:2,color:done?'var(--teal)':active?'var(--gold)':'var(--ink-5)' }}>
                      {done?'✓ done':active?'● running':s.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fade-up" style={{ background:'var(--crimson-bg)',border:'1px solid rgba(155,44,44,.2)',borderRadius:'var(--radius-md)',padding:'14px 16px',marginBottom:20,display:'flex',gap:10 }}>
            <AlertTriangle size={15} style={{ color:'var(--crimson)',flexShrink:0,marginTop:1 }}/>
            <div>
              <div style={{ fontSize:13,color:'var(--crimson)',fontWeight:600,marginBottom:3 }}>{error}</div>
              {(error.includes('connect')||error.includes('fetch')||error.includes('Failed to fetch')) && (
                <div style={{ fontSize:12,color:'var(--crimson)' }}>
                  Backend not running. Start it: <code style={{ fontFamily:'var(--font-mono)' }}>uvicorn app.main:app --reload --port 8000</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="fade-up">
            <div className="grid-4" style={{ marginBottom:20 }}>
              {[
                ['📚', result.package.total_principles_extracted, 'Principles'],
                ['📝', (result.text_stats?.word_count||0).toLocaleString(), 'Words'],
                ['📄', result.text_stats?.estimated_pages||'—', 'Est. Pages'],
                ['🔬', result.package.extraction_depth, 'Depth'],
              ].map(([icon,val,label])=>(
                <div key={label} style={{ background:'var(--paper-2)',borderRadius:8,padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:20,marginBottom:4 }}>{icon}</div>
                  <div style={{ fontFamily:'var(--font-serif)',fontSize:22 }}>{val}</div>
                  <div style={{ fontSize:10,color:'var(--ink-5)',textTransform:'uppercase',letterSpacing:1,marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'var(--gold-bg)',border:'1px solid var(--gold-border)',borderRadius:'var(--radius-md)',padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
              <div style={{ flex:1,minWidth:180 }}>
                <div style={{ fontSize:13,fontWeight:600,marginBottom:2 }}>📖 Ready to study "{result.package.book_title}"</div>
                <div style={{ fontSize:11,color:'var(--ink-4)' }}>{result.package.total_principles_extracted} principles extracted.</div>
              </div>
              <button className="btn btn-primary" onClick={()=>navigate('/flashcards')}>⚡ Flashcards</button>
              <button className="btn btn-gold"    onClick={()=>navigate('/quiz')}>🧠 Quiz</button>
              <button className="btn"             onClick={()=>navigate('/advisor')}>💬 AI Tutor</button>
              <button className="btn"             onClick={()=>navigate('/notes')}>📝 Notes</button>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Extracted Principles — {result.package.book_title}</span>
                <code style={{ fontSize:11,fontFamily:'var(--font-mono)',color:'var(--gold)' }}>ID: {result.package_id}</code>
              </div>
              {(result.package.principles||[]).slice(0,12).map((p,i)=>(
                <PrincipleCard key={p.id||i} p={p} idx={i+1} packageId={result.package_id}/>
              ))}
              {result.package.principles?.length > 12 && (
                <div style={{ textAlign:'center',padding:'10px',fontSize:13,color:'var(--ink-4)' }}>
                  +{result.package.principles.length-12} more in the full package
                </div>
              )}
              <hr className="divider"/>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
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