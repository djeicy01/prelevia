import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { type ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  back?: boolean | string | (() => void)
  right?: ReactNode
}

export function PageHeader({ title, subtitle, back, right }: Props) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof back === 'function') back()
    else if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <header className="flex items-center gap-3 px-4 py-4 bg-white border-b border-[#D4E5E1] safe-top">
      {back !== undefined && (
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-xl text-[#5C7A74] hover:bg-[#f0f5f4] hover:text-[#064D40] transition-colors"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-bold text-[#1A2B26] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[#5C7A74] mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}
