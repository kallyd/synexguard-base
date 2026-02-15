import { saveAs } from 'file-saver'

export interface ExportData {
  [key: string]: any
}

export type ExportFormat = 'csv' | 'json'

class DataExporter {
  private static convertToCSV(data: ExportData[], filename: string): string {
    if (data.length === 0) return ''
    
    // Get headers from first object
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape quotes and commas in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        }).join(',')
      )
    ].join('\n')
    
    return csvContent
  }

  private static formatTimestamp(timestamp: string | Date): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    return date.toLocaleString('pt-BR')
  }

  private static sanitizeForExport(data: ExportData[]): ExportData[] {
    return data.map(item => {
      const sanitized: ExportData = {}
      Object.keys(item).forEach(key => {
        let value = item[key]
        
        // Format timestamps
        if (key.toLowerCase().includes('timestamp') || 
            key.toLowerCase().includes('created_at') ||
            key.toLowerCase().includes('updated_at') ||
            key === 'data_hora') {
          value = this.formatTimestamp(value)
        }
        
        // Convert boolean to readable text
        if (typeof value === 'boolean') {
          value = value ? 'Sim' : 'Não'
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '-'
        }
        
        // Convert objects to string
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value)
        }
        
        sanitized[key] = value
      })
      return sanitized
    })
  }

  static exportToCSV(data: ExportData[], filename: string = 'export'): void {
    const sanitizedData = this.sanitizeForExport(data)
    const csvContent = this.convertToCSV(sanitizedData, filename)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    saveAs(blob, `${filename}_${timestamp}.csv`)
  }

  static exportToJSON(data: ExportData[], filename: string = 'export'): void {
    const sanitizedData = this.sanitizeForExport(data)
    const jsonContent = JSON.stringify(sanitizedData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    saveAs(blob, `${filename}_${timestamp}.json`)
  }

  static export(data: ExportData[], format: ExportFormat = 'csv', filename: string = 'export'): void {
    if (data.length === 0) {
      alert('Não há dados para exportar')
      return
    }

    switch (format) {
      case 'csv':
        this.exportToCSV(data, filename)
        break
      case 'json':
        this.exportToJSON(data, filename)
        break
      default:
        throw new Error(`Formato não suportado: ${format}`)
    }
  }
}

// Hook for easy use in components
export function useDataExport() {
  const exportData = (
    data: ExportData[], 
    format: ExportFormat = 'csv', 
    filename: string = 'export'
  ) => {
    DataExporter.export(data, format, filename)
  }

  const exportServers = (servers: any[]) => {
    const exportData = servers.map(server => ({
      'Nome': server.nome,
      'Hostname': server.hostname, 
      'IP': server.ip,
      'Status': server.status === 'online' ? 'Online' : 'Offline',
      'Sistema': server.sistema_operacional,
      'CPU (%)': server.cpu_percent,
      'RAM (%)': server.memory_percent,
      'Disco (%)': server.disk_percent,
      'Última Atualização': server.ultima_atividade
    }))
    DataExporter.export(exportData, 'csv', 'servidores')
  }

  const exportEvents = (events: any[]) => {
    const exportData = events.map(event => ({
      'ID': event.id,
      'Servidor': event.hostname,
      'Tipo': event.tipo,
      'Severidade': event.severidade,
      'Mensagem': event.mensagem,
      'IP Origem': event.ip_origem,
      'Data/Hora': event.timestamp
    }))
    DataExporter.export(exportData, 'csv', 'eventos')
  }

  const exportAlerts = (alerts: any[]) => {
    const exportData = alerts.map(alert => ({
      'ID': alert.id,
      'Servidor': alert.servidor_nome,
      'Tipo': alert.tipo,
      'Severidade': alert.severidade,
      'Título': alert.titulo,
      'Descrição': alert.descricao,
      'Status': alert.status,
      'Criado em': alert.created_at,
      'Resolvido em': alert.resolved_at
    }))
    DataExporter.export(exportData, 'csv', 'alertas')
  }

  const exportAuditLogs = (logs: any[]) => {
    const exportData = logs.map(log => ({
      'ID': log.id,
      'Usuário': log.username,
      'Ação': log.action,
      'Recurso': log.resource,
      'IP': log.ip_address,
      'Data/Hora': log.timestamp,
      'Detalhes': log.details ? JSON.stringify(log.details) : '-'
    }))
    DataExporter.export(exportData, 'csv', 'logs-auditoria')
  }

  return {
    exportData,
    exportServers,
    exportEvents,
    exportAlerts,
    exportAuditLogs
  }
}