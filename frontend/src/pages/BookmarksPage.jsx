import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'
import { Trash2 } from 'lucide-react'

export default function BookmarksPage() {
  const { state, dispatch, showToast } = useApp()

  const remove = (packageId, principleId) => {
    dispatch({ type:'TOGGLE_BOOKMARK', payload:{ packageId, principleId } })
    showToast('Bookmark removed')
  }

  const bookmarks = state.bookmarks.map(b => {
    const pkg = state.packages.find(p => p.id === b.packageId)
    const principle = pkg?.principles?.find(p => p.id === b.principleId)
    return { ...b, pkg, principle }
  }).filter(b => b.principle)

  // Group by book
  const grouped = bookmarks.reduce((acc, b) => {
    const key = b.packageId
    if (!acc[key]) acc[key] = { title: b.pkg?.book_title || 'Unknown', items:[] }
    acc[key].items.push(b)
    return acc
  }, {})

  return (
    <>
      <Topbar>
        <span className="tag tag-dark">⭐ {bookmarks.length} saved</span>
      </Topbar>

      <div className="content-area">
        {bookmarks.length === 0 ? (
          <div className="empty-state fade-up">
            <span className="empty-icon">⭐</span>
            <h3>No bookmarks yet</h3>
            <p>While reading principles in Analyze Books, click the ☆ icon to bookmark them for quick review here.</p>
            <a href="/" className="btn btn-primary" style={{ marginTop:16, display:'inline-flex' }}>Go Analyze a Book</a>
          </div>
        ) : (
          <div className="fade-up">
            {Object.entries(grouped).map(([pkgId, group]) => (
              <div key={pkgId} className="card" style={{ marginBottom:16 }}>
                <div className="card-header">
                  <span className="card-title">📚 {group.title}</span>
                  <span className="tag tag-gold">{group.items.length} bookmarks</span>
                </div>
                {group.items.map(b => (
                  <div key={b.principleId} style={{ border:'1px solid var(--paper-3)', borderRadius:8, padding:'12px 14px', marginBottom:8, display:'flex', gap:12, alignItems:'flex-start' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--paper-3)'}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{b.principle?.principle_name}</div>
                      <div style={{ fontSize:12, color:'var(--ink-4)', lineHeight:1.6, marginBottom:6 }}>{b.principle?.core_insight}</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span className={`tag risk-tag-${b.principle?.risk_level||'medium'}`}>{b.principle?.risk_level?.toUpperCase()}</span>
                        <span className="tag tag-gray">{b.principle?.category}</span>
                        {b.principle?.keywords?.slice(0,2).map(k=><span key={k} className="tag tag-gray">{k}</span>)}
                      </div>
                      {b.principle?.when_to_apply?.length>0 && (
                        <div style={{ marginTop:8, fontSize:11, color:'var(--teal)' }}>
                          ✅ Apply when: {b.principle.when_to_apply[0]}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={()=>remove(b.packageId, b.principleId)}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ marginTop:16, textAlign:'center' }}>
              <a href="/flashcards" className="btn btn-primary">⚡ Study Bookmarks as Flashcards</a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
