import { useState, useEffect } from 'react'
import { Key, Plus, Copy, Check, Trash2, Terminal, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '../api'

interface Token {
  id: number
  nome: string
  descricao: string | null
  token: string
  install_command: string
  ultimo_uso: string | null
  ativo: boolean
  criado_em: string
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copiedCmd, setCopiedCmd] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [newToken, setNewToken] = useState<Token | null>(null)

  const load = async () => {
    try {
      const data = await api.listTokens()
      setTokens(data)
    } catch {
      // demo mode
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const t = await api.createToken(nome, descricao || undefined)
      setNewToken(t)
      setTokens((prev) => [t, ...prev])
      setShowCreate(false)
      setNome('')
      setDescricao('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: number) => {
    if (!confirm('Tem certeza que deseja revogar este token?')) return
    try {
      await api.revokeToken(id)
      setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, ativo: false } : t)))
    } catch {}
  }

  const copyText = (text: string, id: number, type: 'token' | 'cmd') => {
    navigator.clipboard.writeText(text)
    if (type === 'token') {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      setCopiedCmd(id)
      setTimeout(() => setCopiedCmd(null), 2000)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-ng-neon" />
            Tokens de Agente
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie tokens para conectar seus servidores ao NodeGuard. Cada token isola os dados do seu ambiente.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-ng-neon hover:bg-ng-neon/90 text-ng-bg font-semibold px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all shadow-lg shadow-ng-neon/20"
        >
          <Plus className="w-4 h-4" />
          Novo Token
        </button>
      </div>

      {/* How it works */}
      <div className="card bg-ng-neon/5 border-ng-neon/20">
        <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-ng-neon" />
          Como funciona?
        </h3>
        <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
          <li>Crie um token com um nome descritivo (ex: "Produção", "Staging")</li>
          <li>Copie o comando de instalação gerado</li>
          <li>Cole e execute o comando na VPS que deseja monitorar</li>
          <li>O agente será instalado e configurado automaticamente</li>
        </ol>
      </div>

      {/* Newly created token */}
      {newToken && (
        <div className="card border-ng-success/30 bg-ng-success/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-ng-success font-medium flex items-center gap-2">
                <Check className="w-4 h-4" />
                Token criado com sucesso!
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Copie o token agora. Por segurança, ele não será exibido novamente na íntegra.
              </p>
            </div>
            <button onClick={() => setNewToken(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
          </div>
          <div className="mt-3 bg-ng-bg/60 rounded-lg p-3 font-mono text-sm text-ng-neon flex items-center justify-between">
            <span className="truncate">{newToken.token}</span>
            <button
              onClick={() => copyText(newToken.token, -1, 'token')}
              className="ml-3 text-slate-400 hover:text-white flex-shrink-0"
            >
              {copiedId === -1 ? <Check className="w-4 h-4 text-ng-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-400 mb-1">Comando de instalação:</p>
            <div className="bg-ng-bg/60 rounded-lg p-3 font-mono text-xs text-slate-300 flex items-center justify-between">
              <span className="truncate">{newToken.install_command}</span>
              <button
                onClick={() => copyText(newToken.install_command, -1, 'cmd')}
                className="ml-3 text-slate-400 hover:text-white flex-shrink-0"
              >
                {copiedCmd === -1 ? <Check className="w-4 h-4 text-ng-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-ng-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-4">Criar Token de Agente</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Nome</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full bg-ng-bg/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-ng-neon/50 transition-all"
                  placeholder="Ex: Produção, Staging, Dev"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Descrição (opcional)</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-ng-bg/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-ng-neon/50 transition-all resize-none h-20"
                  placeholder="Descreva o uso deste token"
                />
              </div>
              {error && (
                <div className="bg-ng-danger/10 border border-ng-danger/20 rounded-lg px-4 py-2 text-ng-danger text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-ng-neon hover:bg-ng-neon/90 text-ng-bg font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Token list */}
      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-ng-neon animate-spin" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="card text-center py-12">
          <Key className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum token criado ainda.</p>
          <p className="text-slate-500 text-sm mt-1">Crie seu primeiro token para começar a monitorar servidores.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => (
            <div
              key={t.id}
              className={`card transition-all ${!t.ativo ? 'opacity-50' : 'hover:border-ng-neon/30'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{t.nome}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      t.ativo ? 'bg-ng-success/10 text-ng-success' : 'bg-ng-danger/10 text-ng-danger'
                    }`}>
                      {t.ativo ? 'Ativo' : 'Revogado'}
                    </span>
                  </div>
                  {t.descricao && <p className="text-slate-400 text-sm mt-0.5">{t.descricao}</p>}
                </div>
                {t.ativo && (
                  <button
                    onClick={() => handleRevoke(t.id)}
                    className="text-slate-400 hover:text-ng-danger p-1 rounded transition-colors"
                    title="Revogar token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <Clock className="w-3 h-3" />
                Criado em {new Date(t.criado_em).toLocaleDateString('pt-BR')}
                {t.ultimo_uso && (
                  <span className="ml-2">· Último uso: {new Date(t.ultimo_uso).toLocaleDateString('pt-BR')}</span>
                )}
              </div>

              {/* Token value */}
              <div className="bg-ng-bg/60 rounded-lg p-2.5 font-mono text-sm text-slate-300 flex items-center justify-between mb-2">
                <span>{t.token.substring(0, 16)}{'•'.repeat(20)}</span>
                <button
                  onClick={() => copyText(t.token, t.id, 'token')}
                  className="ml-3 text-slate-400 hover:text-white flex-shrink-0"
                >
                  {copiedId === t.id ? <Check className="w-4 h-4 text-ng-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Install command */}
              {t.ativo && (
                <div className="bg-ng-bg/60 rounded-lg p-2.5 font-mono text-xs text-slate-400 flex items-center justify-between">
                  <span className="truncate">
                    <span className="text-ng-neon">$</span> {t.install_command}
                  </span>
                  <button
                    onClick={() => copyText(t.install_command, t.id, 'cmd')}
                    className="ml-3 text-slate-400 hover:text-white flex-shrink-0"
                  >
                    {copiedCmd === t.id ? <Check className="w-4 h-4 text-ng-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
