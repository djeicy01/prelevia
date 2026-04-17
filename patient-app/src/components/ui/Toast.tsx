import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let _addToast: ((msg: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'info') {
  _addToast?.(message, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  const add = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  useEffect(() => {
    _addToast = add
    return () => { _addToast = null }
  }, [add])

  const icons = {
    success: <CheckCircle size={18} className="text-[#2CB67D] shrink-0" />,
    error:   <XCircle    size={18} className="text-[#E05C5C] shrink-0" />,
    info:    <Info       size={18} className="text-[#3B82F6] shrink-0" />,
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92vw] max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 bg-white rounded-xl shadow-lg px-4 py-3 border border-[#D4E5E1] animate-[slideUp_0.2s_ease]"
        >
          {icons[t.type]}
          <span className="text-[14px] text-[#1A2B26] font-medium flex-1">{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-[#5C7A74] hover:text-[#1A2B26]"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
