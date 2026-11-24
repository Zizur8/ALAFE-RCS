import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Clientes from './pages/Clientes'
import Configuracion from './pages/Configuracion'
import Login from './pages/Login'
import MainAppAgenda from './pages/MainAppAgenda'
import PermisosUsuarios from './pages/PermisosUsuarios'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas dentro del layout con navegación lateral */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<MainAppAgenda />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/permisos-usuarios" element={<PermisosUsuarios />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
