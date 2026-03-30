import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const SIDEBAR_W = 255

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: '#F5F7F6' }}>
      <Sidebar />
      <main
        className="flex flex-col min-h-screen w-full"
        style={{ marginLeft: SIDEBAR_W }}
      >
        <Outlet />
      </main>
    </div>
  )
}
