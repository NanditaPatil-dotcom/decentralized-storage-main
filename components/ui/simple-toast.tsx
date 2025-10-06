'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastContextType = {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast = { id, duration: 5000, ...newToast }
    
    setToasts(prev => [...prev.slice(-2), toast]) // Keep max 3 toasts
    
    // Auto dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <SimpleToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function SimpleToastContainer({ toasts, dismiss }: { toasts: Toast[], dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
            'animate-in slide-in-from-right-full',
            toast.variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-gray-200 bg-white text-gray-900'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold text-sm">{toast.title}</div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90 mt-1">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-2 rounded-md p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}