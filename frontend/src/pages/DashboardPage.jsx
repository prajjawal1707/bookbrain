import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'
import { useNavigate } from 'react-router-dom'

const ACHIEVEMENTS = [
  { id:'first_book',   icon:'📚', title:'First Book',       desc:'Analyze your first book',            check: s => s.packages.length >= 1 },
  { id:'five_books',   icon:'🏛',  title:'Scholar',          desc:'Analyze 5 books',                   check: s => s.packages.length >= 5 },
  { id:'streak3',      icon:'🔥', title:'On Fire',           desc:'3-day study streak',                check: s => s.studyStreak >= 3 },
  { id:'streak7',      icon:'⚡', title:'Week Warrior',      desc:'7-day study streak',                check: s => s.studyStreak >= 7 },
  { id:'notes5',       icon:'📝', title:'Note Taker',        desc:'Write 5 study notes',              check: s => s.studyNotes.length >= 5 },
  { id:'quiz_pass',    icon:'🎯', title:'Quiz Master',       desc:'Score 100% on a quiz',             check: s => s.quizScores.some(q => q.score === q.total && q.total > 0) },
  { id:'bookmarks10',  icon:'⭐', title:'Collector',         desc:'Bookmark 10 principles',           check: s => s.bookmarks.length >= 10 },
  { id:'studied50',    icon:'🧠', title:'Knowledge Seeker',  desc:'Study 50 principles',              check: s => s.totalPrinciplesStudied >= 50 },
]

