import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Requests from './pages/Requests'

function App() {
  const user = useAuthStore((state) => state.user)

  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">SlotSwapper</Link>
          {user && (
            <div className="d-flex gap-4">
              <Link className="nav-link text-white" to="/dashboard">Dashboard</Link>
              <Link className="nav-link text-white" to="/marketplace">Marketplace</Link>
              <Link className="nav-link text-white" to="/requests">Requests</Link>
            </div>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
