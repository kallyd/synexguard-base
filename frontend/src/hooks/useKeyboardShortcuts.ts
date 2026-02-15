import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: (e: KeyboardEvent) => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey === true ? event.ctrlKey : !event.ctrlKey
        const shiftMatch = shortcut.shiftKey === true ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.altKey === true ? event.altKey : !event.altKey
        const metaMatch = shortcut.metaKey === true ? event.metaKey : !event.metaKey

        return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch
      })

      if (matchingShortcut) {
        event.preventDefault()
        event.stopPropagation()
        matchingShortcut.callback(event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Predefined shortcuts for common actions
export const createCommonShortcuts = (callbacks: {
  openSearch?: () => void
  openSettings?: () => void
  goToDashboard?: () => void
  goToServers?: () => void
  goToAlerts?: () => void
  toggleTheme?: () => void
  logout?: () => void
}) => {
  const shortcuts: KeyboardShortcut[] = []

  if (callbacks.openSearch) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      callback: callbacks.openSearch,
      description: 'Abrir busca global'
    })
  }

  if (callbacks.openSettings) {
    shortcuts.push({
      key: ',',
      ctrlKey: true,
      callback: callbacks.openSettings,
      description: 'Abrir configurações'
    })
  }

  if (callbacks.goToDashboard) {
    shortcuts.push({
      key: 'h',
      ctrlKey: true,
      callback: callbacks.goToDashboard,
      description: 'Ir para Dashboard'
    })
  }

  if (callbacks.goToServers) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      callback: callbacks.goToServers,
      description: 'Ir para Servidores'
    })
  }

  if (callbacks.goToAlerts) {
    shortcuts.push({
      key: 'a',
      ctrlKey: true,
      callback: callbacks.goToAlerts,
      description: 'Ir para Alertas'
    })
  }

  if (callbacks.toggleTheme) {
    shortcuts.push({
      key: 't',
      ctrlKey: true,
      callback: callbacks.toggleTheme,
      description: 'Alternar tema'
    })
  }

  if (callbacks.logout) {
    shortcuts.push({
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      callback: callbacks.logout,
      description: 'Fazer logout'
    })
  }

  return shortcuts
}