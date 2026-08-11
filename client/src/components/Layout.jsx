import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/suppliers-inventory', label: 'موردو المخزون', icon: BoxIcon },
]

function BoxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5 12 3 3 7.5m18 0-9 4.5m9-4.5v9L12 21m0-9L3 7.5m9 9L3 16.5v-9m18 9v-9" />
    </svg>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800" dir="rtl">
      <aside className="no-print w-64 shrink-0 bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-lg font-extrabold tracking-tight">البضاعة الراكدة</h1>
          <p className="text-xs text-indigo-200/70 mt-1">إدارة أصناف الموردين</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                    : 'text-indigo-100/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/10 text-[11px] text-indigo-200/60">
          إصدار 1.0
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
