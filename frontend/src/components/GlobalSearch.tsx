import { useState, useEffect, useRef } from 'react'
import { Search, Server, ShieldAlert, Activity, Calendar, X, Loader2 } from 'lucide-react'
import { api } from '../api'

interface SearchResult {
  id: string
  type: 'server' | 'event' | 'alert' | 'log'
  title: string
  subtitle: string
  timestamp?: string
  severity?: 'info' | 'warning' | 'error' | 'critical'
  onSelect: () => void
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Perform search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await api.globalSearch(query)
        const searchResults: SearchResult[] = response.items.map((item: any) => ({
          id: item.id || `${item.type}_${Math.random()}`,
          type: item.type,
          title: item.title || item.nome || item.message || 'Item sem título',
          subtitle: item.subtitle || item.ip || item.descricao || '',
          timestamp: item.timestamp || item.created_at,
          severity: item.severity || item.status,
          onSelect: () => {
            // Navigate to appropriate page based on type
            switch (item.type) {
              case 'server':
                window.location.href = '/servers'
                break
              case 'alert':
                window.location.href = '/alerts'
                break
              case 'event':
                window.location.href = `/events?search=${encodeURIComponent(query)}`
                break
              case 'log':
                window.location.href = '/logs'
                break
            }
            onClose()
          }
        }))
        setResults(searchResults.slice(0, 8)) // Limit to 8 results
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, onClose])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            results[selectedIndex].onSelect()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, selectedIndex, results, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const getIcon = (type: string) => {
    switch (type) {
      case 'server':
        return <Server className="w-4 h-4" />
      case 'alert':
        return <ShieldAlert className="w-4 h-4" />
      case 'event':
        return <Activity className="w-4 h-4" />
      case 'log':
        return <Calendar className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400'
      case 'error':
        return 'text-red-300'
      case 'warning':
        return 'text-yellow-300'
      case 'info':
        return 'text-blue-300'
      default:
        return 'text-slate-400'
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]">
      <div className="bg-ng-card border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Busque servidores, alertas, eventos..."
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {query.length > 0 && query.length < 2 && (
            <div className="p-6 text-center text-slate-500">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
          
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-500">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={result.onSelect}
              className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${
                selectedIndex === index ? 'bg-ng-neon/10 border-r-2 border-ng-neon' : ''
              }`}
            >
              <div className={`${getSeverityColor(result.severity)}`}>
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{result.title}</div>
                {result.subtitle && (
                  <div className="text-slate-400 text-sm truncate">{result.subtitle}</div>
                )}
              </div>
              {result.timestamp && (
                <div className="text-slate-500 text-xs">
                  {new Date(result.timestamp).toLocaleDateString('pt-BR')}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 bg-white/5 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">↑↓</kbd>
              para navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Enter</kbd>
              para selecionar
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Esc</kbd>
            para fechar
          </span>
        </div>
      </div>
    </div>
  )
}