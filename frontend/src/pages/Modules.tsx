import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  ShieldAlert, Ban, Activity, BarChart3, Zap, Bell, Search, ScrollText,
  Shield, AlertTriangle, Lock, Globe, Terminal, FileSearch, Clock,
  TrendingUp, ArrowUpRight, Network, Cpu, Eye, Loader2, RefreshCw,
  CheckCircle, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { api } from '../api'

/* ── Reusable shell ───────────────────────────────────────────────── */
function PageShell({ icon: Icon, title, description, children }: { icon: any; title: string; description: string; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon className="w-5 h-5 text-ng-neon" />
          {title}
        </h1>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon: Icon, text, sub }: { icon: any; text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Icon className="w-10 h-10 mb-3" />
      <p className="text-sm">{text}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  )
}

function Spinner() {
  return (
    <div className="card flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-ng-neon animate-spin" />
    </div>
  )
}

const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } catch { return iso }
}
const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('pt-BR') } catch { return iso }
}

/* ══════════════════════════════════════════════════════════════════════
   Security Page
   ══════════════════════════════════════════════════════════════════════ */
export function SecurityPage() {
  const [attempts, setAttempts] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, blocked: 0, suspicious: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.listLoginAttempts(50)
      setAttempts(data.items)
      setStats(data.stats)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <PageShell icon={ShieldAlert} title="Segurança" description="Monitoramento de tentativas de login e ameaças de segurança">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Lock className="w-4 h-4" /> Tentativas</div>
          <div className="text-3xl font-bold text-ng-danger mt-1">{stats.total}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Shield className="w-4 h-4" /> Bloqueadas</div>
          <div className="text-3xl font-bold text-ng-success mt-1">{stats.blocked}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-slate-400 text-sm"><AlertTriangle className="w-4 h-4" /> Sucesso Suspeito</div>
          <div className="text-3xl font-bold text-ng-warn mt-1">{stats.suspicious}</div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ng-neon" />
            Tentativas Recentes de Login
          </h3>
          {attempts.length === 0 ? (
            <EmptyState icon={ShieldAlert} text="Nenhuma tentativa de login registrada." sub="Instale o agente para começar a monitorar." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                    <th className="text-left py-2 px-3">Horário</th>
                    <th className="text-left py-2 px-3">Servidor</th>
                    <th className="text-left py-2 px-3">Usuário</th>
                    <th className="text-left py-2 px-3">IP Origem</th>
                    <th className="text-left py-2 px-3">Método</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a: any) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{fmtTime(a.criado_em)}</td>
                      <td className="py-2.5 px-3 text-ng-neon text-xs">{a.hostname}</td>
                      <td className="py-2.5 px-3 text-white">{a.user}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{a.origem_ip}</td>
                      <td className="py-2.5 px-3 text-slate-400">{a.method}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.success ? 'bg-ng-success/10 text-ng-success' : 'bg-ng-danger/10 text-ng-danger'}`}>
                          {a.success ? 'Sucesso' : 'Falha'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Banned IPs Page
   ══════════════════════════════════════════════════════════════════════ */
export function BannedIPsPage() {
  const [banned, setBanned] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.listBannedIps()
      setBanned(data.items)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUnban = async (ip: string) => {
    if (!confirm(`Desbloquear ${ip}?`)) return
    try {
      await api.unbanIp(ip)
      load()
    } catch { /* empty */ }
  }

  return (
    <PageShell icon={Ban} title="IPs Banidos" description="Gerenciamento de IPs bloqueados e listas de bloqueio">
      {loading ? <Spinner /> : (
        <div className="card">
          {banned.length === 0 ? (
            <EmptyState icon={Ban} text="Nenhum IP banido." sub="IPs são banidos automaticamente pelas regras de automação." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                    <th className="text-left py-2 px-3">IP</th>
                    <th className="text-left py-2 px-3">Servidor</th>
                    <th className="text-left py-2 px-3">Motivo</th>
                    <th className="text-left py-2 px-3">Origem</th>
                    <th className="text-left py-2 px-3">Banido em</th>
                    <th className="text-left py-2 px-3">Expira</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {banned.map((b: any) => (
                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono text-white">{b.ip}</td>
                      <td className="py-2.5 px-3 text-ng-neon text-xs">{b.hostname}</td>
                      <td className="py-2.5 px-3 text-slate-300">{b.motivo}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${b.origem === 'Automático' ? 'bg-ng-neon/10 text-ng-neon' : 'bg-ng-warn/10 text-ng-warn'}`}>
                          {b.origem}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{fmtDate(b.criado_em)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{b.expira}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.ativo ? 'bg-ng-danger/10 text-ng-danger' : 'bg-white/5 text-slate-500'}`}>
                          {b.ativo ? 'Bloqueado' : 'Expirado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {b.ativo && (
                          <button onClick={() => handleUnban(b.ip)} className="text-xs text-slate-400 hover:text-ng-success transition-colors">
                            Desbloquear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Traffic Page
   ══════════════════════════════════════════════════════════════════════ */
export function TrafficPage() {
  const [data, setData] = useState<{ items: any[]; total_in: number; total_out: number }>({ items: [], total_in: 0, total_out: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const result = await api.listTraffic()
      setData(result)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const fmtBytes = (b: number) => {
    if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB'
    if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB'
    if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB'
    return b + ' B'
  }

  return (
    <PageShell icon={Activity} title="Tráfego de Rede" description="Análise de tráfego e throughput das interfaces de rede">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <ArrowUpRight className="w-4 h-4 text-ng-success" /> Total Entrada
          </div>
          <div className="text-3xl font-bold text-ng-success">{fmtBytes(data.total_in)}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4 text-ng-neon" /> Total Saída
          </div>
          <div className="text-3xl font-bold text-ng-neon">{fmtBytes(data.total_out)}</div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-ng-neon" />
            Interfaces
          </h3>
          {data.items.length === 0 ? (
            <EmptyState icon={Network} text="Nenhum dado de tráfego." sub="O agente envia dados de interfaces via heartbeat." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                    <th className="text-left py-2 px-3">Servidor</th>
                    <th className="text-left py-2 px-3">Interface</th>
                    <th className="text-left py-2 px-3">Bytes In</th>
                    <th className="text-left py-2 px-3">Bytes Out</th>
                    <th className="text-left py-2 px-3">Pacotes In</th>
                    <th className="text-left py-2 px-3">Pacotes Out</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((iface: any, i: number) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2.5 px-3 text-ng-neon text-xs">{iface.hostname}</td>
                      <td className="py-2.5 px-3 font-mono text-white">{iface.interface}</td>
                      <td className="py-2.5 px-3 text-ng-success">{fmtBytes(iface.bytes_in)}</td>
                      <td className="py-2.5 px-3 text-ng-neon">{fmtBytes(iface.bytes_out)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{iface.packets_in?.toLocaleString() ?? 0}</td>
                      <td className="py-2.5 px-3 text-slate-400">{iface.packets_out?.toLocaleString() ?? 0}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-ng-success bg-ng-success/10 px-2 py-0.5 rounded-full">{iface.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Metrics Page
   ══════════════════════════════════════════════════════════════════════ */
export function MetricsPage() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.listMetrics()
      setMetrics(data.items)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { const id = setInterval(load, 10000); return () => clearInterval(id) }, [load])

  return (
    <PageShell icon={BarChart3} title="Métricas" description="Métricas de performance e recursos dos servidores">
      {loading ? <Spinner /> : metrics.length === 0 ? (
        <div className="card"><EmptyState icon={BarChart3} text="Nenhum servidor com métricas." sub="Métricas aparecem quando agentes enviam heartbeats." /></div>
      ) : (
        <div className="space-y-4">
          {metrics.map((s: any) => (
            <div key={s.servidor_id} className="card hover:border-ng-neon/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">{s.hostname}</h3>
                <span className="text-xs text-slate-500">{s.conns} conexões · {s.open_ports} portas</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'CPU', value: s.cpu, color: s.cpu > 80 ? 'bg-ng-danger' : s.cpu > 60 ? 'bg-ng-warn' : 'bg-ng-neon' },
                  { label: 'RAM', value: s.ram, color: s.ram > 80 ? 'bg-ng-danger' : s.ram > 60 ? 'bg-ng-warn' : 'bg-ng-neon' },
                  { label: 'Disco', value: s.disk, color: s.disk > 80 ? 'bg-ng-danger' : s.disk > 60 ? 'bg-ng-warn' : 'bg-ng-neon' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>{m.label}</span>
                      <span className="text-white font-medium">{m.value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${m.color}`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Automations Page
   ══════════════════════════════════════════════════════════════════════ */
