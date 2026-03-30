import { useEffect } from 'react'

interface Props {
  message: string
  icon?:   string
  onClose: () => void
}

export default function Toast({ message, icon = '✅', onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className="fixed bottom-5 right-5 z-[999] flex items-center gap-2.5 px-4 py-3 rounded-[11px] text-[13px] font-medium text-white shadow-2xl"
      style={{ background: '#1A2B26', animation: 'slideUp 0.3s ease' }}
    >
      <span>{icon}</span>
      {message}
    </div>
  )
}
