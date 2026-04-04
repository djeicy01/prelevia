import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface Props {
  children: ReactNode
  noNav?: boolean
}

export function AppLayout({ children, noNav }: Props) {
  return (
    <div className="min-h-screen bg-[#f0f5f4] flex flex-col max-w-lg mx-auto relative">
      <main className={`flex-1 ${noNav ? '' : 'pb-20'} page-enter`}>
        {children}
      </main>
      {!noNav && <BottomNav />}
    </div>
  )
}