export function AutomationsPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.listAutomations()
      setRules(data.items)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id: number) => {
    try {
      await api.toggleAutomation(id)
      load()
    } catch { /* empty */ }
  }

  return (
    <PageShell icon={Zap} title="Automações" description="Regras automáticas de resposta a incidentes">
      {loading ? <Spinner /> : rules.length === 0 ? (
        <div className="card"><EmptyState icon={Zap} text="Nenhuma regra de automação." /></div>
      ) : (
        <div className="space-y-3">
          {rules.map((r: any) => (
            <div key={r.id} className={`card hover:border-ng-neon/30 transition-all ${!r.ativo ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-ng-warn" />
                    {r.nome}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-slate-400"><span className="text-slate-500">Se:</span> <span className="text-white">{r.condicao}</span></p>
                    <p className="text-slate-400"><span className="text-slate-500">Então:</span> <span className="text-ng-neon">{r.acao}</span></p>
                  </div>
                </div>
                <button onClick={() => handleToggle(r.id)} className="flex items-center gap-1">
                  {r.ativo ? (
                    <ToggleRight className="w-6 h-6 text-ng-success" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Alerts Page
   ══════════════════════════════════════════════════════════════════════ */
export function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.listAlerts()
      setAlerts(data.items)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleResolve = async (id: number) => {
    try {
      await api.resolveAlert(id)
      load()
    } catch { /* empty */ }
  }

  const sevBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-ng-danger/10 text-ng-danger'
      case 'warning': return 'bg-ng-warn/10 text-ng-warn'
      default: return 'bg-ng-neon/10 text-ng-neon'
    }
  }

  const timeAgo = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime()
      if (diff < 60000) return 'agora'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
      return `${Math.floor(diff / 86400000)}d atrás`
    } catch { return iso }
  }

  return (
    <PageShell icon={Bell} title="Alertas" description="Central de alertas e notificações de segurança">
      {loading ? <Spinner /> : alerts.length === 0 ? (
        <div className="card"><EmptyState icon={Bell} text="Nenhum alerta." sub="Alertas são gerados pelo motor de automações." /></div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a: any) => (
            <div key={a.id} className={`card hover:border-ng-neon/30 transition-all ${a.status === 'resolvido' ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    a.severidade === 'critical' ? 'bg-ng-danger animate-pulse' :
                    a.severidade === 'warning' ? 'bg-ng-warn' : 'bg-ng-neon'
                  }`} />
                  <div>
                    <h3 className="text-white font-medium">{a.titulo}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${sevBadge(a.severidade)}`}>{a.severidade}</span>
                      <span className="text-slate-500">{a.hostname}</span>
                      <span className="text-slate-500">· {timeAgo(a.criado_em)}</span>
                    </div>
                    {a.mensagem && <p className="text-slate-400 text-xs mt-1">{a.mensagem}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === 'ativo' && (
                    <button onClick={() => handleResolve(a.id)} className="text-xs text-ng-success hover:text-ng-success/80 flex items-center gap-1 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolver
                    </button>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status === 'ativo' ? 'bg-ng-danger/10 text-ng-danger' : 'bg-ng-success/10 text-ng-success'
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Forensics Page
   ══════════════════════════════════════════════════════════════════════ */
export function ForensicsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await api.listEvents(100)
      const q = query.toLowerCase()
      const filtered = data.items.filter((e: any) =>
        (e.mensagem || '').toLowerCase().includes(q) ||
        (e.origem_ip || '').includes(q) ||
        (e.hostname || '').toLowerCase().includes(q) ||
        (e.tipo || '').toLowerCase().includes(q)
      )
      setResults(filtered)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }

  const sevColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-ng-danger'
      case 'warning': return 'bg-ng-warn'
      default: return 'bg-ng-success'
    }
  }

  return (
    <PageShell icon={Search} title="Forense" description="Investigação e análise aprofundada de incidentes de segurança">
      <div className="card">
        <h3 className="text-white font-medium flex items-center gap-2 mb-3">
          <FileSearch className="w-4 h-4 text-ng-neon" />
          Busca em Eventos
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch() }} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por IP, hostname, evento..."
              className="w-full bg-ng-bg/60 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-ng-neon/50"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-ng-neon hover:bg-ng-neon/90 text-ng-bg font-semibold px-4 py-2.5 rounded-lg text-sm transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </button>
        </form>

        {searched && (
          results.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum resultado para "{query}".</p>
          ) : (
            <div className="space-y-3 mt-4">
              <p className="text-slate-400 text-xs">{results.length} resultados encontrados</p>
              {results.map((ev: any) => (
                <div key={ev.id} className="flex gap-3 text-sm">
                  <div className={`w-1 ${sevColor(ev.severidade)} rounded-full flex-shrink-0`} />
                  <div>
                    <span className="text-white">{ev.mensagem}</span>
                    <p className="text-slate-500 text-xs">
                      {ev.origem_ip && `${ev.origem_ip} → `}{ev.hostname} · {fmtDate(ev.criado_em)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!searched && <p className="text-slate-500 text-sm">Busque por qualquer indicador nos eventos dos agentes.</p>}
      </div>
    </PageShell>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Logs Page
   ══════════════════════════════════════════════════════════════════════ */
export function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.listEvents(100)
      setLogs(data.items)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { const id = setInterval(load, 5000); return () => clearInterval(id) }, [load])

  const levelColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-ng-danger bg-ng-danger/10'
      case 'warning': return 'text-ng-warn bg-ng-warn/10'
      default: return 'text-slate-400 bg-white/5'
    }
  }

  const levelLabel = (sev: string) => {
    switch (sev) {
      case 'critical': return 'CRIT'
      case 'warning': return 'WARN'
      default: return 'INFO'
    }
  }

  return (
    <PageShell icon={ScrollText} title="Logs" description="Visualização centralizada de logs de todos os agentes">
      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-ng-neon" />
              <span className="text-white font-medium text-sm">Log Stream</span>
            </div>
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
            <EmptyState icon={ScrollText} text="Nenhum log registrado." sub="Logs são enviados automaticamente pelos agentes." />
          ) : (
            <div className="font-mono text-xs space-y-0.5 max-h-[500px] overflow-y-auto">
              {logs.map((l: any) => (
                <div key={l.id} className="flex gap-2 py-1.5 px-2 hover:bg-white/[0.02] rounded">
                  <span className="text-slate-600 flex-shrink-0">{fmtDate(l.criado_em)}</span>
                  <span className={`px-1.5 py-0 rounded text-[10px] font-bold flex-shrink-0 ${levelColor(l.severidade)}`}>{levelLabel(l.severidade)}</span>
                  <span className="text-ng-neon flex-shrink-0">[{l.hostname}]</span>
                  <span className="text-slate-300">{l.mensagem}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
