const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function getToken() { return localStorage.getItem('sahaaya_token') }
export async function api(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`)
  return data
}
export { API_URL }
