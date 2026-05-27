import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { initDatabase } from './db/database'
import { BottomNav } from './components/BottomNav'
import BibliothequeePage from './pages/BibliothequeePage'
import PlanningPage from './pages/PlanningPage'
import CoursesPage from './pages/CoursesPage'
import ParametresPage from './pages/ParametresPage'
import RecetteDetailPage from './pages/RecetteDetailPage'

function App() {
  useEffect(() => {
    initDatabase().catch(console.error)
  }, [])

  return (
    <HashRouter>
      <div className="min-h-screen bg-background">
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<BibliothequeePage />} />
            <Route path="/recette/:id" element={<RecetteDetailPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/parametres" element={<ParametresPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  )
}

export default App
