import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
const Ctx = createContext(null)
const STORAGE_KEY = 'bookbrain_student_data'
function loadFromStorage() {
  try { const s=localStorage.getItem(STORAGE_KEY); return s?JSON.parse(s):{} } catch{return {}}
}
const saved = loadFromStorage()
const init = {
  packages: saved.packages||[], activePackage:null, generatedPrompt:null, toast:null,
  studentName: saved.studentName||'',
  bookmarks: saved.bookmarks||[],
  studyNotes: saved.studyNotes||[],
  quizScores: saved.quizScores||[],
  studyStreak: saved.studyStreak||0,
  lastStudyDate: saved.lastStudyDate||null,
  totalPrinciplesStudied: saved.totalPrinciplesStudied||0,
  chatHistory: saved.chatHistory||[],
}
function reducer(state, action) {
  switch(action.type) {
    case 'SET_PACKAGES': return {...state,packages:action.payload}
    case 'ADD_PACKAGE':  return {...state,packages:[action.payload,...state.packages],activePackage:action.payload}
    case 'SET_ACTIVE':   return {...state,activePackage:action.payload}
    case 'SET_PROMPT':   return {...state,generatedPrompt:action.payload}
    case 'SHOW_TOAST':   return {...state,toast:action.payload}
    case 'CLEAR_TOAST':  return {...state,toast:null}
    case 'SET_STUDENT_NAME': return {...state,studentName:action.payload}
    case 'TOGGLE_BOOKMARK': {
      const key=`${action.payload.packageId}_${action.payload.principleId}`
      const exists=state.bookmarks.find(b=>`${b.packageId}_${b.principleId}`===key)
      return {...state,bookmarks:exists?state.bookmarks.filter(b=>`${b.packageId}_${b.principleId}`!==key):[...state.bookmarks,action.payload]}
    }
    case 'ADD_NOTE': return {...state,studyNotes:[{id:Date.now(),...action.payload,createdAt:new Date().toISOString()},...state.studyNotes]}
    case 'DELETE_NOTE': return {...state,studyNotes:state.studyNotes.filter(n=>n.id!==action.payload)}
    case 'ADD_QUIZ_SCORE': return {...state,quizScores:[action.payload,...state.quizScores].slice(0,50)}
    case 'ADD_CHAT_MSG': return {...state,chatHistory:[...state.chatHistory,action.payload].slice(-50)}
    case 'CLEAR_CHAT': return {...state,chatHistory:[]}
    case 'INCREMENT_STUDIED': return {...state,totalPrinciplesStudied:state.totalPrinciplesStudied+(action.payload||1)}
    case 'UPDATE_STREAK': {
      const today=new Date().toDateString()
      const last=state.lastStudyDate
      const streak=last===today?state.studyStreak:last===new Date(Date.now()-86400000).toDateString()?state.studyStreak+1:1
      return {...state,studyStreak:streak,lastStudyDate:today}
    }
    default: return state
  }
}
export function AppProvider({children}) {
  const [state,dispatch]=useReducer(reducer,init)
  useEffect(()=>{
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({
      packages:state.packages,studentName:state.studentName,bookmarks:state.bookmarks,
      studyNotes:state.studyNotes,quizScores:state.quizScores,studyStreak:state.studyStreak,
      lastStudyDate:state.lastStudyDate,totalPrinciplesStudied:state.totalPrinciplesStudied,
      chatHistory:state.chatHistory,
    }))}catch{}
  },[state.packages,state.studentName,state.bookmarks,state.studyNotes,state.quizScores,state.studyStreak,state.chatHistory,state.totalPrinciplesStudied])
  const showToast=useCallback((message,type='success')=>{
    dispatch({type:'SHOW_TOAST',payload:{message,type}})
    setTimeout(()=>dispatch({type:'CLEAR_TOAST'}),3500)
  },[])
  return <Ctx.Provider value={{state,dispatch,showToast}}>{children}</Ctx.Provider>
}
export const useApp=()=>useContext(Ctx)
