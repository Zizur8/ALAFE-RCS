import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>

      {/* Rutas protegidas dentro del layout con navegación lateral */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
