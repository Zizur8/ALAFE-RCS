import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AgendaPage from './pages/AgendaPage'
import Home from './pages/Home'
import './pages/Home.css'
import './pages/AgendaPage.css'

type Theme = 'light' | 'dark'

const THEME_KEY = 'alafe-theme'

function readTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      // The theme still works for this visit when storage is unavailable.
    }
  }, [theme])

  const onToggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home theme={theme} onToggleTheme={onToggleTheme} />} />
        <Route path="/app" element={<AgendaPage theme={theme} onToggleTheme={onToggleTheme} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
