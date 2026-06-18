import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useFavorites } from '../api/hooks'
import { RecipeCard } from '../components/RecipeCard'

export function FavoritesPage() {
  const { user, openAuthModal } = useAuthStore()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useFavorites(page)

  if (!user) {
    return (
      <div className="max-w-[1120px] mx-auto px-7 py-20 text-center">
        <p className="text-text-2 mb-4">Войдите, чтобы видеть избранное</p>
        <button onClick={() => openAuthModal()} className="bg-accent text-white font-semibold px-6 py-3 rounded-btn-lg">
          Войти
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-[1120px] mx-auto px-7 py-10 pb-20">
      <h1 className="font-lora font-semibold text-[34px] mb-6">Избранное</h1>

      {isLoading && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-2 rounded-card aspect-[3/4]" />
          ))}
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="text-center py-20 text-text-3">
          <p className="text-lg mb-3">Пока ничего нет</p>
          <Link to="/search" className="text-accent hover:underline">Найти рецепты →</Link>
        </div>
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-6">
            {data.items.map((r) => (
              <RecipeCard key={r.id} recipe={r} isFavorited />
            ))}
          </div>
          {data.total > data.size && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-btn border border-border text-sm font-semibold text-text-2 disabled:opacity-40 hover:bg-surface-2 transition-colors"
              >
                ← Назад
              </button>
              <span className="px-4 py-2 text-sm text-text-3">
                {page} / {Math.ceil(data.total / data.size)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(data.total / data.size)}
                className="px-4 py-2 rounded-btn border border-border text-sm font-semibold text-text-2 disabled:opacity-40 hover:bg-surface-2 transition-colors"
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
