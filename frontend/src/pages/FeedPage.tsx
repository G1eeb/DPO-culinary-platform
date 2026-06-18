import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useFeed, useRecipes, useFavoriteIds } from '../api/hooks'
import { RecipeCard } from '../components/RecipeCard'

// ─── Dropdown component ───────────────────────────────────────────────────────

interface DropdownOption { value: string; label: string }

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: DropdownOption[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 h-9 pl-3.5 pr-2.5 rounded-[9px] border text-[13px] font-semibold transition-colors whitespace-nowrap ${
          value
            ? 'bg-accent text-white border-accent'
            : 'bg-surface border-border-2 text-text-2 hover:border-accent hover:text-text'
        }`}
      >
        <span>{selected ? selected.label : label}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-surface border border-border rounded-[11px] shadow-popup min-w-[170px] py-1 overflow-hidden">
          {value && (
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-3.5 py-2 text-[13px] text-terracotta hover:bg-surface-2 transition-colors"
            >
              Сбросить
            </button>
          )}
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors ${
                o.value === value
                  ? 'bg-accent-bg text-accent-dark font-semibold'
                  : 'text-text hover:bg-surface-2'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Options ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS: DropdownOption[] = [
  { value: 'popularity', label: 'Популярные' },
  { value: 'rating',     label: 'По рейтингу' },
  { value: 'created_at', label: 'Новые' },
]

const CUISINE_OPTIONS: DropdownOption[] = [
  { value: 'russian',       label: 'Русская' },
  { value: 'georgian',      label: 'Грузинская' },
  { value: 'italian',       label: 'Итальянская' },
  { value: 'japanese',      label: 'Японская' },
  { value: 'french',        label: 'Французская' },
  { value: 'chinese',       label: 'Китайская' },
  { value: 'indian',        label: 'Индийская' },
  { value: 'mexican',       label: 'Мексиканская' },
  { value: 'mediterranean', label: 'Средиземноморская' },
  { value: 'american',      label: 'Американская' },
  { value: 'other',         label: 'Другая' },
]

const CATEGORY_OPTIONS: DropdownOption[] = [
  { value: 'soups',     label: 'Супы' },
  { value: 'main',      label: 'Основные блюда' },
  { value: 'salads',    label: 'Салаты' },
  { value: 'baking',    label: 'Выпечка' },
  { value: 'desserts',  label: 'Десерты' },
  { value: 'snacks',    label: 'Закуски' },
  { value: 'drinks',    label: 'Напитки' },
  { value: 'breakfast', label: 'Завтраки' },
  { value: 'sauces',    label: 'Соусы' },
  { value: 'other',     label: 'Другое' },
]

const DIFFICULTY_OPTIONS: DropdownOption[] = [
  { value: 'easy',   label: 'Легко' },
  { value: 'medium', label: 'Средне' },
  { value: 'hard',   label: 'Сложно' },
]

// ─── Hero ────────────────────────────────────────────────────────────────────

function GuestHero({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="bg-surface-3 border-b border-border py-16 px-7">
      <div className="max-w-[600px] mx-auto text-center">
        <span className="font-mono text-[11px] tracking-[.16em] uppercase text-accent-dark">
          Социальная сеть кулинаров
        </span>
        <h1 className="font-lora font-semibold text-[46px] mt-3 mb-4 leading-tight text-text">
          Готовьте с душой,<br />делитесь с миром
        </h1>
        <p className="text-[17px] text-text-2 leading-relaxed mb-8">
          Находите вдохновение в рецептах живых авторов, сохраняйте любимое
          и общайтесь с теми, кто так же любит готовить.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onJoin}
            className="bg-accent text-white font-semibold text-[15px] px-7 py-3.5 rounded-btn-lg hover:bg-accent-dark transition-colors"
          >
            Присоединиться бесплатно
          </button>
          <a
            href="#popular"
            className="border border-border-2 text-text-2 font-semibold text-[15px] px-7 py-3.5 rounded-btn-lg hover:bg-surface-2 transition-colors no-underline"
          >
            Смотреть рецепты
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function FeedPage() {
  const { user, openAuthModal } = useAuthStore()

  const [sort, setSort] = useState('popularity')
  const [cuisine, setCuisine] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [page, setPage] = useState(1)

  const hasFilters = !!(cuisine || category || difficulty)

  // Reset page when filters change
  const updateFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }
  const updateSort = (v: string) => { setSort(v); setPage(1) }

  // Personalized feed (only for logged-in users without active filters)
  const feed = useFeed(page)

  // Filtered/sorted recipe list (guests always; logged-in when filters active or feed empty)
  const recipes = useRecipes({
    sort,
    cuisine: cuisine || undefined,
    category: category || undefined,
    difficulty: difficulty || undefined,
    page,
    size: 20,
  })

  const { data: favoriteIds } = useFavoriteIds()
  const useFeedMode = !!user && !hasFilters && sort === 'popularity' && (feed.data?.total ?? 1) > 0
  const data = useFeedMode ? feed.data : recipes.data
  const isLoading = useFeedMode ? feed.isLoading : recipes.isLoading

  const title = useFeedMode ? 'Лента' : 'Рецепты'

  const activeFiltersCount = [cuisine, category, difficulty].filter(Boolean).length

  const clearAll = () => {
    setCuisine('')
    setCategory('')
    setDifficulty('')
    setSort('popularity')
    setPage(1)
  }

  return (
    <div>
      {!user && <GuestHero onJoin={() => openAuthModal('register')} />}

      <div id="popular" className="max-w-[1200px] mx-auto px-7 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h2 className="font-lora font-semibold text-[28px]">{title}</h2>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Dropdown
              label="Сортировка"
              value={sort}
              options={SORT_OPTIONS}
              onChange={updateSort}
            />
            <div className="w-px h-5 bg-border-2 mx-1" />
            <Dropdown
              label="Кухня"
              value={cuisine}
              options={CUISINE_OPTIONS}
              onChange={updateFilter(setCuisine)}
            />
            <Dropdown
              label="Категория"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={updateFilter(setCategory)}
            />
            <Dropdown
              label="Сложность"
              value={difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={updateFilter(setDifficulty)}
            />
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAll}
                className="h-9 px-3 text-[12.5px] text-text-3 hover:text-terracotta transition-colors"
              >
                Сбросить все
              </button>
            )}
          </div>
        </div>

        {/* Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface-2 rounded-card aspect-[3/4] animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && data && (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-6">
              {data.items.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  isFavorited={favoriteIds?.includes(r.id) ?? false}
                />
              ))}
            </div>

            {data.items.length === 0 && (
              <div className="text-center py-20 text-text-3">
                {useFeedMode ? (
                  <>
                    <p className="text-lg mb-2">Лента пуста</p>
                    <p className="text-sm">Подпишитесь на авторов, чтобы видеть их рецепты здесь</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">Ничего не найдено</p>
                    <p className="text-sm">Попробуйте изменить фильтры</p>
                  </>
                )}
              </div>
            )}

            {/* Pagination */}
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
    </div>
  )
}
