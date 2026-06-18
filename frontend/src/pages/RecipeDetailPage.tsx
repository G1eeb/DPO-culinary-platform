import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import {
  useRecipe, useComments, usePostComment,
  useRating, useRateRecipe, useToggleFavorite,
  useDeleteRecipe,
} from '../api/hooks'
import { Avatar } from '../components/Avatar'

const DIFF_LABEL: Record<string, string> = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' }

function StarRating({ recipeId }: { recipeId: number }) {
  const { user, openAuthModal } = useAuthStore()
  const { data: rating } = useRating(recipeId)
  const rateRecipe = useRateRecipe(recipeId)
  const [hover, setHover] = useState(0)

  // Активная оценка: hover > выбранная пользователем
  const active = hover || rating?.user_score || 0

  return (
    <div className="mt-12 bg-surface-2 border border-border rounded-card-lg p-7">
      <h3 className="font-lora font-semibold text-[20px] mb-1">Оцените рецепт</h3>
      <p className="text-[13.5px] text-text-3 mb-4">
        {rating?.count
          ? `Средняя оценка: ${rating.avg?.toFixed(1)} (${rating.count} голосов)`
          : 'Будьте первым!'}
        {rating?.user_score && !hover && (
          <span className="ml-2 text-amber-600 font-semibold">· ваша оценка: {rating.user_score}</span>
        )}
      </p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => {
              if (!user) { openAuthModal(); return }
              rateRecipe.mutate(star)
            }}
            className="border-none bg-none text-[34px] p-0 cursor-pointer leading-none transition-colors"
            style={{ color: star <= active ? '#C8923D' : '#D6CFC1' }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

function Comments({ recipeId, authorId }: { recipeId: number; authorId: number }) {
  const { user, openAuthModal } = useAuthStore()
  const { data: comments } = useComments(recipeId)
  const post = usePostComment(recipeId)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null)

  const submit = (parentId?: number) => {
    if (!text.trim()) return
    post.mutate({ text: text.trim(), parent_id: parentId }, {
      onSuccess: () => { setText(''); setReplyTo(null) },
    })
  }

  return (
    <div className="mt-12">
      <h2 className="font-lora font-semibold text-[24px] mb-5">
        Комментарии{comments?.length ? ` · ${comments.length}` : ''}
      </h2>

      {!user ? (
        <div className="flex items-center gap-4 bg-accent-bg border border-dashed border-accent-bg-2 rounded-card px-5 py-4 mb-6">
          <span className="text-sm text-accent-dark">Войдите, чтобы оставить комментарий</span>
          <button
            onClick={() => openAuthModal()}
            className="ml-auto whitespace-nowrap border-none cursor-pointer bg-accent text-white text-[13px] font-semibold px-4 py-2 rounded-btn"
          >
            Войти
          </button>
        </div>
      ) : (
        <div className="flex gap-3 mb-7">
          <Avatar avatarUrl={user.avatar_url} username={user.username} size={38} />
          <div className="flex-1">
            {replyTo && (
              <div className="text-xs text-text-3 mb-2">
                Ответ для <span className="font-semibold text-text-2">@{replyTo.username}</span>
                <button onClick={() => setReplyTo(null)} className="ml-2 text-terracotta">✕</button>
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Поделитесь впечатлением или задайте вопрос автору…"
              className="w-full min-h-[70px] resize-y border border-border-2 rounded-[11px] px-3.5 py-3 text-[14px] text-text focus:border-accent transition-colors"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => submit(replyTo?.id)}
                disabled={post.isPending || !text.trim()}
                className="border-none cursor-pointer bg-accent text-white text-[13px] font-semibold px-4 py-2 rounded-btn hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {comments?.map((c) => (
          <div key={c.id}>
            <div className="flex gap-3">
              <Avatar avatarUrl={c.user.avatar_url} username={c.user.username} size={38} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold">{c.user.username}</span>
                  <span className="text-[12px] text-text-4">
                    {new Date(c.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="mt-1 text-[14.5px] leading-[1.55] text-[#423E36]">{c.text}</p>
                <div className="flex items-center gap-4 mt-2 text-[12.5px] text-text-3">
                  {user && (
                    <button
                      onClick={() => setReplyTo({ id: c.id, username: c.user.username })}
                      className="border-none bg-none cursor-pointer text-text-3 hover:text-text-2 text-[12.5px]"
                    >
                      Ответить
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            {c.replies?.map((rep) => (
              <div key={rep.id} className="flex gap-3 mt-4 ml-[50px]">
                <Avatar avatarUrl={rep.user.avatar_url} username={rep.user.username} size={32} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold">{rep.user.username}</span>
                    {rep.user.id === authorId && (
                      <span className="font-mono text-[9px] tracking-wider uppercase bg-accent-bg text-accent-dark px-1.5 py-0.5 rounded-badge">
                        автор
                      </span>
                    )}
                    <span className="text-[11.5px] text-text-4">
                      {new Date(rep.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-[1.55] text-[#423E36]">{rep.text}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const recipeId = Number(id)
  const navigate = useNavigate()
  const { user, openAuthModal } = useAuthStore()
  const { data: recipe, isLoading } = useRecipe(recipeId)
  const toggleFav = useToggleFavorite(recipeId)
  const deleteRecipe = useDeleteRecipe()
  const [portions, setPortions] = useState<number | null>(null)

  if (isLoading) return (
    <div className="max-w-[1120px] mx-auto px-7 pt-10 pb-20 animate-pulse">
      <div className="h-80 bg-surface-2 rounded-card-lg mb-8" />
      <div className="h-8 bg-surface-2 rounded w-1/2 mb-4" />
      <div className="h-4 bg-surface-2 rounded w-3/4" />
    </div>
  )

  if (!recipe) return (
    <div className="max-w-[1120px] mx-auto px-7 py-20 text-center text-text-3">
      Рецепт не найден
    </div>
  )

  const scale = portions != null ? portions / (recipe.servings || 1) : 1

  const cookTime = recipe.cook_time == null
    ? '—'
    : recipe.cook_time >= 60
      ? `${Math.floor(recipe.cook_time / 60)} ч ${recipe.cook_time % 60 ? recipe.cook_time % 60 + ' мин' : ''}`
      : `${recipe.cook_time} мин`

  return (
    <div className="max-w-[1120px] mx-auto px-7 pb-20">
      {/* Cover */}
      <div className="w-full h-[420px] rounded-card-lg overflow-hidden bg-surface-2 mt-6 relative">
        {recipe.cover_url ? (
          <img src={recipe.cover_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-sm tracking-widest uppercase text-text-3/40">
            {recipe.cuisine} · {recipe.category}
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mt-5 text-[13px] text-text-3 font-mono">
        <Link to="/" className="text-text-3 hover:text-accent no-underline">Главная</Link>
        <span>/</span>
        <span>{recipe.title}</span>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-10 mt-6 items-start">
        {/* Main content */}
        <div>
          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="font-mono text-[10px] tracking-widest uppercase bg-accent-bg text-accent-dark px-3 py-1.5 rounded-badge">
              {recipe.cuisine}
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase bg-accent-bg text-accent-dark px-3 py-1.5 rounded-badge">
              {recipe.category}
            </span>
            {recipe.tags.map((t) => (
              <Link
                key={t}
                to={`/search?tag=${t}`}
                className="font-mono text-[10px] tracking-widest uppercase bg-surface-2 text-text-3 px-3 py-1.5 rounded-badge no-underline hover:bg-accent-bg hover:text-accent-dark transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>

          <h1 className="font-lora font-semibold text-[38px] leading-tight text-text mb-4">{recipe.title}</h1>

          {/* Author row */}
          <div className="flex items-center gap-3 mb-5">
            <Link to={`/profile/${recipe.author.id}`} className="flex items-center gap-2 no-underline group">
              <Avatar avatarUrl={recipe.author.avatar_url} username={recipe.author.username} size={44} />
              <div>
                <p className="text-sm font-semibold text-text group-hover:text-accent transition-colors">{recipe.author.username}</p>
                <p className="text-xs text-text-3">
                  {new Date(recipe.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              {/* Favorite */}
              <button
                onClick={() => {
                  if (!user) { openAuthModal(); return }
                  toggleFav.mutate(recipe.is_favorited)
                }}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-btn border transition-colors ${
                  recipe.is_favorited
                    ? 'bg-accent text-white border-accent'
                    : 'border-border-2 text-text-2 hover:border-accent hover:text-accent'
                }`}
              >
                {recipe.is_favorited ? '♥' : '♡'} Сохранить
              </button>
              {/* Edit / Delete for author or admin */}
              {user && (user.id === recipe.author.id || user.role === 'admin') && (
                <>
                  <Link
                    to={`/publish?edit=${recipe.id}`}
                    className="text-sm font-semibold px-3 py-2 rounded-btn border border-border-2 text-text-2 hover:bg-surface-2 no-underline transition-colors"
                  >
                    Изменить
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm('Удалить рецепт?')) return
                      await deleteRecipe.mutateAsync(recipe.id)
                      navigate('/')
                    }}
                    className="text-sm font-semibold px-3 py-2 rounded-btn border border-terracotta text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                  >
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex gap-5 text-sm text-text-2 mb-6">
            <span>⏱ {cookTime}</span>
            <span>· {DIFF_LABEL[recipe.difficulty] ?? recipe.difficulty}</span>
            <span>· {recipe.servings} порций</span>
            {recipe.avg_rating != null && (
              <span className="ml-auto font-semibold text-text">
                <span className="text-star">★</span> {recipe.avg_rating.toFixed(1)}
              </span>
            )}
          </div>

          {recipe.description && (
            <p className="text-[15.5px] leading-relaxed text-text-2 mb-10 italic border-l-2 border-accent pl-4">
              {recipe.description}
            </p>
          )}

          {/* Steps */}
          <h2 className="font-lora font-semibold text-[26px] mb-6">Приготовление</h2>
          <div className="flex flex-col gap-8">
            {recipe.steps
              .sort((a, b) => a.order - b.order)
              .map((step, i) => (
                <div key={step.id} className="flex gap-5">
                  <div className="flex-none w-9 h-9 rounded-full bg-accent-bg text-accent-dark font-lora font-semibold text-[15px] flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[15px] leading-relaxed text-[#2B2924]">{step.description}</p>
                    {step.photo_url && (
                      <img src={step.photo_url} alt={`Шаг ${i + 1}`} className="mt-4 w-full rounded-card object-cover max-h-64" />
                    )}
                  </div>
                </div>
              ))}
          </div>

          <StarRating recipeId={recipeId} />
          <Comments recipeId={recipeId} authorId={recipe.author.id} />
        </div>

        {/* Ingredients aside */}
        <aside className="sticky top-[88px]">
          <div className="bg-surface border border-border rounded-card-lg p-6">
            <h2 className="font-lora font-semibold text-[21px] mb-1">Ингредиенты</h2>
            <p className="text-[12.5px] text-text-3 mb-4">Количество пересчитано на порции</p>

            {/* Portions scaler */}
            <div className="flex items-center justify-between bg-surface-2 rounded-[11px] px-3 py-2.5 mb-5">
              <span className="text-[13.5px] font-semibold text-[#5C5749]">Порции</span>
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => setPortions((p) => Math.max(1, (p ?? recipe.servings) - 1))}
                  className="w-[30px] h-[30px] rounded-[8px] border border-border-2 bg-surface cursor-pointer text-[18px] text-[#5C5749] flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-[17px] font-bold min-w-[22px] text-center">
                  {portions ?? recipe.servings}
                </span>
                <button
                  onClick={() => setPortions((p) => (p ?? recipe.servings) + 1)}
                  className="w-[30px] h-[30px] rounded-[8px] border border-border-2 bg-surface cursor-pointer text-[18px] text-[#5C5749] flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-[#F2ECE1]">
              {recipe.ingredients.map((ing) => {
                const scaled = parseFloat(ing.amount) * scale
                const amountStr = Number.isNaN(scaled)
                  ? ing.amount
                  : (scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1))
                return (
                  <div key={ing.id} className="flex items-baseline justify-between gap-3.5 py-2.5">
                    <span className="text-[14px] text-[#423E36]">{ing.name}</span>
                    <span className="text-[13.5px] font-semibold text-accent-dark whitespace-nowrap">
                      {amountStr} {ing.unit}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3 mt-3.5 font-mono text-[11px] text-text-3 px-1">
            <span>⏱ {cookTime}</span>
            <span>·</span>
            <span>{DIFF_LABEL[recipe.difficulty] ?? recipe.difficulty}</span>
            <span>·</span>
            <span>{recipe.servings} порций</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
