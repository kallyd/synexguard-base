import { useState } from 'react'
import { Settings, User, Lock, Bell, Shield, Save, Loader2, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth'
import { api } from '../api'

export default function SettingsPage() {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile')

  // Profile
  const [nome, setNome] = useState(user?.nome || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifCritical, setNotifCritical] = useState(true)
  const [notifWeekly, setNotifWeekly] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg('')
    try {
      const updated = await api.updateMe({ nome, email })
      setUser({ ...user!, nome: updated.nome, email: updated.email })
      setProfileMsg('Perfil atualizado com sucesso!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err: any) {
      setProfileMsg(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwMsg('')
    if (newPw !== confirmPw) {
      setPwError('As senhas não coincidem')
      return
    }
    if (newPw.length < 6) {
      setPwError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    setPwSaving(true)
    try {
      await api.changePassword(currentPw, newPw)
      setPwMsg('Senha alterada com sucesso!')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setTimeout(() => setPwMsg(''), 3000)
    } catch (err: any) {
      setPwError(err.message)
    } finally {
      setPwSaving(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'password' as const, label: 'Senha', icon: Lock },
    { id: 'notifications' as const, label: 'Notificações', icon: Bell },
  ]

  const initials = user?.nome
    ? user.nome.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()
    : '?'

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-ng-neon" />
          Configurações
        </h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie seu perfil y preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-ng-neon/10 text-ng-neon'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {tab === 'profile' && (
            <div className="card">
              <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-ng-neon" />
                Dados do Perfil
              </h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-ng-neon/10 border border-ng-neon/20 flex items-center justify-center text-ng-neon text-xl font-bold">
                  {initials}
                </div>
                <div>
                  <div className="text-white font-medium">{user?.nome}</div>
                  <div className="text-slate-400 text-sm">{user?.email}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-ng-neon" />
                    <span className="text-xs text-ng-neon uppercase font-bold">{user?.role}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Nome</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-ng-bg/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-ng-neon/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-ng-bg/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-ng-neon/50 transition-all"
                  />
                </div>

                {profileMsg && (
                  <div className="flex items-center gap-2 text-sm text-ng-success">
                    <Check className="w-4 h-4" />
                    {profileMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-ng-neon hover:bg-ng-neon/90 text-ng-bg font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all"
                >
                  {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </form>
            </div>
          )}

          {tab === 'password' && (
            <div className="card">
              <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Lock className="w-4 h-4 text-ng-neon" />
                Alterar Senha
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Senha Atual</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                    className="w-full bg-ng-bg/60 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-ng-neon/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Nova Senha</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-ng-bg/60 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-ng-neon/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                    className="w-full bg-ng-bg/60 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-ng-neon/50 transition-all"
                  />
                </div>

                {pwError && (
                  <div className="bg-ng-danger/10 border border-ng-danger/20 rounded-lg px-4 py-2.5 text-ng-danger text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {pwError}
                  </div>
                )}
                {pwMsg && (
                  <div className="flex items-center gap-2 text-sm text-ng-success">
                    <Check className="w-4 h-4" />
                    {pwMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwSaving}
                  className="bg-ng-neon hover:bg-ng-neon/90 text-ng-bg font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all"
                >
                  {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Alterar Senha
                </button>
              </form>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card">
              <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Bell className="w-4 h-4 text-ng-neon" />
                Preferências de Notificação
              </h2>
              <div className="space-y-4 max-w-md">
                <ToggleRow
                  label="Notificações por email"
                  description="Receba alertas diretamente no seu email"
                  checked={notifEmail}
                  onChange={setNotifEmail}
                />
                <ToggleRow
                  label="Alertas críticos imediatos"
                  description="Notificação instantânea para eventos de severidade crítica"
                  checked={notifCritical}
                  onChange={setNotifCritical}
                />
                <ToggleRow
                  label="Relatório semanal"
                  description="Resumo semanal de segurança e métricas por email"
                  checked={notifWeekly}
                  onChange={setNotifWeekly}
                />
                <div className="pt-4">
                  <button className="bg-ng-neon hover:bg-ng-neon/90 text-ng-bg font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all">
                    <Save className="w-4 h-4" />
                    Salvar Preferências
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <div>
        <div className="text-white text-sm font-medium">{label}</div>
        <div className="text-slate-500 text-xs mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-all relative ${checked ? 'bg-ng-neon' : 'bg-white/10'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-all absolute top-0.5 ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
