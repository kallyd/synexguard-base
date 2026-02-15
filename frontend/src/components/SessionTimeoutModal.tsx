import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface SessionTimeoutModalProps {
  isOpen: boolean
  timeLeft: number | null
  onExtend: () => void
  onLogout: () => void
}

export const SessionTimeoutModal = ({
  isOpen,
  timeLeft,
  onExtend,
  onLogout,
}: SessionTimeoutModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onLogout} />
      <div className="relative bg-ng-card border border-ng-neon/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-ng-neon/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-ng-warn/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-ng-warn" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-2">
              Sessão expirará em breve
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Sua sessão expirará em{' '}
              <span className="text-ng-warn font-bold">
                {timeLeft} minuto{timeLeft !== 1 ? 's' : ''}
              </span>{' '}
              devido à inatividade. Deseja estender sua sessão?
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onExtend}
            className="flex-1 bg-ng-neon hover:bg-ng-neon/90 text-ng-bg font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Estender Sessão
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Fazer Logout
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ng-warn to-ng-danger transition-all duration-1000"
              style={{
                width: timeLeft ? `${Math.max(0, Math.min(100, (timeLeft / 5) * 100))}%` : '0%',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}