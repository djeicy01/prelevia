interface Props {
  icon:    string
  label:   string
  value:   string | number
  sub?:    string
  color?:  string
}

export default function StatCard({ icon, label, value, sub, color = '#0A6E5C' }: Props) {
  return (
    <div className="bg-white rounded-[13px] p-[18px] border relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
         style={{ borderColor: '#D4E5E1' }}>
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] mb-2.5"
           style={{ background: `${color}18` }}>
        {icon}
      </div>
      <div className="text-[24px] font-extrabold leading-none" style={{ color: '#1A2B26' }}>
        {value}
      </div>
      <div className="text-[11px] mt-1 font-medium" style={{ color: '#5C7A74' }}>{label}</div>
      {sub && <div className="text-[10px] mt-1.5 font-semibold" style={{ color: '#5C7A74' }}>{sub}</div>}
    </div>
  )
}
