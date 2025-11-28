import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts'
import { HomePage, RoomPage, LoginPage, TVPage } from './pages'

function AppRoutes() {
  const { user, isAnonymous, loading } = useAuth()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎯</div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  // Not authenticated and not anonymous
  if (!user && !isAnonymous) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sala/:roomId" element={<RoomPage />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* TV route - no auth required */}
          <Route path="/tv/:roomId" element={<TVPage />} />
          {/* All other routes need auth check */}
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
