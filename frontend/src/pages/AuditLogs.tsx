import { useState, useEffect } from 'react'
import { Eye, User, Calendar, Activity, Shield, AlertCircle } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'

interface AuditLog {
  id: number
  user_id: number
  username: string
  action: string
  resource: string
  ip_address: string
  timestamp: string
  details?: any
}

interface AuditSummary {
  actions: Record<string, number>
  users: Record<string, number>
  total: number
}

export default function AuditLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [logsResponse, summaryResponse] = await Promise.all([
        api.listAuditLogs(100),
        api.getAuditSummary()
      ])
      
      setLogs(logsResponse.items || [])
      setSummary(summaryResponse)
    } catch (err: any) {
      console.error('Error loading audit logs:', err)
      setError(err.message || 'Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <User className="w-4 h-4" />
    if (action.includes('create') || action.includes('add')) return <Activity className="w-4 h-4" />
    if (action.includes('delete') || action.includes('remove')) return <AlertCircle className="w-4 h-4" />
    if (action.includes('security') || action.includes('ban')) return <Shield className="w-4 h-4" />
    return <Eye className="w-4 h-4" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'text-blue-400'
    if (action.includes('create') || action.includes('add')) return 'text-green-400'
    if (action.includes('delete') || action.includes('remove')) return 'text-red-400'
    if (action.includes('security') || action.includes('ban')) return 'text-yellow-400'
    return 'text-slate-400'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Acesso Restrito</h3>
        <p className="text-slate-400">
          Apenas superadministradores podem visualizar logs de auditoria.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded-lg w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-lg" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Erro ao Carregar</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-ng-neon/10 hover:bg-ng-neon/20 text-ng-neon border border-ng-neon/20 rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Eye className="w-6 h-6 text-ng-neon" />
        <h1 className="text-2xl font-bold text-white">Logs de Auditoria</h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-ng-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total de Ações</p>
                <p className="text-white text-xl font-bold">{summary.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-ng-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Usuários Ativos</p>
                <p className="text-white text-xl font-bold">{Object.keys(summary.users).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-ng-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Ação Mais Comum</p>
                <p className="text-white text-sm font-medium">
                  {Object.entries(summary.actions).length > 0
                    ? Object.entries(summary.actions).sort(([,a], [,b]) => b - a)[0][0]
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-ng-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Período</p>
                <p className="text-white text-sm font-medium">Últimos 100</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-ng-card rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Logs Recentes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Nenhum log de auditoria encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={getActionColor(log.action)}>
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-white text-sm font-medium">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ng-neon/10 border border-ng-neon/20 flex items-center justify-center text-ng-neon text-xs font-bold">
                          {log.username?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <span className="text-white text-sm">
                          {log.username || `ID: ${log.user_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
                      {log.resource || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm font-mono">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                      {formatTimestamp(log.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}