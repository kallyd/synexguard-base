import { Bell, BellRing, X, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: 'critical' | 'info' | 'warning' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: {
    label: string
    action: () => void
    primary?: boolean
  }[]
}

interface NotificationPanelProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onRemove: (id: string) => void
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [animatingNotifications, setAnimatingNotifications] = useState<Set<string>>(new Set())

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setAnimatingNotifications(prev => new Set([...prev, id]))
    setTimeout(() => {
      onMarkAsRead(id)
      setAnimatingNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 200)
  }

  const handleRemove = (id: string) => {
    setAnimatingNotifications(prev => new Set([...prev, id]))
    setTimeout(() => {
      onRemove(id)
      setAnimatingNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 200)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return '🚨'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      default:
        return 'ℹ️'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500 bg-red-500/5'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/5'
      case 'success':
        return 'border-l-green-500 bg-green-500/5'
      default:
        return 'border-l-blue-500 bg-blue-500/5'
    }
  }

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-slate-400 hover:text-white transition-colors p-1"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-ng-danger rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 max-h-96 bg-ng-card border rounded-lg shadow-xl overflow-hidden animate-fadeInUp max-w-[calc(100vw-2rem)] mx-2 sm:mx-0" style={{ borderColor: 'var(--ng-border)' }}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Notificações</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-ng-neon hover:text-ng-neon/80 transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-2 p-4 hover:bg-white/5 transition-all duration-200 ${
                      getNotificationColor(notification.type)
                    } ${
                      animatingNotifications.has(notification.id) ? 'opacity-50 scale-95' : ''
                    } ${
                      !notification.read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <h4 className="text-white text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-ng-neon rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-300 text-xs mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {notification.timestamp.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-slate-400 hover:text-green-400 transition-colors p-1"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(notification.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1"
                          title="Remover"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              action.action()
                              if (action.primary) {
                                handleMarkAsRead(notification.id)
                              }
                            }}
                            className={`text-xs px-3 py-1 rounded transition-colors ${
                              action.primary
                                ? 'bg-ng-neon/20 text-ng-neon hover:bg-ng-neon/30'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Hook for managing notifications
export function createNotification(
  type: 'critical' | 'info' | 'warning' | 'success',
  title: string,
  message: string,
  actions?: { label: string; action: () => void; primary?: boolean }[]
): Notification {
  return {
    id: `notification_${Date.now()}_${Math.random()}`,
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
    actions
  }
}