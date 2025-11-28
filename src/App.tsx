import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth, ThemeProvider } from './contexts'

// Lazy load pages para reduzir bundle inicial
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const RoomPage = lazy(() => import('./pages/RoomPage').then(m => ({ default: m.RoomPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const TVPage = lazy(() => import('./pages/TVPage').then(m => ({ default: m.TVPage })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🎯</div>
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, isAnonymous, loading } = useAuth()

  // Loading state
  if (loading) {
    return <PageLoader />
  }

  // Not authenticated and not anonymous
  if (!user && !isAnonymous) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sala/:roomId" element={<RoomPage />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* TV route - no auth required */}
              <Route path="/tv/:roomId" element={<TVPage />} />
              {/* All other routes need auth check */}
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
