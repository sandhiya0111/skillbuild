import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken } from '../api'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    api('/api/auth/me').then(data => setUser(data.user)).catch(() => localStorage.removeItem('sahaaya_token')).finally(() => setLoading(false))
  }, [])
  const login = async (credentials) => {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
    localStorage.setItem('sahaaya_token', data.token); setUser(data.user); return data.user
  }
  const register = async (payload) => {
    const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) })
    localStorage.setItem('sahaaya_token', data.token); setUser(data.user); return data.user
  }
  const logout = () => { localStorage.removeItem('sahaaya_token'); setUser(null) }
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
