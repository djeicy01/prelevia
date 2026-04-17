import { type ReactNode, type ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#064D40] text-white shadow-sm hover:bg-[#0A6E5C]',
    accent:  'bg-[#F4A726] text-[#1A2B26] shadow-sm hover:bg-[#FFC94D]',
    outline: 'border-2 border-[#064D40] text-[#064D40] hover:bg-[#064D40]/5',
    ghost:   'text-[#064D40] hover:bg-[#064D40]/8',
    danger:  'bg-[#E05C5C] text-white hover:bg-red-600',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-3 text-[15px]',
    lg: 'px-6 py-4 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
