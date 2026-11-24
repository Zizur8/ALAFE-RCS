import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Agenda', end: true },
  { to: '/clientes', label: 'Clientes' },
  { to: '/permisos-usuarios', label: 'Permisos y usuarios' },
  { to: '/configuracion', label: 'Configuración' },
]

/**
 * Layout base: barra superior en móvil con menú desplegable
 * y barra lateral fija en escritorio.
 */
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <header className="layout__topbar">
        <button
          type="button"
          className="layout__toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
        <span className="layout__brand">ALAFE</span>
        {isAuthenticated && (
          <button type="button" className="layout__logout" onClick={handleLogout}>
            Salir
          </button>
        )}
      </header>

      <div className="layout__body">
        <nav
          className={`layout__sidebar${menuOpen ? ' layout__sidebar--open' : ''}`}
          aria-label="Navegación principal"
        >
          <span className="layout__sidebar-brand">ALAFE</span>
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {isAuthenticated && (
            <button type="button" className="layout__logout layout__logout--sidebar" onClick={handleLogout}>
              Cerrar sesión
            </button>
          )}
        </nav>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
