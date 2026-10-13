import { Link, NavLink } from 'react-router-dom'
import { HeartHandshake, LayoutDashboard, LifeBuoy, MapPin, LogIn, LogOut, Menu, Plus, ShieldCheck, Users, X, BellRing } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from './context/AuthContext'

export function Header() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const items = user ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requests', label: 'Requests', icon: LifeBuoy },
    { to: '/directory', label: 'Support directory', icon: MapPin },
    ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin review', icon: ShieldCheck }] : [])
  ] : [{ to: '/directory', label: 'Support directory', icon: MapPin }]
  return <header className="site-header"><div className="header-inner">
    <Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-icon"><HeartHandshake size={22}/></span><span>SAHAAYA<small>COMMUNITY SUPPORT</small></span></Link>
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
    <nav className={open ? 'header-nav is-open' : 'header-nav'}>
      {items.map(item => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}><item.icon size={16}/>{item.label}</NavLink>)}
      {user ? <><span className="user-chip"><span className="avatar">{user.name?.slice(0,1).toUpperCase()}</span><span>{user.name}<small>{user.role}</small></span></span><button className="nav-logout" onClick={() => { logout(); setOpen(false) }}><LogOut size={16}/> Sign out</button></> : <Link className="button button-dark header-login" to="/login" onClick={() => setOpen(false)}><LogIn size={16}/> Sign in</Link>}
    </nav>
  </div></header>
}

export function Footer() { return <footer className="footer"><div className="footer-brand"><HeartHandshake size={19}/> Sahaaya</div><span>A community-powered path to essential support and opportunity.</span><span>Built for learning and community impact.</span></footer> }
export function PageShell({ children }) { return <><Header/><main className="main-content">{children}</main><Footer/></> }
export function SectionTitle({ eyebrow, title, subtitle, action }) { return <div className="section-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div> }
export function StatusPill({ status }) { const key = (status || 'open').toLowerCase().replaceAll(' ', '-'); return <span className={`status-pill status-${key}`}>{(status || 'open').replaceAll('-', ' ')}</span> }
export function EmptyState({ icon: Icon = BellRing, title, message, action }) { return <div className="empty-state"><span className="empty-icon"><Icon size={23}/></span><h3>{title}</h3><p>{message}</p>{action}</div> }
export function Loading() { return <div className="loading-box"><span className="spinner"/> Loading community support…</div> }
export function ErrorBanner({ message, onClose }) { if (!message) return null; return <div className="error-banner" role="alert"><span>{message}</span>{onClose && <button onClick={onClose} aria-label="Dismiss">×</button>}</div> }
export function SuccessBanner({ message }) { if (!message) return null; return <div className="success-banner" role="status">{message}</div> }
export function RequestCard({ request, onClick }) { return <button className="request-card" onClick={onClick}><div className="request-card-top"><span className={`category-icon cat-${request.type}`}><LifeBuoy size={18}/></span><StatusPill status={request.status}/></div><div className="request-meta"><span>{request.type?.replaceAll('-', ' ')}</span><span className={`urgency urgency-${request.urgency}`}>{request.urgency} priority</span></div><h3>{request.title}</h3><p>{request.description}</p><div className="request-card-bottom"><span><MapPin size={14}/>{request.location?.city || 'Location not provided'}</span><span>{new Date(request.createdAt).toLocaleDateString()}</span></div></button> }