export default function DashboardPage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const bestQuiz = state.quizScores.length
    ? state.quizScores.reduce((b, q) => (q.score/q.total > b.score/b.total ? q : b), state.quizScores[0])
    : null

  const avgQuizPct = state.quizScores.length
    ? Math.round(state.quizScores.reduce((s, q) => s + (q.score / q.total) * 100, 0) / state.quizScores.length)
    : 0

  const totalPrinciples = state.packages.reduce((s, p) => s + (p.total_principles || 0), 0)

  const stats = [
    { icon:'📚', val: state.packages.length,          label:'Books Analyzed',     color:'var(--blue-bg)',    tc:'var(--blue)' },
    { icon:'🧠', val: totalPrinciples,                label:'Total Principles',   color:'var(--purple-bg)',  tc:'var(--purple)' },
    { icon:'🔥', val: state.studyStreak,              label:'Day Streak',         color:'var(--orange-bg)',  tc:'var(--orange)' },
    { icon:'📝', val: state.studyNotes.length,        label:'Notes Written',      color:'var(--teal-bg)',    tc:'var(--teal)' },
    { icon:'⭐', val: state.bookmarks.length,         label:'Bookmarks',          color:'var(--gold-bg)',    tc:'var(--gold)' },
    { icon:'🎯', val: state.quizScores.length,        label:'Quizzes Taken',      color:'var(--crimson-bg)', tc:'var(--crimson)' },
    { icon:'✅', val: `${avgQuizPct}%`,               label:'Avg Quiz Score',     color:'var(--teal-bg)',    tc:'var(--teal)' },
    { icon:'📖', val: state.totalPrinciplesStudied,   label:'Principles Studied', color:'var(--paper-2)',    tc:'var(--ink-3)' },
  ]

  const unlocked = ACHIEVEMENTS.filter(a => a.check(state))
  const locked   = ACHIEVEMENTS.filter(a => !a.check(state))

  const clearData = () => {
    if(window.confirm('Reset ALL your progress? This cannot be undone.')) {
      localStorage.removeItem('bookbrain_student_data')
      window.location.reload()
    }
  }

  return (
    <>
      <Topbar>
        {state.studentName && <span className="tag tag-dark">👤 {state.studentName}</span>}
        <button className="btn btn-sm btn-danger" onClick={clearData}>Reset Progress</button>
      </Topbar>

      <div className="content-area">
        {/* Welcome banner */}
        <div className="fade-up" style={{ background:'var(--ink)', borderRadius:'var(--radius-lg)', padding:'24px 28px', marginBottom:24, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-30, top:-30, width:220, height:220, background:'radial-gradient(circle,rgba(196,147,42,0.12) 0%,transparent 65%)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.6rem', color:'#fdf5e0', marginBottom:6 }}>
                {state.studentName ? `Welcome back, ${state.studentName}! 👋` : 'Your Learning Dashboard'}
              </div>
              <div style={{ fontSize:13, color:'rgba(232,227,214,0.5)', lineHeight:1.6 }}>
                {state.packages.length === 0
                  ? 'Start by analyzing your first book to begin tracking your progress.'
                  : `You've analyzed ${state.packages.length} book${state.packages.length>1?'s':''}, earned ${unlocked.length} achievement${unlocked.length!==1?'s':''}, and have a ${state.studyStreak}-day streak.`
                }
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:48, color:'var(--gold-2)', lineHeight:1 }}>
                {state.studyStreak > 0 ? `🔥${state.studyStreak}` : '📚'}
              </div>
              <div style={{ fontSize:10, color:'rgba(232,227,214,.35)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>
                {state.studyStreak > 0 ? 'day streak' : 'start studying'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid-4 fade-up fade-up-1" style={{ marginBottom:24 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background:s.color }}>
                <span>{s.icon}</span>
              </div>
              <div>
                <div className="stat-value" style={{ color:s.tc }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2 fade-up fade-up-2" style={{ marginBottom:24 }}>
          {/* Quiz history */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Quiz Scores</span>
              <button className="btn btn-sm" onClick={()=>navigate('/quiz')}>Take Quiz →</button>
            </div>
            {state.quizScores.length === 0 ? (
              <div className="empty-state" style={{ padding:'24px' }}>
                <span style={{ fontSize:28, display:'block', marginBottom:8 }}>🎯</span>
                <p style={{ fontSize:13 }}>No quizzes taken yet</p>
                <button className="btn btn-sm btn-primary" style={{ marginTop:10 }} onClick={()=>navigate('/quiz')}>Start a Quiz</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {state.quizScores.slice(0,8).map((q, i) => {
                  const pct = Math.round((q.score/q.total)*100)
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.bookTitle || 'Unknown Book'}</div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width:`${pct}%`, background:pct>=70?'var(--teal)':pct>=50?'var(--gold)':'var(--crimson)' }} />
                        </div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:pct>=70?'var(--teal)':pct>=50?'var(--gold)':'var(--crimson)', flexShrink:0, minWidth:40, textAlign:'right' }}>{pct}%</span>
                      <span style={{ fontSize:11, color:'var(--ink-5)', flexShrink:0 }}>{q.score}/{q.total}</span>
                    </div>
                  )
                })}
                {bestQuiz && (
                  <div style={{ marginTop:8, padding:'8px 12px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:8, fontSize:12, color:'var(--ink-3)' }}>
                    🏆 Best: {Math.round((bestQuiz.score/bestQuiz.total)*100)}% on <strong>{bestQuiz.bookTitle}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Analyzed books */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Your Book Library</span>
              <button className="btn btn-sm" onClick={()=>navigate('/')}>+ Analyze →</button>
            </div>
            {state.packages.length === 0 ? (
              <div className="empty-state" style={{ padding:'24px' }}>
                <span style={{ fontSize:28, display:'block', marginBottom:8 }}>📚</span>
                <p style={{ fontSize:13 }}>No books analyzed yet</p>
                <button className="btn btn-sm btn-primary" style={{ marginTop:10 }} onClick={()=>navigate('/')}>Analyze First Book</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {state.packages.slice(0,6).map(pkg => (
                  <div key={pkg.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--paper-3)' }}>
                    <div style={{ width:36, height:46, background:'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius:4, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'rgba(255,255,255,.6)', textAlign:'center', padding:3, fontFamily:'var(--font-serif)', lineHeight:1.2 }}>
                      {pkg.book_title?.slice(0,15)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pkg.book_title}</div>
                      <div style={{ fontSize:10, color:'var(--ink-5)' }}>{pkg.author || 'Unknown'}</div>
                    </div>
                    <span className="tag tag-gold">{pkg.total_principles}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="card fade-up fade-up-3">
          <div className="card-header">
            <span className="card-title">Achievements</span>
            <span style={{ fontSize:12, color:'var(--ink-5)' }}>{unlocked.length}/{ACHIEVEMENTS.length} unlocked</span>
          </div>
          <div className="grid-4" style={{ gap:12, marginBottom: locked.length ? 16 : 0 }}>
            {unlocked.map(a => (
              <div key={a.id} style={{ background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:10, padding:'14px 12px', textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{a.icon}</div>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:3, color:'var(--ink)' }}>{a.title}</div>
                <div style={{ fontSize:10, color:'var(--ink-5)', lineHeight:1.4 }}>{a.desc}</div>
              </div>
            ))}
          </div>
          {locked.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-5)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Locked — {locked.length} remaining</div>
              <div className="grid-4" style={{ gap:10 }}>
                {locked.map(a => (
                  <div key={a.id} style={{ background:'var(--paper-2)', border:'1px solid var(--paper-3)', borderRadius:10, padding:'12px', textAlign:'center', opacity:.6 }}>
                    <div style={{ fontSize:24, marginBottom:5, filter:'grayscale(100%)' }}>{a.icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, marginBottom:2 }}>{a.title}</div>
                    <div style={{ fontSize:10, color:'var(--ink-5)', lineHeight:1.4 }}>{a.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
