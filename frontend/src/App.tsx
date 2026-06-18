import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { useMe } from './api/hooks'
import { Navbar } from './components/Navbar'
import { AuthModal } from './components/AuthModal'
import { FeedPage } from './pages/FeedPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { PublishPage } from './pages/PublishPage'
import { SearchPage } from './pages/SearchPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { AdminPage } from './pages/AdminPage'

function AppInner() {
  const setUser = useAuthStore((s) => s.setUser)
  const { data: me } = useMe()

  useEffect(() => {
    setUser(me ?? null)
  }, [me, setUser])

  return (
    <BrowserRouter>
      <Navbar />
      <div className="pt-[68px] min-h-screen">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
      <AuthModal />
    </BrowserRouter>
  )
}

export default function App() {
  return <AppInner />
}
