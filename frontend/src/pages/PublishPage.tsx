import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/auth'
import { useCreateRecipe, useRecipe, useUpdateRecipe, useUploadRecipeCover } from '../api/hooks'

const CUISINES: { value: string; label: string }[] = [
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
const CATEGORIES: { value: string; label: string }[] = [
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
const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.', 'щепотка']

const schema = z.object({
  title: z.string().min(2, 'Слишком короткое название'),
  description: z.string().optional(),
  cook_time: z.coerce.number().min(1, 'Укажите время'),
  servings: z.coerce.number().min(1, 'Укажите порции'),
  cuisine: z.string().min(1, 'Выберите кухню'),
  category: z.string().min(1, 'Выберите категорию'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.string().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Название ингредиента'),
    amount: z.string().min(1, 'Количество'),
    unit: z.string().min(1, 'Единица'),
  })).min(1, 'Добавьте хотя бы один ингредиент'),
  steps: z.array(z.object({
    description: z.string().min(1, 'Описание шага'),
  })).min(1, 'Добавьте хотя бы один шаг'),
})

type FormValues = z.infer<typeof schema>

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-card-lg p-7 mt-5">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="w-6 h-6 rounded-full bg-accent-bg text-accent-dark text-[12px] font-bold flex items-center justify-center">
          {num}
        </span>
        <h2 className="font-lora font-semibold text-[20px]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export function PublishPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit') ? Number(searchParams.get('edit')) : undefined
  const { user, openAuthModal } = useAuthStore()
  const [serverError, setServerError] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const { data: existingRecipe } = useRecipe(editId)
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe(editId ?? 0)
  const uploadCover = useUploadRecipeCover(editId ?? 0)

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      cook_time: 30,
      servings: 4,
      cuisine: 'russian',
      category: 'main',
      difficulty: 'medium',
      tags: '',
      ingredients: [{ name: '', amount: '', unit: 'г' }],
      steps: [{ description: '' }],
    },
  })

  const { fields: ingFields, append: appendIng, remove: removeIng } = useFieldArray({ control, name: 'ingredients' })
  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: 'steps' })

  const difficulty = watch('difficulty')

  // Pre-fill form when editing
  useEffect(() => {
    if (existingRecipe) {
      reset({
        title: existingRecipe.title,
        description: existingRecipe.description ?? '',
        cook_time: existingRecipe.cook_time,
        servings: existingRecipe.servings,
        cuisine: existingRecipe.cuisine,
        category: existingRecipe.category,
        difficulty: existingRecipe.difficulty as 'easy' | 'medium' | 'hard',
        tags: existingRecipe.tags.join(', '),
        ingredients: existingRecipe.ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit })),
        steps: existingRecipe.steps
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ description: s.description })),
      })
    }
  }, [existingRecipe, reset])

  if (!user) {
    return (
      <div className="max-w-[780px] mx-auto px-7 py-20 text-center">
        <p className="text-text-2 mb-4">Войдите, чтобы публиковать рецепты</p>
        <button onClick={() => openAuthModal()} className="bg-accent text-white font-semibold px-6 py-3 rounded-btn-lg">
          Войти
        </button>
      </div>
    )
  }

  const onSubmit = handleSubmit(async (data) => {
    setServerError('')
    try {
      const payload = {
        title: data.title,
        description: data.description ?? '',
        cook_time: data.cook_time,
        servings: data.servings,
        cuisine: data.cuisine,
        category: data.category,
        difficulty: data.difficulty,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        ingredients: data.ingredients,
        steps: data.steps.map((s, i) => ({ order: i + 1, description: s.description })),
      }

      let recipe
      if (editId) {
        recipe = await updateRecipe.mutateAsync(payload)
      } else {
        recipe = await createRecipe.mutateAsync(payload)
      }

      // Upload cover if selected
      if (coverFile && recipe.id) {
        const form = new FormData()
        form.append('file', coverFile)
        await fetch(`/api/recipes/${recipe.id}/cover`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          body: form,
        })
      }

      navigate(`/recipes/${recipe.id}`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } } }
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setServerError(detail)
      } else if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string }
        setServerError(first?.msg ?? 'Ошибка валидации')
      } else {
        setServerError('Ошибка при публикации')
      }
    }
  })

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const inputCls = 'w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-[14.5px] text-text focus:border-accent transition-colors bg-surface'
  const labelCls = 'block text-[13px] font-semibold text-[#5C5749] mb-1.5'

  return (
    <div className="max-w-[780px] mx-auto px-7 pb-20 pt-8">
      <span className="font-mono text-[11px] tracking-[.16em] uppercase text-accent-dark">Публикация</span>
      <h1 className="font-lora font-semibold text-[38px] mt-3 mb-1">
        {editId ? 'Редактировать рецепт' : 'Новый рецепт'}
      </h1>
      <p className="text-[15px] text-text-2 mt-0">Расскажите не только что готовить, но и почему этот рецепт ваш.</p>

      <form onSubmit={onSubmit}>
        {/* Section 1 */}
        <Section num={1} title="Основная информация">
          <label className={labelCls}>Название блюда</label>
          <input {...register('title')} className={`${inputCls} mb-4`} placeholder="Например: Борщ с говядиной и пампушками" />
          {errors.title && <p className="text-terracotta text-xs mb-3 -mt-3">{errors.title.message}</p>}

          <label className={labelCls}>
            История рецепта <span className="font-normal text-text-4">— почему он важен для вас</span>
          </label>
          <textarea
            {...register('description')}
            className={`${inputCls} min-h-[96px] resize-y mb-4`}
            placeholder="Этот рецепт я готовлю с тех пор, как…"
          />

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className={labelCls}>Время приготовления (мин)</label>
              <input {...register('cook_time')} type="number" className={inputCls} placeholder="60" />
              {errors.cook_time && <p className="text-terracotta text-xs mt-1">{errors.cook_time.message}</p>}
            </div>
            <div className="flex-1">
              <label className={labelCls}>Количество порций</label>
              <input {...register('servings')} type="number" className={inputCls} placeholder="4" />
              {errors.servings && <p className="text-terracotta text-xs mt-1">{errors.servings.message}</p>}
            </div>
          </div>

          <label className={labelCls}>Главное фото</label>
          <label className="block w-full cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            <div
              className="w-full border-2 border-dashed border-accent-bg-2 rounded-card bg-[#F8F9F4] flex flex-col items-center justify-center gap-2 text-accent py-10 hover:border-accent transition-colors"
              style={{ aspectRatio: coverPreview ? undefined : '16/6' }}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Обложка" className="w-full h-48 object-cover rounded" />
              ) : (
                <>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A9576" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[13px] font-semibold">Перетащите фото или нажмите для загрузки</span>
                </>
              )}
            </div>
          </label>
        </Section>

        {/* Section 2 */}
        <Section num={2} title="Классификация">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className={labelCls}>Кухня мира</label>
              <select {...register('cuisine')} className={inputCls}>
                {CUISINES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className={labelCls}>Категория</label>
              <select {...register('category')} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <label className={labelCls}>Уровень сложности</label>
          <div className="flex gap-2 mb-4">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setValue('difficulty', d.value as 'easy' | 'medium' | 'hard')}
                className={`flex-1 border text-[13.5px] font-semibold py-2.5 rounded-[10px] cursor-pointer transition-colors ${
                  difficulty === d.value
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border-2 text-text-2 hover:border-accent'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <label className={labelCls}>Теги (через запятую)</label>
          <input
            {...register('tags')}
            className={inputCls}
            placeholder="мясное, зимнее, быстро"
          />
        </Section>

        {/* Section 3 */}
        <Section num={3} title="Ингредиенты">
          <div className="flex flex-col gap-2.5">
            {ingFields.map((field, i) => (
              <div key={field.id} className="flex gap-2.5 items-center">
                <input
                  {...register(`ingredients.${i}.name`)}
                  placeholder="Ингредиент"
                  className="flex-1 border border-border-2 rounded-[10px] px-3 py-2.5 text-[14px] focus:border-accent transition-colors"
                />
                <input
                  {...register(`ingredients.${i}.amount`)}
                  placeholder="Кол-во"
                  className="w-[90px] border border-border-2 rounded-[10px] px-3 py-2.5 text-[14px] focus:border-accent transition-colors"
                />
                <select
                  {...register(`ingredients.${i}.unit`)}
                  className="w-[96px] border border-border-2 rounded-[10px] px-2.5 py-2.5 text-[14px] bg-surface"
                >
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeIng(i)}
                  className="flex-none w-[38px] h-[40px] border border-[#E8DBD3] bg-surface rounded-[10px] cursor-pointer text-terracotta text-[18px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendIng({ name: '', amount: '', unit: 'г' })}
            className="mt-3.5 cursor-pointer bg-surface-2 border border-border-2 text-accent-dark text-[13.5px] font-semibold px-4 py-2.5 rounded-[10px] hover:border-accent transition-colors"
          >
            + Добавить ингредиент
          </button>
          {errors.ingredients && (
            <p className="text-terracotta text-xs mt-2">{errors.ingredients.message ?? 'Проверьте ингредиенты'}</p>
          )}
        </Section>

        {/* Section 4 */}
        <Section num={4} title="Шаги приготовления">
          <div className="flex flex-col gap-4">
            {stepFields.map((field, i) => (
              <div key={field.id} className="flex gap-3.5">
                <div className="flex-none w-[34px] h-[34px] rounded-full bg-accent-bg text-accent-dark font-lora font-semibold text-[15px] flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <textarea
                    {...register(`steps.${i}.description`)}
                    placeholder="Опишите шаг…"
                    className="w-full min-h-[64px] resize-y border border-border-2 rounded-[10px] px-3 py-2.5 text-[14px] focus:border-accent transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="flex-none w-[38px] h-[40px] border border-[#E8DBD3] bg-surface rounded-[10px] cursor-pointer text-terracotta text-[18px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendStep({ description: '' })}
            className="mt-3.5 cursor-pointer bg-surface-2 border border-border-2 text-accent-dark text-[13.5px] font-semibold px-4 py-2.5 rounded-[10px] hover:border-accent transition-colors"
          >
            + Добавить шаг
          </button>
          {errors.steps && (
            <p className="text-terracotta text-xs mt-2">{errors.steps.message ?? 'Проверьте шаги'}</p>
          )}
        </Section>

        {serverError && (
          <p className="text-terracotta text-sm mt-4">{serverError}</p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="cursor-pointer bg-surface border border-[#D6CFC1] text-[#5C5749] text-[14px] font-semibold px-5 py-3 rounded-btn-lg hover:bg-surface-2 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={createRecipe.isPending || updateRecipe.isPending}
            className="cursor-pointer bg-accent border-none text-white text-[14px] font-semibold px-6 py-3 rounded-btn-lg hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {createRecipe.isPending || updateRecipe.isPending
              ? 'Публикуем…'
              : editId ? 'Сохранить изменения' : 'Опубликовать рецепт'}
          </button>
        </div>
      </form>
    </div>
  )
}
