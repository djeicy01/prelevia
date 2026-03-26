import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: '#F5F7F6' }}>
      <Sidebar />
      <main className="flex-1 ml-[255px] flex flex-col min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
