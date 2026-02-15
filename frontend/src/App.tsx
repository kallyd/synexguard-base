import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { ThemeProvider } from './theme'
import Layout from './components/Layout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ServersPage from './pages/Servers'
import TokensPage from './pages/Tokens'
import SettingsPage from './pages/Settings'
import AuditLogsPage from './pages/AuditLogs'
import {
  SecurityPage,
  BannedIPsPage,
  TrafficPage,
  MetricsPage,
  AutomationsPage,
  AlertsPage,
  ForensicsPage,
  LogsPage,
} from './pages/Modules'
import AdminPage from './pages/Admin'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <Navigate to="/" replace /> : <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/servers" element={<PrivateRoute><ServersPage /></PrivateRoute>} />
      <Route path="/security" element={<PrivateRoute><SecurityPage /></PrivateRoute>} />
      <Route path="/banned-ips" element={<PrivateRoute><BannedIPsPage /></PrivateRoute>} />
      <Route path="/traffic" element={<PrivateRoute><TrafficPage /></PrivateRoute>} />
      <Route path="/metrics" element={<PrivateRoute><MetricsPage /></PrivateRoute>} />
      <Route path="/automations" element={<PrivateRoute><AutomationsPage /></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><AlertsPage /></PrivateRoute>} />
      <Route path="/forensics" element={<PrivateRoute><ForensicsPage /></PrivateRoute>} />
      <Route path="/logs" element={<PrivateRoute><LogsPage /></PrivateRoute>} />
      <Route path="/tokens" element={<PrivateRoute><TokensPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="/audit-logs" element={<PrivateRoute><AuditLogsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
