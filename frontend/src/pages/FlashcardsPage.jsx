import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react'
import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'

function shuffle(arr) {
  const a = [...arr]
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]] }
  return a
}

export default function FlashcardsPage() {
  const { state, dispatch } = useApp()
  const [selectedPkg, setSelectedPkg] = useState(state.activePackage?.id || '')
  const [cards, setCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState([])
  const [learning, setLearning] = useState([])
  const [mode, setMode] = useState('all') // all | bookmarks
  const [done, setDone] = useState(false)

  const pkgs = state.packages

  useEffect(() => {
    const pkg = pkgs.find(p => p.id === selectedPkg)
    if (!pkg) return
    let principles = pkg.principles || []
    if (mode === 'bookmarks') {
      const bIds = state.bookmarks.filter(b => b.packageId === selectedPkg).map(b => b.principleId)
      principles = principles.filter(p => bIds.includes(p.id))
    }
    setCards(principles.map(p => ({
      id: p.id,
      front: p.principle_name,
      category: p.category,
      back_insight: p.core_insight,
      back_desc: p.description,
      back_apply: p.when_to_apply?.slice(0,3) || [],
      back_avoid: p.when_not_to_apply?.slice(0,2) || [],
      risk: p.risk_level || 'medium',
    })))
    setIdx(0); setFlipped(false); setKnown([]); setLearning([]); setDone(false)
  }, [selectedPkg, mode, pkgs])

  const pkg = pkgs.find(p => p.id === selectedPkg)
  const card = cards[idx]
  const progress = cards.length ? Math.round((idx / cards.length) * 100) : 0

  const next = (verdict) => {
    if(verdict === 'know') setKnown(k => [...k, card.id])
    else setLearning(l => [...l, card.id])
    dispatch({ type:'INCREMENT_STUDIED', payload:1 })
    dispatch({ type:'UPDATE_STREAK' })
    if(idx + 1 >= cards.length) { setDone(true) }
    else { setIdx(i => i+1); setFlipped(false) }
  }

  const reset = () => { setIdx(0); setFlipped(false); setKnown([]); setLearning([]); setDone(false) }
  const doShuffle = () => { setCards(shuffle(cards)); setIdx(0); setFlipped(false); setKnown([]); setLearning([]); setDone(false) }

  return (
    <>
      <Topbar>
        {cards.length > 0 && <>
          <button className="btn btn-sm" onClick={doShuffle}><Shuffle size={12}/> Shuffle</button>
          <button className="btn btn-sm" onClick={reset}><RotateCcw size={12}/> Reset</button>
        </>}
      </Topbar>

      <div className="content-area">
        {/* Controls */}
        <div className="card fade-up" style={{marginBottom:20}}>
          <div className="grid-2" style={{gap:16}}>
            <div>
              <label className="input-label">Select Book Package</label>
              <select className="select" value={selectedPkg} onChange={e=>setSelectedPkg(e.target.value)}>
                <option value="">— Choose a book —</option>
                {pkgs.map(p=><option key={p.id} value={p.id}>{p.book_title} ({p.total_principles} principles)</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Study Mode</label>
              <div style={{display:'flex',gap:8,marginTop:4}}>
                <button className={`btn btn-sm ${mode==='all'?'btn-primary':''}`} onClick={()=>setMode('all')}>All Principles</button>
                <button className={`btn btn-sm ${mode==='bookmarks'?'btn-gold':''}`} onClick={()=>setMode('bookmarks')}>⭐ Bookmarked Only</button>
              </div>
            </div>
          </div>
        </div>

        {pkgs.length === 0 && (
          <div className="empty-state fade-up">
            <span className="empty-icon">📚</span>
            <h3>No books analyzed yet</h3>
            <p>Go to Analyze Books first to create a package</p>
            <a href="/" className="btn btn-primary" style={{marginTop:16,display:'inline-flex'}}>Analyze a Book</a>
          </div>
        )}

        {selectedPkg && cards.length === 0 && !done && (
          <div className="empty-state fade-up">
            <span className="empty-icon">🃏</span>
            <h3>No cards to show</h3>
            <p>{mode==='bookmarks'?'You have no bookmarks in this package. Bookmark some principles first.':'No principles found in this package.'}</p>
          </div>
        )}

        {done && (
          <div className="card fade-up" style={{textAlign:'center',padding:'48px 32px'}}>
            <div style={{fontSize:48,marginBottom:16}}>🎉</div>
            <h2 style={{marginBottom:8}}>Session Complete!</h2>
            <p style={{color:'var(--ink-4)',marginBottom:24}}>You reviewed {cards.length} principles</p>
            <div className="grid-2" style={{maxWidth:300,margin:'0 auto 24px'}}>
              <div style={{background:'var(--teal-bg)',borderRadius:10,padding:'16px',textAlign:'center'}}>
                <div style={{fontFamily:'var(--font-serif)',fontSize:32,color:'var(--teal)'}}>{known.length}</div>
                <div style={{fontSize:11,color:'var(--teal)',textTransform:'uppercase',letterSpacing:1}}>Got it ✓</div>
              </div>
              <div style={{background:'var(--gold-bg)',borderRadius:10,padding:'16px',textAlign:'center'}}>
                <div style={{fontFamily:'var(--font-serif)',fontSize:32,color:'var(--gold)'}}>{learning.length}</div>
                <div style={{fontSize:11,color:'var(--gold)',textTransform:'uppercase',letterSpacing:1}}>Still learning</div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <button className="btn btn-primary" onClick={reset}><RotateCcw size={13}/>Study Again</button>
              {learning.length>0 && <button className="btn btn-gold" onClick={()=>{ setCards(cards.filter(c=>learning.includes(c.id))); setIdx(0); setFlipped(false); setKnown([]); setLearning([]); setDone(false) }}>Review Difficult ({learning.length})</button>}
              <a href="/quiz" className="btn">🧠 Take a Quiz</a>
            </div>
          </div>
        )}

        {card && !done && (
          <div className="fade-up">
            {/* Progress */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{flex:1}}>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
              </div>
              <span style={{fontSize:12,color:'var(--ink-5)',flexShrink:0}}>{idx+1} / {cards.length}</span>
              <span style={{fontSize:11,color:'var(--teal)',flexShrink:0}}>✓ {known.length} known</span>
            </div>

            {/* Card */}
            <div style={{maxWidth:680,margin:'0 auto'}}>
              <div className={`flashcard ${flipped?'flipped':''}`} onClick={()=>setFlipped(f=>!f)} style={{marginBottom:20}}>
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'var(--gold)',marginBottom:12}}>{card.category} · {card.risk?.toUpperCase()} RISK</div>
                    <div style={{fontFamily:'var(--font-serif)',fontSize:22,lineHeight:1.3,marginBottom:16}}>{card.front}</div>
                    <div style={{fontSize:12,color:'rgba(232,227,214,0.45)'}}>Click to reveal</div>
                  </div>
                  <div className="flashcard-back">
                    <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'var(--gold)',marginBottom:10}}>Core Insight</div>
                    <div style={{fontFamily:'var(--font-serif)',fontSize:17,color:'var(--ink)',lineHeight:1.4,marginBottom:12}}>{card.back_insight}</div>
                    {card.back_desc && <div style={{fontSize:12,color:'var(--ink-4)',lineHeight:1.6,marginBottom:10}}>{card.back_desc}</div>}
                    {card.back_apply.length>0 && (
                      <div style={{fontSize:11,color:'var(--teal)',marginBottom:4}}>
                        <strong>Apply when:</strong> {card.back_apply[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {flipped ? (
                <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                  <button className="btn btn-lg" style={{flex:1,justifyContent:'center',background:'var(--crimson-bg)',color:'var(--crimson)',border:'2px solid var(--crimson)',fontSize:14}} onClick={()=>next('learn')}>
                    😅 Still Learning
                  </button>
                  <button className="btn btn-lg" style={{flex:1,justifyContent:'center',background:'var(--teal-bg)',color:'var(--teal)',border:'2px solid var(--teal)',fontSize:14}} onClick={()=>next('know')}>
                    ✅ Got It!
                  </button>
                </div>
              ) : (
                <div style={{textAlign:'center',color:'var(--ink-5)',fontSize:13}}>
                  👆 Click the card to flip it, then rate yourself
                </div>
              )}

              {/* Nav */}
              <div style={{display:'flex',justifyContent:'space-between',marginTop:20}}>
                <button className="btn btn-sm" onClick={()=>{setIdx(i=>Math.max(0,i-1));setFlipped(false)}} disabled={idx===0}>
                  <ChevronLeft size={12}/> Previous
                </button>
                <button className="btn btn-sm" onClick={()=>{setIdx(i=>Math.min(cards.length-1,i+1));setFlipped(false)}} disabled={idx===cards.length-1}>
                  Next <ChevronRight size={12}/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
