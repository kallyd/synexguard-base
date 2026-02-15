import { useState, useEffect, useCallback } from 'react'
import { Server, Wifi, WifiOff, Clock, Cpu, MemoryStick, Loader2, RefreshCw, HardDrive, Globe, Activity } from 'lucide-react'
import { api } from '../api'
import { ServerCardSkeleton } from '../components/Skeletons'

interface ServerData {
  id: number
  hostname: string
  ip_publico: string
  os_info: string
  cpu: number
  ram: number
  disk: number
  uptime: string
  conns: number
  status: string
  ultimo_heartbeat: string | null
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const data = await api.listServers()
      setServers(data.items)
    } catch (error) {
      console.error('Failed to load servers:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const id = setInterval(() => load(), 10000)
    return () => clearInterval(id)
  }, [load])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-ng-neon" />
            Servidores
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-ng-neon" />
            Servidores
          </h1>
          <span className="text-sm text-slate-400 bg-white/5 px-3 py-1 rounded-full">
            {servers.filter(s => s.status === 'online').length}/{servers.length} online
          </span>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-ng-neon animate-spin" />
        </div>
      ) : servers.length === 0 ? (
        <div className="card text-center py-16">
          <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-medium">Nenhum servidor conectado</p>
          <p className="text-slate-400 text-sm mt-1">
            Crie um token na página de Tokens e instale o agente em seus servidores para vê-los aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers.map((s) => (
            <div key={s.id} className={`card hover:border-ng-neon/30 transition-all cursor-pointer ${s.status === 'offline' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">{s.hostname}</h3>
                  <p className="text-slate-500 text-xs font-mono mt-0.5">{s.ip_publico}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  s.status === 'online'
                    ? 'bg-ng-success/10 text-ng-success'
                    : 'bg-ng-danger/10 text-ng-danger'
                }`}>
                  {s.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {s.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>OS: <span className="text-white">{s.os_info || 'N/A'}</span></span>
                  <span className="text-slate-500">{s.conns} conns</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Uptime: {s.uptime || 'N/A'}
                </div>
              </div>
              {s.status === 'online' && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Cpu className="w-3 h-3" /> CPU
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.cpu > 80 ? 'bg-ng-danger' : s.cpu > 60 ? 'bg-ng-warn' : 'bg-ng-neon'}`} style={{ width: `${s.cpu}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{s.cpu}%</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <MemoryStick className="w-3 h-3" /> RAM
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.ram > 80 ? 'bg-ng-danger' : s.ram > 60 ? 'bg-ng-warn' : 'bg-ng-neon'}`} style={{ width: `${s.ram}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{s.ram}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
