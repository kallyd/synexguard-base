import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { api } from '../api'

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

  const load = useCallback(async () => {
    try {
      const [statsData, eventsData, bannedData] = await Promise.all([
        api.serverStats(),
        api.listEvents(10),
        api.listBannedIps(),
      ])
      setStats(statsData)
      setLogs(eventsData.items)
      setBanned(bannedData.items.filter((b: BannedEntry) => b.ativo).slice(0, 5))
    } catch {
      // empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-ng-neon animate-spin" />
      </div>
    )
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.title} className="card group hover:border-ng-neon/30 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{s.title}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Logs */}
        <div className="card xl:col-span-2 min-h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-ng-neon" />
              Logs em Tempo Real
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={load} className="text-slate-400 hover:text-white p-1 rounded transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="flex items-center gap-1 text-xs text-ng-success">
                <span className="w-1.5 h-1.5 bg-ng-success rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Activity className="w-8 h-8 mb-2" />
              <p className="text-sm">Nenhum evento registrado ainda.</p>
              <p className="text-xs mt-1">Instale o agente em um servidor para começar.</p>
            </div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-slate-500 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(log.criado_em)}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold flex-shrink-0 ${levelBadge(log.severidade)}`}>
                    {log.severidade}
                  </span>
                  <span className="text-ng-neon flex-shrink-0">[{log.hostname}]</span>
                  <span className="text-slate-300 truncate">{log.mensagem}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Banned IPs */}
        <div className="card min-h-[380px]">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-ng-danger" />
            IPs Banidos
          </h3>
          {banned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Ban className="w-8 h-8 mb-2" />
              <p className="text-sm">Nenhum IP banido.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banned.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-500 text-xs w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-mono">{b.ip}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${b.origem === 'Automático' ? 'bg-ng-neon/10 text-ng-neon' : 'bg-ng-warn/10 text-ng-warn'}`}>
                        {b.origem}
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs">{b.motivo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-ng-neon" />
            <span className="text-white text-sm font-medium">CPU Médio</span>
          </div>
          <div className="text-3xl font-bold text-ng-neon">{stats?.cpu_medio ?? 0}%</div>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-ng-neon rounded-full transition-all" style={{ width: `${stats?.cpu_medio ?? 0}%` }} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <MemoryStick className="w-4 h-4 text-ng-warn" />
            <span className="text-white text-sm font-medium">RAM Médio</span>
          </div>
          <div className="text-3xl font-bold text-ng-warn">{stats?.ram_medio ?? 0}%</div>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-ng-warn rounded-full transition-all" style={{ width: `${stats?.ram_medio ?? 0}%` }} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-ng-success" />
            <span className="text-white text-sm font-medium">Disco Médio</span>
          </div>
          <div className="text-3xl font-bold text-ng-success">{stats?.disco_medio ?? 0}%</div>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-ng-success rounded-full transition-all" style={{ width: `${stats?.disco_medio ?? 0}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
