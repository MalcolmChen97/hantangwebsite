import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

type ToastInput = string | { title: string; variant?: string }

interface ToastContextType {
  toast: (input: ToastInput, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((input: ToastInput, type?: ToastType) => {
    let message: string
    let resolvedType: ToastType = type ?? 'info'

    if (typeof input === 'string') {
      message = input
    } else {
      message = input.title
      if (input.variant === 'destructive') resolvedType = 'error'
    }

    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type: resolvedType }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-destructive/30 text-destructive',
    info: 'bg-primary/5 border-primary/20 text-primary',
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" style={{ top: 'calc(var(--safe-area-top, 0px) + 1rem)' }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={cn('flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg', colors[t.type])}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium flex-1">{t.message}</span>
                <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
