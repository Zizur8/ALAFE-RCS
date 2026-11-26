import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

interface HomeProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <rect x="1" y="1" width="38" height="38" rx="13" fill="currentColor" />
        <path d="M10 22.5 16.4 29 30 12" stroke="var(--mark-stroke)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 14.5h8" stroke="var(--mark-stroke)" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  return theme === 'light' ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.1 15.4A8.3 8.3 0 0 1 8.6 3.9 8.5 8.5 0 1 0 20.1 15.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.7" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
  )
}

export default function Home({ theme, onToggleTheme }: HomeProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 500))
    setMessage('No fue posible iniciar sesión. Verifica tus datos e inténtalo de nuevo.')
    setIsSubmitting(false)
  }

  return (
    <div className="home-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="ALAFE, inicio">
          <BrandMark />
          <span className="brand__name">alafe<span className="brand__period">.</span></span>
        </a>
        <div className="site-header__actions">
          <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`} title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}>
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </header>

      <main className="home-main" id="inicio">
        <section className="intro" aria-labelledby="intro-title">
          <div className="eyebrow"><span className="eyebrow__spark">✳</span> ORGANIZA TUS EVENTOS</div>
          <h1 id="intro-title">Donde sea,<br /><span>cuando sea.</span></h1>
          <p className="intro__copy">La forma sencilla de llevar la agenda de tu alberca, salón o espacio para eventos.</p>
          <div className="intro__proof"><span className="proof-icon" aria-hidden="true">✓</span><span>Más claridad para ti.<br /><strong>Mejor experiencia para tus clientes.</strong></span></div>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel__topline"><span className="login-panel__badge"><span /> ACCESO A TU CUENTA</span></div>
          <div className="login-panel__heading">
            <h2 id="login-title">Qué bueno verte.</h2>
            <p>Inicia sesión para continuar con tu agenda.</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <label className="form-field">
              <span>Correo electrónico</span>
              <span className="input-wrap"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg><input type="email" name="email" autoComplete="email" placeholder="nombre@ejemplo.com" value={email} onChange={(event) => { setEmail(event.target.value); setMessage('') }} required /></span>
            </label>
            <label className="form-field">
              <span>Contraseña</span>
              <span className="input-wrap"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><input type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" placeholder="Escribe tu contraseña" value={password} onChange={(event) => { setPassword(event.target.value); setMessage('') }} required /><button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></span>
            </label>
            <div className="form-meta"><label className="remember"><input type="checkbox" /><span className="custom-check" />Recordarme</label><button className="text-button" type="button" onClick={() => setMessage('Solicita el restablecimiento de tu contraseña con el administrador de tu cuenta.')}>¿Olvidaste tu contraseña?</button></div>
            <button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? <><span className="submit-spinner" aria-hidden="true" /> Iniciando sesión…</> : 'Iniciar sesión'}</button>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>
          <Link className="home-agenda-link" to="/app"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 2.5v4M13.5 2.5v4M3.5 8h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Ir a la agenda</Link>
        </section>
      </main>

      <footer className="site-footer"><span>© {new Date().getFullYear()} ALAFE</span><a href="mailto:hola@alafe.mx">¿Necesitas ayuda?</a></footer>
    </div>
  )
}
