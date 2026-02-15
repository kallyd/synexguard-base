import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Shield,
  Server,
  Ban,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Cpu,
  HardDrive,
  MemoryStick,
  Globe,
  Clock,
  Loader2,
  RefreshCw,
  Download,
  Bell,
  BellOff,
  Zap,
} from 'lucide-react'
import { api } from '../api'
import { useNotifications } from '../hooks/useNotifications'
import { useDataExport } from '../hooks/useDataExport'
import { DashboardSkeleton, StatCardSkeleton } from '../components/Skeletons'

interface DashboardStats {
  ataques_detectados: number
  ips_banidos: number
  servidores_online: number
  servidores_total: number
  alertas_ativos: number
  cpu_medio: number
  ram_medio: number
  disco_medio: number
}

interface LogEntry {
  id: number
  hostname: string
  tipo: string
  severidade: string
  mensagem: string
  origem_ip: string | null
  criado_em: string
}

interface BannedEntry {
  id: number
  ip: string
  motivo: string
  origem: string
  ativo: boolean
  criado_em: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [banned, setBanned] = useState<BannedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastCriticalCount, setLastCriticalCount] = useState(0)

  const { showCriticalAlert, showInfoAlert, hasPermission } = useNotifications()
  const { exportEvents } = useDataExport()
  const prevLogsRef = useRef<LogEntry[]>([])

  const load = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)

    try {
      const [statsData, eventsData, bannedData] = await Promise.all([
        api.serverStats(),
        api.listEvents(10),
        api.listBannedIps(),
      ])

      // Check for new critical events
      if (notificationsEnabled && prevLogsRef.current.length > 0) {
        const newCriticalEvents = eventsData.items.filter(
          (event: LogEntry) =>
            event.severidade === 'critical' &&
            !prevLogsRef.current.some(prev => prev.id === event.id)
        )

        newCriticalEvents.forEach((event: LogEntry) => {
          showCriticalAlert(event.hostname, event.mensagem)
        })
      }

      prevLogsRef.current = eventsData.items
      setStats(statsData)
      setLogs(eventsData.items)
      setBanned(bannedData.items.filter((b: BannedEntry) => b.ativo).slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      if (notificationsEnabled) {
        showInfoAlert('Erro de Conexão', 'Falha ao carregar dados do dashboard')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [notificationsEnabled, showCriticalAlert, showInfoAlert])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(() => load(), 10000)
    return () => clearInterval(id)
  }, [load])

  // Enable notifications if permission is granted
  useEffect(() => {
    setNotificationsEnabled(hasPermission)
  }, [hasPermission])

  const exportToCsv = () => {
    exportEvents(logs)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  const statCards = [
    { title: 'Ataques Detectados', value: stats?.ataques_detectados ?? 0, icon: Shield, color: 'text-ng-danger', bg: 'bg-ng-danger/10' },
    { title: 'IPs Banidos', value: stats?.ips_banidos ?? 0, icon: Ban, color: 'text-ng-warn', bg: 'bg-ng-warn/10' },
    { title: 'Servidores Online', value: `${stats?.servidores_online ?? 0}/${stats?.servidores_total ?? 0}`, icon: Server, color: 'text-ng-success', bg: 'bg-ng-success/10' },
    { title: 'Alertas Ativos', value: stats?.alertas_ativos ?? 0, icon: AlertTriangle, color: 'text-ng-neon', bg: 'bg-ng-neon/10' },
  ]

  const levelColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-ng-danger'
      case 'warning': return 'text-ng-warn'
      default: return 'text-slate-400'
    }
  }

  const levelBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-ng-danger/10 text-ng-danger'
      case 'warning': return 'bg-ng-warn/10 text-ng-warn'
      default: return 'bg-white/5 text-slate-400'
    }
  }

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } catch { return iso }
  }

  return (
    <div className="space-y-6">
      {/* Header with notifications toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-ng-neon" />
            Dashboard
          </h1>
          {hasPermission && (
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                notificationsEnabled
                  ? 'bg-ng-neon/20 text-ng-neon'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              title={notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'}
            >
              {notificationsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {notificationsEnabled ? 'Notificações ON' : 'Notificações OFF'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm transition-all disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>
      {/* Stats with animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, index) => (
          <div
            key={s.title}
            className="card group hover:border-ng-neon/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-ng-neon/10"
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">{s.title}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color} transition-all duration-300 group-hover:scale-110`}>
                  {s.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Logs with improved design */}
        <div className="card xl:col-span-2 min-h-[380px] hover:border-ng-neon/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-ng-neon" />
              Logs em Tempo Real
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-ng-success bg-ng-success/10 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-ng-success rounded-full animate-pulse" />
                <span className="font-medium">Live</span>
              </span>
              <span className="text-xs text-slate-500">
                {logs.length} eventos
              </span>
            </div>
          </div>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Nenhum evento registrado ainda.</p>
              <p className="text-xs mt-1">Instale o agente em um servidor para começar.</p>
            </div>
          ) : (
            <div className="space-y-1 font-mono text-xs max-h-80 overflow-y-auto"
                 style={{
                   scrollbarWidth: 'thin',
                   scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                 }}
            >
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className="flex gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors duration-200 border-l-2 border-transparent hover:border-ng-neon/30"
                  style={{
                    animation: `slideInLeft 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  <span className="text-slate-500 flex-shrink-0 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">{formatTime(log.criado_em)}</span>
                  </span>
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold flex-shrink-0 ${levelBadge(log.severidade)}`}>
                    {log.severidade}
                  </span>
                  <span className="text-ng-neon flex-shrink-0 font-medium">[{log.hostname}]</span>
                  <span className="text-slate-300 truncate flex-1">{log.mensagem}</span>
                  {log.origem_ip && (
                    <span className="text-slate-500 flex-shrink-0 font-mono text-[10px] bg-white/5 px-2 py-1 rounded">
                      {log.origem_ip}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Banned IPs with improved design */}
        <div className="card min-h-[380px] hover:border-ng-danger/20 transition-all duration-300">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-ng-danger" />
            IPs Banidos
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
              {banned.length}
            </span>
          </h3>
          {banned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-ng-success/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-ng-success" />
              </div>
              <p className="text-sm font-medium">Nenhum IP banido.</p>
              <p className="text-xs text-ng-success mt-1">Sistema seguro! 🛡️</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banned.map((b, i) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg bg-white/3 hover:bg-white/8 transition-all duration-200 border-l-2 border-ng-danger/30 hover:border-ng-danger/60"
                  style={{
                    animation: `slideInRight 0.3s ease-out ${i * 0.1}s both`
                  }}
                >
                  <span className="text-ng-danger text-xs font-bold w-6 text-center bg-ng-danger/10 rounded-full py-1">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-mono bg-black/30 px-2 py-1 rounded">{b.ip}</span>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        b.origem === 'Automático'
                          ? 'bg-ng-neon/10 text-ng-neon'
                          : 'bg-ng-warn/10 text-ng-warn'
                      }`}>
                        {b.origem}
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs">{b.motivo}</span>
                  </div>
                  <Ban className="w-4 h-4 text-ng-danger flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System overview with improved animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'CPU Médio', value: stats?.cpu_medio ?? 0, icon: Cpu, color: 'ng-neon', gradient: 'from-ng-neon/20 to-ng-neon/5' },
          { label: 'RAM Médio', value: stats?.ram_medio ?? 0, icon: MemoryStick, color: 'ng-warn', gradient: 'from-ng-warn/20 to-ng-warn/5' },
          { label: 'Disco Médio', value: stats?.disco_medio ?? 0, icon: HardDrive, color: 'ng-success', gradient: 'from-ng-success/20 to-ng-success/5' }
        ].map((metric, index) => (
          <div
            key={metric.label}
            className="card group hover:border-opacity-50 transition-all duration-300 hover:scale-[1.02]"
            style={{
              animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
              borderColor: `var(--ng-${metric.color.split('-')[1]})`
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}`} />
              </div>
              <div>
                <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">{metric.label}</span>
                <div className={`text-3xl font-bold text-${metric.color} transition-all duration-300 group-hover:scale-110`}>
                  {metric.value}%
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="h-3 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-${metric.color} to-${metric.color}/60 rounded-full transition-all duration-1000 ease-out`}
                  style={{
                    width: `${Math.min(metric.value, 100)}%`,
                    animationDelay: `${index * 0.3}s`
                  }}
                />
              </div>
              <span className="absolute top-0 right-0 text-xs text-slate-500 -mt-5">
                {metric.value > 80 ? '⚠️' : metric.value > 60 ? '⚡' : '✅'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
