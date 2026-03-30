interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, actions }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b flex items-center justify-between px-7 h-[58px]"
            style={{ borderColor: '#D4E5E1' }}>
      <div className="flex items-center gap-2">
        <h1 className="text-[18px] font-bold" style={{ color: '#1A2B26' }}>{title}</h1>
        {subtitle && (
          <span className="text-[14px] font-normal" style={{ color: '#5C7A74' }}>
            {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
