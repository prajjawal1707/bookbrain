import { useState } from "react"
import { api } from "../lib/api"
import { useApp } from "../lib/AppContext"
import { Topbar } from "../components/Layout"

export default function QuizPage() {
  const { state, dispatch, showToast } = useApp()
  const [selectedPkg, setSelectedPkg] = useState(state.activePackage?.id || "")
  const [numQ, setNumQ] = useState(5)
  const [difficulty, setDifficulty] = useState("medium")
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")
  const pkgs = state.packages

  const generateQuiz = async () => {
    const pkg = pkgs.find(p => p.id === selectedPkg)
    if (!pkg) { showToast("Select a book first", "error"); return }
    if (!pkg.principles || pkg.principles.length === 0) {
      showToast("No principles found. Re-analyze the book first.", "error"); return
    }
    setLoading(true); setQuestions([]); setAnswers({})
    setSubmitted(false); setScore(0); setErrorMsg("")
    try {
      const data = await api.generateQuiz({
        book_title: pkg.book_title,
        principles: pkg.principles.slice(0, 10),
        num_questions: numQ,
        difficulty: difficulty,
      })
      if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        showToast("Generated " + data.questions.length + " questions!")
      } else {
        setErrorMsg("No questions were returned. Please try again.")
        showToast("No questions returned", "error")
      }
    } catch(e) {
      setErrorMsg("Error: " + e.message)
      showToast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const submit = () => {
    let correct = 0
    questions.forEach((q, i) => { if (answers[i] === q.correct_index) correct++ })
    setScore(correct); setSubmitted(true)
    const pkg = pkgs.find(p => p.id === selectedPkg)
    dispatch({ type:"ADD_QUIZ_SCORE", payload:{ packageId:selectedPkg, bookTitle:pkg?.book_title, score:correct, total:questions.length, date:new Date().toISOString() }})
    dispatch({ type:"UPDATE_STREAK" })
    const p = Math.round((correct/questions.length)*100)
    if (p===100) showToast("Perfect score!")
    else if (p>=70) showToast("Good job! " + correct + "/" + questions.length)
    else showToast(correct + "/" + questions.length + " - Keep studying!", "info")
  }

  const reset = () => { setQuestions([]); setAnswers({}); setSubmitted(false); setScore(0); setErrorMsg("") }
  const answeredCount = Object.keys(answers).length
  const pct = questions.length ? Math.round((score/questions.length)*100) : 0

  return (
    <>
      <Topbar>
        {questions.length > 0 && !submitted && (
          <button className="btn btn-primary" onClick={submit} disabled={answeredCount < questions.length}>
            Submit ({answeredCount}/{questions.length} answered)
          </button>
        )}
        {submitted && <button className="btn" onClick={reset}>New Quiz</button>}
      </Topbar>
      <div className="content-area">
        <div className="card fade-up" style={{marginBottom:20}}>
          <div className="card-header"><span className="card-title">Quiz Setup</span></div>
          <div className="grid-3" style={{gap:16}}>
            <div className="input-group" style={{marginBottom:0}}>
              <label className="input-label">Book Package</label>
              <select className="select" value={selectedPkg} onChange={e=>setSelectedPkg(e.target.value)}>
                <option value="">Select a book</option>
                {pkgs.map(p=><option key={p.id} value={p.id}>{p.book_title} ({p.total_principles||0} principles)</option>)}
              </select>
            </div>
            <div className="input-group" style={{marginBottom:0}}>
              <label className="input-label">Questions and Difficulty</label>
              <div style={{display:"flex",gap:8}}>
                <select className="select" value={numQ} onChange={e=>setNumQ(Number(e.target.value))}>
                  <option value={3}>3 Quick</option>
                  <option value={5}>5 Standard</option>
                  <option value={8}>8 Thorough</option>
                  <option value={10}>10 Full test</option>
                </select>
                <select className="select" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"flex-end"}}>
              <button className="btn btn-primary btn-lg" onClick={generateQuiz} disabled={loading||!selectedPkg} style={{width:"100%",justifyContent:"center"}}>
                {loading ? <><span className="spinner"/> Generating</> : <>Generate Quiz</>}
              </button>
            </div>
          </div>
          {loading && (
            <div style={{marginTop:14,padding:"12px 14px",background:"var(--gold-bg)",border:"1px solid var(--gold-border)",borderRadius:8,fontSize:13,color:"var(--ink-3)",display:"flex",alignItems:"center",gap:10}}>
              <span className="spinner"/> AI is generating questions. This takes 15 to 30 seconds. Please wait.
            </div>
          )}
          {errorMsg && (
            <div style={{marginTop:14,padding:"12px 14px",background:"var(--crimson-bg)",border:"1px solid var(--crimson)",borderRadius:8,fontSize:13,color:"var(--crimson)"}}>
              {errorMsg}
            </div>
          )}
        </div>

        {pkgs.length === 0 && (
          <div className="empty-state fade-up">
            <span className="empty-icon">📚</span>
            <h3>No books yet</h3>
            <p>Analyze a book first then come back to take a quiz.</p>
            <a href="/" className="btn btn-primary" style={{marginTop:16,display:"inline-flex"}}>Analyze a Book</a>
          </div>
        )}

        {submitted && (
          <div className="fade-up" style={{background:pct>=70?"var(--teal-bg)":pct>=50?"var(--gold-bg)":"var(--crimson-bg)",border:"1px solid "+(pct>=70?"var(--teal)":pct>=50?"var(--gold)":"var(--crimson)"),borderRadius:"var(--radius-md)",padding:"20px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:20}}>
            <div style={{fontFamily:"var(--font-serif)",fontSize:52,lineHeight:1}}>
              {pct===100?"🏆":pct>=70?"🎯":pct>=50?"📚":"💪"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--font-serif)",fontSize:26,marginBottom:4}}>{score} / {questions.length} correct — {pct}%</div>
              <div style={{fontSize:13,color:"var(--ink-3)"}}>
                {pct===100?"Perfect! You mastered this material.":pct>=80?"Excellent work!":pct>=60?"Good effort. Review the ones you missed.":"Keep studying. Try flashcards to reinforce concepts."}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-sm" onClick={reset}>New Quiz</button>
              <a href="/flashcards" className="btn btn-sm btn-primary">Flashcards</a>
            </div>
          </div>
        )}

        {questions.map((q, qi) => {
          const isCorrect = submitted && answers[qi] === q.correct_index
          const isWrong = submitted && answers[qi] !== undefined && answers[qi] !== q.correct_index
          return (
            <div key={qi} className="card fade-up" style={{marginBottom:14,border:submitted?(isCorrect?"1.5px solid var(--teal)":isWrong?"1.5px solid var(--crimson)":"1px solid var(--paper-3)"):"1px solid var(--paper-3)"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:14}}>
                <div style={{width:30,height:30,flexShrink:0,background:submitted?(isCorrect?"var(--teal)":isWrong?"var(--crimson)":"var(--ink)"):"var(--ink)",color:submitted?((isCorrect||isWrong)?"#fff":"var(--gold-2)"):"var(--gold-2)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-mono)",fontSize:13,fontWeight:700}}>
                  {submitted?(isCorrect?"✓":isWrong?"✗":qi+1):qi+1}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,lineHeight:1.55,marginBottom:5}}>{q.question}</div>
                  {q.principle_name && <span className="tag tag-gold" style={{fontSize:9}}>{q.principle_name}</span>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,paddingLeft:42}}>
                {(q.options||[]).map((opt, oi) => {
                  let cls = "quiz-option"
                  if (!submitted && answers[qi]===oi) cls += " selected"
                  if (submitted && oi===q.correct_index) cls += " correct"
                  if (submitted && answers[qi]===oi && oi!==q.correct_index) cls += " wrong"
                  return (
                    <button key={oi} className={cls} onClick={()=>!submitted&&setAnswers(a=>({...a,[qi]:oi}))} disabled={submitted}>
                      <span style={{fontFamily:"var(--font-mono)",fontSize:11,fontWeight:700,marginRight:10,opacity:.55}}>{String.fromCharCode(65+oi)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && q.explanation && (
                <div style={{marginTop:14,paddingLeft:42,paddingTop:12,borderTop:"1px solid var(--paper-3)"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--blue)",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Explanation</div>
                  <div style={{fontSize:12,color:"var(--ink-3)",lineHeight:1.7}}>{q.explanation}</div>
                </div>
              )}
            </div>
          )
        })}

        {questions.length > 0 && !submitted && (
          <div style={{textAlign:"center",padding:"12px 0 24px"}}>
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={answeredCount<questions.length}>
              {answeredCount<questions.length ? "Answer all questions ("+answeredCount+"/"+questions.length+")" : "Submit Quiz"}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
