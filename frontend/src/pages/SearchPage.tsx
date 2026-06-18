import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRecipes, useFavoriteIds } from '../api/hooks'
import { RecipeCard } from '../components/RecipeCard'

const CUISINES = [
  { value: 'russian', label: 'Русская' },
  { value: 'georgian', label: 'Грузинская' },
  { value: 'italian', label: 'Итальянская' },
  { value: 'japanese', label: 'Японская' },
  { value: 'french', label: 'Французская' },
  { value: 'chinese', label: 'Китайская' },
  { value: 'indian', label: 'Индийская' },
  { value: 'mexican', label: 'Мексиканская' },
  { value: 'mediterranean', label: 'Средиземноморская' },
  { value: 'american', label: 'Американская' },
  { value: 'other', label: 'Другая' },
]
const CATEGORIES = [
  { value: 'soups', label: 'Супы' },
  { value: 'main', label: 'Основные блюда' },
  { value: 'salads', label: 'Салаты' },
  { value: 'baking', label: 'Выпечка' },
  { value: 'desserts', label: 'Десерты' },
  { value: 'snacks', label: 'Закуски' },
  { value: 'drinks', label: 'Напитки' },
  { value: 'breakfast', label: 'Завтраки' },
  { value: 'sauces', label: 'Соусы' },
  { value: 'other', label: 'Другое' },
]
const DIFFICULTIES = [
  { value: 'easy', label: 'Легко' },
  { value: 'medium', label: 'Средне' },
  { value: 'hard', label: 'Сложно' },
]
const SORT_OPTIONS = [
  { value: 'rating', label: 'Рейтинг' },
  { value: 'popularity', label: 'Популярные' },
  { value: 'created_at', label: 'Новые' },
]

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputQ, setInputQ] = useState(searchParams.get('q') ?? '')
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') ?? '')
  const [sort, setSort] = useState('rating')
  const [page, setPage] = useState(1)

  const tag = searchParams.get('tag') ?? ''

  // Sync q from URL params
  useEffect(() => {
    const urlQ = searchParams.get('q') ?? ''
    setInputQ(urlQ)
    setQ(urlQ)
  }, [searchParams])

  const { data: favoriteIds } = useFavoriteIds()
  const { data, isLoading } = useRecipes({
    q: q || undefined,
    cuisine: cuisine || undefined,
    category: category || undefined,
    difficulty: difficulty || undefined,
    tag: tag || undefined,
    sort,
    page,
    size: 12,
  })

  const search = () => {
    setQ(inputQ)
    setPage(1)
    setSearchParams(inputQ ? { q: inputQ } : {})
  }

  const clearFilters = () => {
    setCuisine('')
    setCategory('')
    setDifficulty('')
    setPage(1)
  }

  const toggleChip = (
    val: string,
    current: string,
    set: (v: string) => void
  ) => {
    set(current === val ? '' : val)
    setPage(1)
  }

  function FilterGroup({ label, items, current, onToggle }: {
    label: string
    items: { value: string; label: string }[]
    current: string
    onToggle: (v: string) => void
  }) {
    return (
      <div className="mb-5">
        <div className="font-mono text-[10px] tracking-widest uppercase text-text-4 mb-2.5">{label}</div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => onToggle(item.value)}
              className={`cursor-pointer text-[12.5px] font-semibold px-3 py-1.5 rounded-badge transition-colors border ${
                current === item.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface border-border-2 text-text-2 hover:border-accent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-7 py-10 pb-20">
      <h1 className="font-lora font-semibold text-[34px] mb-5">
        {tag ? `Рецепты: #${tag}` : 'Поиск рецептов'}
      </h1>

      {/* Search bar */}
      {!tag && (
        <div className="flex items-center gap-3 bg-surface border border-border-2 rounded-[13px] px-4 py-1.5 mb-6">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9A9486" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Борщ, хачапури, паста…"
            className="flex-1 border-none bg-transparent text-[15.5px] py-2.5 text-text placeholder:text-text-3"
          />
          <button
            onClick={search}
            className="border-none cursor-pointer bg-accent text-white text-[14px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-accent-dark transition-colors"
          >
            Найти
          </button>
        </div>
      )}

      <div className="grid grid-cols-[236px_1fr] gap-8 items-start">
        {/* Filters */}
        <aside className="bg-surface border border-border rounded-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-lora font-semibold text-[17px]">Фильтры</h3>
            <button onClick={clearFilters} className="border-none bg-none cursor-pointer text-[12px] text-text-3 hover:text-text">
              Сбросить
            </button>
          </div>
          <FilterGroup
            label="Кухня"
            items={CUISINES}
            current={cuisine}
            onToggle={(v) => toggleChip(v, cuisine, setCuisine)}
          />
          <FilterGroup
            label="Категория"
            items={CATEGORIES}
            current={category}
            onToggle={(v) => toggleChip(v, category, setCategory)}
          />
          <FilterGroup
            label="Сложность"
            items={DIFFICULTIES}
            current={difficulty}
            onToggle={(v) => toggleChip(v, difficulty, setDifficulty)}
          />
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <span className="text-[14px] text-text-2">
              Найдено <strong className="text-text">{data?.total ?? 0}</strong> рецептов
            </span>
            <div className="flex gap-0.5 bg-[#EFE9DE] p-0.5 rounded-[9px]">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setSort(s.value); setPage(1) }}
                  className={`border-none cursor-pointer px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-semibold transition-colors ${
                    sort === s.value ? 'bg-surface text-text shadow-sm' : 'text-text-2 hover:text-text'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 animate-pulse">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-surface-2 rounded-card aspect-[3/4]" />
              ))}
            </div>
          )}

          {!isLoading && (
            <>
              {data?.items.length === 0 ? (
                <div className="text-center py-20 text-text-3">
                  <p className="text-lg mb-2">Ничего не найдено</p>
                  <p className="text-sm">Попробуйте изменить запрос или фильтры</p>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                  {data?.items.map((r) => (
                    <RecipeCard key={r.id} recipe={r} isFavorited={favoriteIds?.includes(r.id) ?? false} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data && data.total > data.size && (
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
    </div>
  )
}
