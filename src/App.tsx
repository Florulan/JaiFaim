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
import ExplorerPage from './pages/ExplorerPage'
import MonProfilPage from './pages/MonProfilPage'
import ProfilPage from './pages/ProfilPage'
import ExplorerRecettePage from './pages/ExplorerRecettePage'

const PROTECTED_ROUTES = [
  { path: '/', element: <BibliothequeePage /> },
  { path: '/recette/:id', element: <RecetteDetailPage /> },
  { path: '/planning', element: <PlanningPage /> },
  { path: '/courses', element: <CoursesPage /> },
  { path: '/congelateur', element: <CongelateurPage /> },
  { path: '/parametres', element: <ParametresPage /> },
  { path: '/explorer', element: <ExplorerPage /> },
  { path: '/mon-profil', element: <MonProfilPage /> },
  { path: '/profil/:username', element: <ProfilPage /> },
  { path: '/explorer/recette/:id', element: <ExplorerRecettePage /> },
  
]

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <HashRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {PROTECTED_ROUTES.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute>
                  <main className="pb-20">{element}</main>
                  <BottomNav />
                </PrivateRoute>
              }
            />
          ))}
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App