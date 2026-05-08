import { useState } from 'react'
import { Trash2, Plus, BookOpen } from 'lucide-react'
import { useApp } from '../lib/AppContext'
import { Topbar } from '../components/Layout'

export default function NotesPage() {
  const { state, dispatch, showToast } = useApp()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [selectedPkg, setSelectedPkg] = useState('')
  const [filter, setFilter] = useState('')

  const pkgs = state.packages
  const notes = state.studyNotes.filter(n =>
    !filter || n.title?.toLowerCase().includes(filter.toLowerCase()) ||
    n.content?.toLowerCase().includes(filter.toLowerCase())
  )

  const addNote = () => {
    if (!content.trim()) { showToast('Note cannot be empty', 'error'); return }
    dispatch({
      type: 'ADD_NOTE',
      payload: {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        packageId: selectedPkg,
        bookTitle: pkgs.find(p => p.id === selectedPkg)?.book_title || '',
      }
    })
    setContent(''); setTitle('')
    showToast('Note saved!')
  }

  const deleteNote = (id) => {
    dispatch({ type: 'DELETE_NOTE', payload: id })
    showToast('Note deleted')
  }

  return (
    <>
      <Topbar>
        <span className="tag tag-dark">{state.studyNotes.length} notes</span>
      </Topbar>

      <div className="content-area">
        <div className="grid-2 fade-up" style={{ marginBottom: 20, alignItems: 'flex-start' }}>
          {/* Add note */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Add New Note</span>
              <span className="tag tag-blue">New</span>
            </div>
            <div className="input-group">
              <label className="input-label">Note Title</label>
              <input className="input" placeholder="e.g. Thoughts on Law 1" value={title}
                onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Link to Book (optional)</label>
              <select className="select" value={selectedPkg} onChange={e => setSelectedPkg(e.target.value)}>
                <option value="">— No book selected —</option>
                {pkgs.map(p => <option key={p.id} value={p.id}>{p.book_title}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label className="input-label">Your Notes</label>
              <textarea className="textarea" style={{ minHeight: 160, fontSize: 13 }}
                placeholder="Write your thoughts, connections, real-life applications, questions…"
                value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={addNote} style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Save Note
            </button>
          </div>

          {/* Tips */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">📝 Note-Taking Tips</span></div>
              {[
                ['Connect to real life', 'Write how each principle applies to your own experiences or observations.'],
                ['Question the author', 'Note when you agree or disagree and why.'],
                ['Find counterexamples', 'When does the principle fail? Note the exceptions.'],
                ['Cross-reference', 'Link principles across different books you have analyzed.'],
              ].map(([tip, desc]) => (
                <div key={tip} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 2 }}>💡 {tip}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-5)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 6 }}>📊 Your Progress</div>
              <div className="grid-2" style={{ gap: 10 }}>
                {[
                  [state.studyNotes.length, 'Notes written'],
                  [state.bookmarks.length, 'Bookmarks saved'],
                  [state.quizScores.length, 'Quizzes taken'],
                  [state.studyStreak, 'Day streak 🔥'],
                ].map(([val, label]) => (
                  <div key={label} style={{ background: 'var(--paper)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink)' }}>{val}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes list */}
        {state.studyNotes.length > 0 && (
          <div className="fade-up fade-up-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <input className="input" style={{ maxWidth: 320 }} placeholder="Search notes…"
                value={filter} onChange={e => setFilter(e.target.value)} />
              <span style={{ fontSize: 12, color: 'var(--ink-5)' }}>{notes.length} of {state.studyNotes.length}</span>
            </div>

            {notes.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <h3>No notes match your search</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {notes.map(note => (
                  <div key={note.id} className="card card-hover">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{note.title}</div>
                        {note.bookTitle && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                            <BookOpen size={11} style={{ color: 'var(--gold)' }} />
                            <span style={{ fontSize: 11, color: 'var(--gold)' }}>{note.bookTitle}</span>
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note.content}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-5)', marginTop: 8 }}>
                          {new Date(note.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteNote(note.id)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.studyNotes.length === 0 && (
          <div className="empty-state fade-up">
            <span className="empty-icon">📓</span>
            <h3>No notes yet</h3>
            <p>Write your first note using the form above</p>
          </div>
        )}
      </div>
    </>
  )
}
