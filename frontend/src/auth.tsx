import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface User {
  id: number
  nome: string
  email: string
  role: string
}

interface AuthCtx {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (u: User) => void
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  setUser: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ng_token'))
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('ng_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const login = (t: string, u: User) => {
    localStorage.setItem('ng_token', t)
    localStorage.setItem('ng_user', JSON.stringify(u))
    setToken(t)
    setUserState(u)
  }

  const logout = () => {
    localStorage.removeItem('ng_token')
    localStorage.removeItem('ng_user')
    setToken(null)
    setUserState(null)
  }

  const setUser = (u: User) => {
    localStorage.setItem('ng_user', JSON.stringify(u))
    setUserState(u)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
