import { useState, useEffect } from 'react'
import {
  Crown, Users, Key, Server, Shield, Loader2, UserCheck, UserX,
  Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Clock,
  AlertTriangle, TrendingUp,
} from 'lucide-react'
import { api } from '../api'

interface AdminUser {
  id: number
  nome: string
  email: string
  role: string
  ativo: boolean
  criado_em: string
  total_tokens: number
  active_tokens: number
}

interface AdminServer {
  id: number
  hostname: string
  ip_publico: string
  os_info: string
  cpu: number
  ram: number
  disk: number
  uptime: string
  status: string
  ultimo_heartbeat: string | null
  criado_em: string | null
  owner_nome: string
  owner_email: string
  token_nome: string
}

interface AdminToken {
  id: number
  nome: string
  token: string
  ativo: boolean
  criado_em: string
  ultimo_uso: string | null
  owner_nome: string
  owner_email: string
}

interface Stats {
  total_users: number
  active_users: number
  inactive_users: number
  total_tokens: number
  active_tokens: number
}

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'users' | 'tokens' | 'servers'>('overview')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [tokens, setTokens] = useState<AdminToken[]>([])
  const [servers, setServers] = useState<AdminServer[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, u, t, srv] = await Promise.all([
        api.adminStats(), 
        api.adminListUsers(), 
        api.adminListAllTokens(),
        api.adminListAllServers()
      ])
      setStats(s)
      setUsers(u)
      setTokens(t)
      setServers(srv)
    } catch {
      // demo mode fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const toggleUser = async (id: number, ativo: boolean) => {
    try {
      await api.adminToggleUser(id, ativo)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ativo } : u)))
    } catch {}
  }

  const deleteUser = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Todos os tokens e dados dele serão removidos.`)) return
    try {
      await api.adminDeleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setTokens((prev) => prev.filter((t) => t.owner_email !== users.find((u) => u.id === id)?.email))
    } catch {}
  }

  const tabs = [
    { id: 'overview' as const, label: 'Visão Geral' },
    { id: 'users' as const, label: 'Clientes' },
    { id: 'tokens' as const, label: 'Todos os Tokens' },
    { id: 'servers' as const, label: 'Servidores' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          Painel de Administração
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gerencie todos os clientes, tokens e servidores da plataforma
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ng-bg/60 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-amber-400/10 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Overview ───────────────────────────────────────────── */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Total de Clientes" value={stats.total_users} color="text-ng-neon" />
                <StatCard icon={UserCheck} label="Ativos" value={stats.active_users} color="text-ng-success" />
                <StatCard icon={UserX} label="Inativos" value={stats.inactive_users} color="text-ng-danger" />
                <StatCard icon={Key} label="Tokens" value={stats.total_tokens} color="text-amber-400" />
                <StatCard icon={Shield} label="Tokens Ativos" value={stats.active_tokens} color="text-ng-success" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Users */}
                <div className="card">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Clientes Recentes
                  </h3>
                  {users.filter((u) => u.role !== 'superadmin').length === 0 ? (
                    <p className="text-slate-500 text-sm">Nenhum cliente cadastrado ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {users
                        .filter((u) => u.role !== 'superadmin')
                        .slice(0, 5)
                        .map((u) => (
                          <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-ng-neon/10 flex items-center justify-center text-ng-neon text-xs font-bold">
                                {u.nome.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-white text-sm font-medium">{u.nome}</div>
                                <div className="text-slate-500 text-xs">{u.email}</div>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              u.ativo ? 'bg-ng-success/10 text-ng-success' : 'bg-ng-danger/10 text-ng-danger'
                            }`}>
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Platform Info */}
                <div className="card">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Informações da Plataforma
                  </h3>
                  <div className="space-y-3 text-sm">
                    <InfoRow label="Versão" value="SynexGuard v1.0.0" />
                    <InfoRow label="Ambiente" value="Production" />
                    <InfoRow label="Acesso Admin" value="admin@synexguard.io" />
                    <InfoRow label="Tokens Ativos" value={`${stats.active_tokens} de ${stats.total_tokens}`} />
                    <InfoRow label="Uptime" value="99.9%" />
                  </div>
                  <div className="mt-4 p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Lembre-se de alterar a senha padrão do admin!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Users ──────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="card text-center py-12">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhum usuário cadastrado.</p>
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className={`card transition-all ${!u.ativo ? 'opacity-60' : 'hover:border-amber-400/20'}`}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          u.role === 'superadmin'
                            ? 'bg-amber-400/10 border border-amber-400/20 text-amber-400'
                            : 'bg-ng-neon/10 border border-ng-neon/20 text-ng-neon'
                        }`}>
                          {u.role === 'superadmin' ? <Crown className="w-4 h-4" /> : u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium flex items-center gap-2">
                            {u.nome}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              u.role === 'superadmin'
                                ? 'bg-amber-400/10 text-amber-400'
                                : u.role === 'admin'
                                ? 'bg-ng-neon/10 text-ng-neon'
                                : 'bg-white/5 text-slate-400'
                            }`}>
                              {u.role}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              u.ativo ? 'bg-ng-success/10 text-ng-success' : 'bg-ng-danger/10 text-ng-danger'
                            }`}>
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-xs mt-0.5">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-slate-400">{u.total_tokens} tokens · {u.active_tokens} ativos</div>
                          {u.criado_em && (
                            <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 justify-end">
                              <Clock className="w-3 h-3" />
                              {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        {expandedUser === u.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded actions */}
                    {expandedUser === u.id && u.role !== 'superadmin' && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleUser(u.id, !u.ativo) }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            u.ativo
                              ? 'bg-ng-warn/10 text-ng-warn hover:bg-ng-warn/20'
                              : 'bg-ng-success/10 text-ng-success hover:bg-ng-success/20'
                          }`}
                        >
                          {u.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteUser(u.id, u.nome) }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-ng-danger/10 text-ng-danger hover:bg-ng-danger/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── All Tokens ─────────────────────────────────────────── */}
          {tab === 'tokens' && (
            <div className="card overflow-hidden">
              {tokens.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhum token criado na plataforma.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                        <th className="text-left py-2.5 px-3">Token</th>
                        <th className="text-left py-2.5 px-3">Nome</th>
                        <th className="text-left py-2.5 px-3">Dono</th>
                        <th className="text-left py-2.5 px-3">Criado em</th>
                        <th className="text-left py-2.5 px-3">Último Uso</th>
                        <th className="text-left py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((t) => (
                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono text-slate-300 text-xs">
                            {t.token.substring(0, 16)}...
                          </td>
                          <td className="py-2.5 px-3 text-white">{t.nome}</td>
                          <td className="py-2.5 px-3">
                            <div className="text-white text-xs">{t.owner_nome}</div>
                            <div className="text-slate-500 text-[10px]">{t.owner_email}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-xs">
                            {t.criado_em ? new Date(t.criado_em).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-xs">
                            {t.ultimo_uso ? new Date(t.ultimo_uso).toLocaleDateString('pt-BR') : 'Nunca'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              t.ativo ? 'bg-ng-success/10 text-ng-success' : 'bg-ng-danger/10 text-ng-danger'
                            }`}>
                              {t.ativo ? 'Ativo' : 'Revogado'}
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

          {/* ── All Servers ─────────────────────────────────────────── */}
          {tab === 'servers' && (
            <div className="card overflow-hidden">
              {servers.length === 0 ? (
                <div className="text-center py-12">
                  <Server className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhum servidor conectado na plataforma.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                        <th className="text-left py-2.5 px-3">Servidor</th>
                        <th className="text-left py-2.5 px-3">IP</th>
                        <th className="text-left py-2.5 px-3">Sistema</th>
                        <th className="text-left py-2.5 px-3">Recursos</th>
                        <th className="text-left py-2.5 px-3">Owner</th>
                        <th className="text-left py-2.5 px-3">Status</th>
                        <th className="text-left py-2.5 px-3">Último Heartbeat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servers.map((s) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3">
                            <div className="text-white font-medium">{s.hostname}</div>
                            <div className="text-slate-500 text-xs">{s.token_nome}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-mono text-xs">
                            {s.ip_publico || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-xs">
                            {s.os_info || 'Desconhecido'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">CPU:</span>
                                <span className={`text-xs ${s.cpu > 80 ? 'text-ng-danger' : s.cpu > 60 ? 'text-ng-warn' : 'text-ng-success'}`}>
                                  {s.cpu.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">RAM:</span>
                                <span className={`text-xs ${s.ram > 80 ? 'text-ng-danger' : s.ram > 60 ? 'text-ng-warn' : 'text-ng-success'}`}>
                                  {s.ram.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-white text-xs">{s.owner_nome}</div>
                            <div className="text-slate-500 text-[10px]">{s.owner_email}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              s.status === 'online' ? 'bg-ng-success/10 text-ng-success' : 'bg-ng-danger/10 text-ng-danger'
                            }`}>
                              {s.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-xs">
                            {s.ultimo_heartbeat ? new Date(s.ultimo_heartbeat).toLocaleString('pt-BR') : 'Nunca'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}
      </div>
      <div className={`text-3xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  )
}
