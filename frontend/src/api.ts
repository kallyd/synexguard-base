const API = '/api/v1'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('ng_token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...authHeaders(), ...(opts.headers as Record<string, string> || {}) } })
  if (res.status === 401) {
    localStorage.removeItem('ng_token')
    localStorage.removeItem('ng_user')
    window.location.hash = '#/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `API error ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string }>('/auth/token', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (nome: string, email: string, password: string) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify({ nome, email, password }) }),
  me: () => request<any>('/auth/me'),
  updateMe: (data: { nome?: string; email?: string }) =>
    request<any>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (current_password: string, new_password: string) =>
    request<any>('/auth/me/password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) }),

  // Tokens
  listTokens: () => request<any[]>('/tokens'),
  createToken: (nome: string, descricao?: string) =>
    request<any>('/tokens', { method: 'POST', body: JSON.stringify({ nome, descricao }) }),
  revokeToken: (id: number) =>
    request<any>(`/tokens/${id}`, { method: 'DELETE' }),

  // Servers
  listServers: () => request<{ items: any[] }>('/servers'),
  serverStats: () => request<any>('/servers/stats'),

  // Events / Logs
  listEvents: (limit?: number, tipo?: string) => {
    const params = new URLSearchParams()
    if (limit) params.set('limit', String(limit))
    if (tipo) params.set('tipo', tipo)
    const q = params.toString()
    return request<{ items: any[]; total: number }>(`/events${q ? '?' + q : ''}`)
  },

  // Security
  listLoginAttempts: (limit?: number) =>
    request<{ items: any[]; stats: { total: number; blocked: number; suspicious: number } }>(`/security/login-attempts${limit ? '?limit=' + limit : ''}`),
  listBannedIps: () => request<{ items: any[] }>('/security/banned-ips'),
  banIp: (servidor_id: number, ip: string, motivo: string) =>
    request<any>('/security/banned-ips', { method: 'POST', body: JSON.stringify({ servidor_id, ip, motivo }) }),
  unbanIp: (ip: string) =>
    request<any>(`/security/banned-ips/${ip}`, { method: 'DELETE' }),

  // Metrics
  listMetrics: () => request<{ items: any[] }>('/metrics'),

  // Traffic
  listTraffic: () => request<{ items: any[]; total_in: number; total_out: number }>('/traffic'),

  // Alerts
  listAlerts: (status?: string) =>
    request<{ items: any[]; total: number }>(`/alerts${status ? '?status=' + status : ''}`),
  resolveAlert: (id: number) =>
    request<any>(`/alerts/${id}/resolve`, { method: 'PUT' }),

  // Automations
  listAutomations: () => request<{ items: any[] }>('/automations'),
  toggleAutomation: (id: number) =>
    request<any>(`/automations/${id}/toggle`, { method: 'PUT' }),
  createAutomation: (data: any) =>
    request<any>('/automations/rules', { method: 'POST', body: JSON.stringify(data) }),

  // Agents
  listAgents: () => request<any>('/agents'),

  // Admin (superadmin only)
  adminListUsers: () => request<any[]>('/admin/users'),
  adminToggleUser: (id: number, ativo: boolean) =>
    request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ ativo }) }),
  adminDeleteUser: (id: number) =>
    request<any>(`/admin/users/${id}`, { method: 'DELETE' }),
  adminListAllTokens: () => request<any[]>('/admin/tokens'),
  adminListAllServers: () => request<any[]>('/admin/servers'),
  adminStats: () => request<any>('/admin/stats'),

  // Audit Logs
  listAuditLogs: (limit = 100) =>
    request<{ items: any[]; total: number }>(`/audit?limit=${limit}`),
  getAuditSummary: () =>
    request<{ actions: Record<string, number>; users: Record<string, number>; total: number }>('/audit/summary'),

  // Health & Monitoring
  getHealthDetails: () =>
    request<{
      status: string;
      timestamp: string;
      uptime: string;
      version: string;
      system: {
        cpu_percent: number;
        memory: { total: number; used: number; available: number; percent: number };
        disk: { total: number; used: number; free: number; percent: number };
        python_version: string;
      };
    }>('/health/detailed'),
  getVersion: () =>
    request<{ version: string; environment: string }>('/version'),

  // Search & Export
  globalSearch: (query: string, type?: string) =>
    request<{ items: any[]; total: number }>(`/search?q=${encodeURIComponent(query)}${type ? '&type=' + type : ''}`),
  exportData: (type: 'events' | 'servers' | 'alerts', format = 'csv') =>
    request<any>(`/export/${type}?format=${format}`, { method: 'GET' }),

  // Session Management
  extendSession: () =>
    request<{ expires_at: string }>('/auth/extend-session', { method: 'POST', body: '{}' }),
  checkSession: () =>
    request<{ valid: boolean; expires_at: string }>('/auth/check-session'),
}
