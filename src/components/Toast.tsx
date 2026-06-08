import { useEffect, useState } from 'react'
import { Check, X, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Entrée
    setTimeout(() => setVisible(true), 10)
    // Sortie
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const config = {
    success: { icon: Check, bg: 'bg-primary', text: 'text-primary-foreground' },
    error: { icon: AlertCircle, bg: 'bg-destructive', text: 'text-destructive-foreground' },
    info: { icon: Info, bg: 'bg-card border border-border', text: 'text-foreground' },
  }[toast.type]

  const Icon = config.icon

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 ${config.bg} ${config.text} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <Icon size={16} className="shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="shrink-0 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}