import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Server,
  ShieldAlert,
  Ban,
  Activity,
  BarChart3,
  Zap,
  Bell,
  Search,
  ScrollText,
  Settings,
  Key,
  LogOut,
  ChevronLeft,
  User,
  Shield,
  Menu,
  Crown,
} from 'lucide-react'
import { useAuth } from '../auth'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Servidores', icon: Server, path: '/servers' },
  { label: 'Segurança', icon: ShieldAlert, path: '/security' },
  { label: 'IPs Banidos', icon: Ban, path: '/banned-ips' },
  { label: 'Tráfego', icon: Activity, path: '/traffic' },
  { label: 'Métricas', icon: BarChart3, path: '/metrics' },
  { label: 'Automações', icon: Zap, path: '/automations' },
  { label: 'Alertas', icon: Bell, path: '/alerts' },
  { label: 'Forense', icon: Search, path: '/forensics' },
  { label: 'Logs', icon: ScrollText, path: '/logs' },
  { type: 'divider' as const },
  { label: 'Tokens', icon: Key, path: '/tokens' },
  { label: 'Configurações', icon: Settings, path: '/settings' },
] as const

const adminNav = [
  { type: 'divider' as const },
  { label: 'Administração', icon: Crown, path: '/admin' },
] as const

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.nome
    ? user.nome
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-ng-bg flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-ng-card border-r border-white/5 transition-all duration-300
          ${collapsed ? 'w-[68px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-ng-neon/10 border border-ng-neon/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-ng-neon" />
            </div>
            {!collapsed && <span className="text-white font-bold text-lg truncate">NodeGuard</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-auto text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {[...nav, ...(user?.role === 'superadmin' ? adminNav : [])].map((item, i) => {
            if ('type' in item) {
              return <div key={i} className="my-3 border-t border-white/5" />
            }
            const navItem = item as { label: string; icon: typeof LayoutDashboard; path: string }
            const Icon = navItem.icon
            const active = location.pathname === navItem.path
            return (
              <button
                key={navItem.path}
                onClick={() => { navigate(navItem.path); setMobileOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-ng-neon/10 text-ng-neon shadow-sm shadow-ng-neon/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? navItem.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span className="truncate">{navItem.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User area */}
        <div className={`border-t border-white/5 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg bg-ng-danger/10 text-ng-danger flex items-center justify-center hover:bg-ng-danger/20 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ng-neon/10 border border-ng-neon/20 flex items-center justify-center text-ng-neon text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-medium truncate">{user?.nome}</div>
                <div className="text-slate-500 text-xs truncate">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-ng-danger p-1 rounded transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-ng-card/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-white font-semibold text-lg">
              {([
                ...nav,
                ...(user?.role === 'superadmin' ? adminNav : []),
              ].find((n) => 'path' in n && (n as any).path === location.pathname) as any)?.label || 'NodeGuard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar..."
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-ng-neon/30 w-48 transition-all focus:w-64"
              />
            </div>
            <button className="relative text-slate-400 hover:text-white transition-colors p-1">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-ng-danger rounded-full" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-lg bg-ng-neon/10 border border-ng-neon/20 flex items-center justify-center text-ng-neon text-xs font-bold hover:bg-ng-neon/20 transition-colors"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
