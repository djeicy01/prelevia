import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  left?: ReactNode
  right?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, left, right, className = '', ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#1A2B26]">{label}</label>
      )}
      <div className="relative flex items-center">
        {left && (
          <span className="absolute left-3 text-[#5C7A74]">{left}</span>
        )}
        <input
          ref={ref}
          className={`
            w-full border border-[#D4E5E1] rounded-xl bg-white px-4 py-3 text-[15px]
            text-[#1A2B26] placeholder-[#5C7A74]
            focus:outline-none focus:border-[#064D40] focus:ring-2 focus:ring-[#064D40]/15
            disabled:bg-gray-50 disabled:text-[#5C7A74]
            ${left ? 'pl-10' : ''}
            ${right ? 'pr-10' : ''}
            ${error ? 'border-[#E05C5C] focus:border-[#E05C5C] focus:ring-[#E05C5C]/15' : ''}
            ${className}
          `}
          {...rest}
        />
        {right && (
          <span className="absolute right-3 text-[#5C7A74]">{right}</span>
        )}
      </div>
      {error && <p className="text-xs text-[#E05C5C] font-medium">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
