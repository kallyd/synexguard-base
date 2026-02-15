import { useState, useEffect, type ReactNode } from 'react'
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
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useAuth } from '../auth'
import { useTheme } from '../theme'
import { useSessionTimeout } from '../hooks/useSessionTimeout'
import { useKeyboardShortcuts, createCommonShortcuts } from '../hooks/useKeyboardShortcuts'
import { SessionTimeoutModal } from './SessionTimeoutModal'
import GlobalSearch from './GlobalSearch'
import NotificationPanel, { createNotification } from './NotificationPanel'

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
  { label: 'Logs Auditoria', icon: ScrollText, path: '/audit-logs' },
] as const

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { theme, resolved, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  // Add some demo notifications on mount
  useEffect(() => {
    const demoNotifications = [
      createNotification(
        'critical',
        'Servidor Crítico Offline',
        'O servidor de produção srv-prod-01 está offline há 5 minutos',
        [
          { label: 'Verificar', action: () => navigate('/servers'), primary: true },
          { label: 'Ignorar', action: () => {} }
        ]
      ),
      createNotification(
        'info',
        'Atualização Disponível',
        'Uma nova versão do SynexGuard está disponível (v2.1.0)',
        [
          { label: 'Ver Detalhes', action: () => navigate('/settings') }
        ]
      )
    ]
    setNotifications(demoNotifications)
  }, [])

  // Session timeout management
  const {
    showWarning,
    timeLeft,
    extendSession,
    updateLastActivity
  } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 25
  })

  const handleTimeoutLogout = () => {
    logout()
    navigate('/login')
  }

  // Keyboard shortcuts
  const shortcuts = createCommonShortcuts({
    openSearch: () => setSearchOpen(true),
    openSettings: () => navigate('/settings'),
    goToDashboard: () => navigate('/'),
    goToServers: () => navigate('/servers'),
    goToAlerts: () => navigate('/alerts'),
    toggleTheme: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
    logout: () => handleLogout()
  })

  useKeyboardShortcuts(shortcuts)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
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
            <img
              src="/synex.png"
              alt="Synex Logo"
              className="w-8 h-8 object-contain flex-shrink-0"
            />
            {!collapsed && <span className="text-white font-bold text-lg truncate">SynexGuard</span>}
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
              ].find((n) => 'path' in n && (n as any).path === location.pathname) as any)?.label || 'SynexGuard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar... (Ctrl+K)"
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-ng-neon/30 w-48 transition-all focus:w-64"
                onFocus={() => setSearchOpen(true)}
                readOnly
              />
            </div>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title={`Tema: ${theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'}`}
              >
                {resolved === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              {themeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-ng-card border rounded-lg shadow-xl py-1 min-w-[160px]" style={{ borderColor: 'var(--ng-border)' }}>
                    <button
                      onClick={() => { setTheme('system'); setThemeMenuOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${theme === 'system' ? 'text-ng-neon bg-ng-neon/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Monitor className="w-4 h-4" /> Sistema
                    </button>
                    <button
                      onClick={() => { setTheme('light'); setThemeMenuOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${theme === 'light' ? 'text-ng-neon bg-ng-neon/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Sun className="w-4 h-4" /> Claro
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); setThemeMenuOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${theme === 'dark' ? 'text-ng-neon bg-ng-neon/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Moon className="w-4 h-4" /> Escuro
                    </button>
                  </div>
                </>
              )}
            </div>

            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onRemove={handleRemoveNotification}
            />

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

      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={showWarning}
        timeLeft={timeLeft}
        onExtend={extendSession}
        onLogout={handleTimeoutLogout}
      />

      {/* Global Search Modal */}
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  )
}
