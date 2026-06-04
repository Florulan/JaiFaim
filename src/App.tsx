import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { PrivateRoute } from './middleware/PrivateRoute'
import { BottomNav } from './components/BottomNav'
import BibliothequeePage from './pages/BibliothequeePage'
import PlanningPage from './pages/PlanningPage'
import CoursesPage from './pages/CoursesPage'
import ParametresPage from './pages/ParametresPage'
import RecetteDetailPage from './pages/RecetteDetailPage'
import CongelateurPage from './pages/CongelateurPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <HashRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes protégées */}
          <Route path="/" element={
            <PrivateRoute>
              <main className="pb-20">
                <BibliothequeePage />
              </main>
              <BottomNav />
            </PrivateRoute>
          } />
          <Route path="/recette/:id" element={
            <PrivateRoute>
              <main className="pb-20">
                <RecetteDetailPage />
              </main>
              <BottomNav />
            </PrivateRoute>
          } />
          <Route path="/planning" element={
            <PrivateRoute>
              <main className="pb-20">
                <PlanningPage />
              </main>
              <BottomNav />
            </PrivateRoute>
          } />
          <Route path="/courses" element={
            <PrivateRoute>
              <main className="pb-20">
                <CoursesPage />
              </main>
              <BottomNav />
            </PrivateRoute>
          } />
          <Route path="/congelateur" element={
            <PrivateRoute>
              <main className="pb-20">
                <CongelateurPage />
              </main>
              <BottomNav />
            </PrivateRoute>
          } />
          <Route path="/parametres" element={
            <PrivateRoute>
              <main className="pb-20">
                <ParametresPage />
              </main>
              <BottomNav />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App