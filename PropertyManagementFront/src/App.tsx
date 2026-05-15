import PMDashboard from './components/pmdashboard/PMDashboard'
import Login from './components/Login'
import { useAuth } from './contexts/AuthContext'
import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'

function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
      {token ? (
        <>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PMDashboard />} />
          <Route path="/properties" element={<PMDashboard />} />
          <Route path="/tenants" element={<PMDashboard />} />
          <Route path="/payments" element={<PMDashboard />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}

export default App
