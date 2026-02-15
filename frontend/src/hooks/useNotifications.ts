import { useEffect, useRef } from 'react'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
}

export const useNotifications = () => {
  const hasPermission = useRef(false)

  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          hasPermission.current = permission === 'granted'
        })
      } else {
        hasPermission.current = Notification.permission === 'granted'
      }
    }
  }, [])

  const showNotification = (options: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return
    }

    if (!hasPermission.current) {
      console.warn('Notifications not permitted')
      return
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
    })

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000)

    return notification
  }

  const showCriticalAlert = (hostname: string, message: string) => {
    showNotification({
      title: `🚨 Alerta Crítico - ${hostname}`,
      body: message,
      tag: 'critical-alert',
      requireInteraction: true,
    })

    // Play sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRvIGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvd5Y93KBSNqNvsx3kpBzJVqeHlyYc7GQ54p93nxoEpAy6BzvLDYSfRADpYrO/FQyUOlKnB9jpcgGJkHxA+7gCDh4FEAFJx4ACGiwFFAJKAoJdEUZTIHRRnJ6TctFdmGDGYtN7kFHIBELCxKTWHICISsGXJbRRAzJfUq2pYJjGWjV7RrzgWmitqOyPXWiKHcx2Jf2Kcby4MgjMpg3QnhG5FAS4DKFqVaQJ3LNw2b1+7hXQHvPl8J3E2jhI7Wp6B2KKr2EtlERmYNmQKOGcLhwJF');
      audio.play().catch(() => {}) // Ignore if audio fails
    } catch (e) {}
  }

  const showInfoAlert = (title: string, message: string) => {
    showNotification({
      title: `ℹ️ ${title}`,
      body: message,
      tag: 'info-alert',
    })
  }

  return {
    showNotification,
    showCriticalAlert,
    showInfoAlert,
    hasPermission: hasPermission.current,
  }
}