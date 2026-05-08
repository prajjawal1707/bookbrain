import { useApp } from '../lib/AppContext'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function Toast() {
  const {state} = useApp()
  if (!state.toast) return null
  const icons  = {success:CheckCircle, error:AlertCircle, info:Info}
  const colors = {success:'var(--teal)', error:'var(--crimson)', info:'var(--gold)'}
  const Icon   = icons[state.toast.type] || Info
  return (
    <div className="toast" style={{borderLeftColor:colors[state.toast.type]||'var(--gold)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Icon size={15} style={{color:colors[state.toast.type],flexShrink:0}}/>
        <span>{state.toast.message}</span>
      </div>
    </div>
  )
}
