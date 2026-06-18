import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useToggleFavorite } from '../api/hooks'
import { Avatar } from './Avatar'
import type { RecipeCard as RecipeCardType } from '../api/types'

const DIFF_COLOR: Record<string, string> = {
  easy: '#7E8C6E',
  medium: '#C8923D',
  hard: '#B5654A',
}
const DIFF_LABEL: Record<string, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
}

interface Props {
  recipe: RecipeCardType
  isFavorited?: boolean
  isAdmin?: boolean
}

export function RecipeCard({ recipe, isFavorited = false, isAdmin }: Props) {
  const navigate = useNavigate()
  const { user, openAuthModal } = useAuthStore()
  const toggle = useToggleFavorite(recipe.id)

  // Локальный стейт для мгновенного отклика, синхронизируется с пропом
  const [localFav, setLocalFav] = useState(isFavorited)
  useEffect(() => { setLocalFav(isFavorited) }, [isFavorited])

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { openAuthModal(); return }
    setLocalFav(!localFav)  // мгновенное переключение
    toggle.mutate(localFav, {
      onError: () => setLocalFav(localFav),  // откат при ошибке
    })
  }

  const cookTime = recipe.cook_time == null
    ? '—'
    : recipe.cook_time >= 60
      ? `${Math.floor(recipe.cook_time / 60)} ч ${recipe.cook_time % 60 ? recipe.cook_time % 60 + ' мин' : ''}`
      : `${recipe.cook_time} мин`

  return (
    <div
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="cursor-pointer bg-surface border border-border rounded-card overflow-hidden flex flex-col h-full transition-transform duration-200 hover:-translate-y-1 hover:shadow-card"
    >
      {/* Cover image */}
      <div className="relative w-full aspect-[4/3] bg-surface-2 overflow-hidden">
        {recipe.cover_url ? (
          <img src={recipe.cover_url} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] tracking-widest uppercase text-text-3/50">
              {recipe.cuisine} · {recipe.category}
            </span>
          </div>
        )}
        <button
          onClick={handleSave}
          aria-label="Сохранить"
          className={`absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-full border-none flex items-center justify-center text-[17px] shadow-md transition-colors duration-150 ${
            localFav
              ? 'bg-white/95 text-terracotta'
              : 'bg-white/90 text-text-3 hover:text-terracotta'
          }`}
        >
          {localFav ? '♥' : '♡'}
        </button>
        {isAdmin && (
          <span className="absolute top-[11px] left-[11px] font-mono text-[9px] tracking-wider uppercase bg-black/80 text-bg px-2 py-1 rounded-badge">
            {recipe.difficulty}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-2 flex-1">
        <span className="font-mono text-[10px] tracking-widest uppercase text-accent-dark">
          {recipe.cuisine} · {recipe.category}
        </span>
        <h3 className="m-0 font-lora font-semibold text-[20px] leading-[1.22] text-text">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <Avatar avatarUrl={recipe.author.avatar_url} username={recipe.author.username} size={26} />
          <span className="text-[13px] text-text-2">{recipe.author.username}</span>
        </div>
        <div className="mt-auto pt-2.5 border-t border-surface-3 flex items-center gap-3 text-[12.5px] text-text-2">
          <span className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A9486" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            {cookTime}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: DIFF_COLOR[recipe.difficulty] ?? '#9A9486' }}
            />
            {DIFF_LABEL[recipe.difficulty] ?? recipe.difficulty}
          </span>
          <span className="ml-auto flex items-center gap-1 text-text font-semibold">
            <span className="text-star">★</span>
            {recipe.avg_rating != null ? recipe.avg_rating.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
