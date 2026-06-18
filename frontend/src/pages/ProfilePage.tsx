import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useUserProfile, useRecipes, useFollowToggle, useFollowers, useFollowing, useUpdateMe, useUploadAvatar, useUploadCover, useFavoriteIds } from '../api/hooks'
import { RecipeCard } from '../components/RecipeCard'
import { Avatar } from '../components/Avatar'

type Tab = 'recipes' | 'followers' | 'following'

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user: me } = useAuthStore()
  const updateMe = useUpdateMe()
  const uploadAvatar = useUploadAvatar()
  const uploadCover = useUploadCover()
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(me?.username ?? '')
  const [bio, setBio] = useState(me?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateMe.mutateAsync({ username: username.trim() || undefined, bio: bio.trim() || undefined })
      onClose()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } } }
      const d = err.response?.data?.detail
      setError(typeof d === 'string' ? d : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadAvatar.mutateAsync(file)
  }

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadCover.mutateAsync(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-card-lg shadow-popup w-full max-w-md mx-4 p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-lora font-semibold text-[24px] mb-6">Редактировать профиль</h2>

        {/* Avatar upload */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar avatarUrl={me?.avatar_url ?? null} username={me?.username ?? ''} size={64} />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="text-sm font-semibold text-accent hover:text-accent-dark transition-colors disabled:opacity-50"
            >
              {uploadAvatar.isPending ? 'Загружаем…' : 'Изменить фото профиля'}
            </button>
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              disabled={uploadCover.isPending}
              className="text-sm font-semibold text-text-2 hover:text-text transition-colors disabled:opacity-50"
            >
              {uploadCover.isPending ? 'Загружаем…' : 'Изменить обложку'}
            </button>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-text-2 mb-1.5">Имя пользователя</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-sm text-text focus:border-accent transition-colors"
          />
        </div>

        {/* Bio */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-2 mb-1.5">О себе</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Расскажите о себе…"
            className="w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-sm text-text focus:border-accent transition-colors resize-none"
          />
        </div>

        {error && <p className="text-terracotta text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-border-2 rounded-btn-lg py-3 text-sm font-semibold text-text-2 hover:bg-surface-2 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-accent text-white rounded-btn-lg py-3 text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UnfollowButton({ userId }: { userId: number }) {
  const toggle = useFollowToggle(userId)
  return (
    <button
      onClick={() => toggle.mutate(true)}
      disabled={toggle.isPending}
      className="text-xs font-semibold px-3 py-1.5 border border-border-2 rounded-btn text-text-2 hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50"
    >
      {toggle.isPending ? '…' : 'Отписаться'}
    </button>
  )
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const navigate = useNavigate()
  const { user: me } = useAuthStore()
  const [tab, setTab] = useState<Tab>('recipes')
  const [amFollowing, setAmFollowing] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId)
  const { data: recipes, isLoading: recipesLoading } = useRecipes({ author_id: userId, sort: 'created_at' })
  const { data: followers } = useFollowers(userId)
  const { data: following } = useFollowing(userId)
  const { data: favoriteIds } = useFavoriteIds()
  const followToggle = useFollowToggle(userId)

  // Синхронизируем локальный стейт с данными с сервера
  useEffect(() => {
    if (followers !== undefined) {
      setAmFollowing(followers.some((f) => f.follower?.id === me?.id))
    }
  }, [followers, me?.id])

  const isMe = me?.id === userId

  if (profileLoading) return (
    <div className="max-w-[1120px] mx-auto px-7 py-10 animate-pulse">
      <div className="h-[230px] bg-surface-2 rounded-card-lg mb-8" />
    </div>
  )

  if (!profile) return (
    <div className="max-w-[1120px] mx-auto px-7 py-20 text-center text-text-3">
      Профиль не найден
    </div>
  )

  const handleFollow = () => {
    if (!me) return
    setAmFollowing(!amFollowing)  // оптимистичное обновление
    followToggle.mutate(amFollowing)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'recipes', label: 'Рецепты' },
    { key: 'followers', label: 'Подписчики' },
    { key: 'following', label: 'Подписки' },
  ]

  return (
    <div className="max-w-[1120px] mx-auto px-7 pb-20">
      {/* Cover */}
      <div className="relative w-full h-[230px] rounded-card-lg overflow-hidden bg-surface-3 mt-6">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Обложка" className="w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(135deg, transparent 0, transparent 13px, rgba(95,107,82,0.1) 13px, rgba(95,107,82,0.1) 26px)',
            }}
          />
        )}
      </div>

      {/* Avatar + info */}
      <div className="flex items-end gap-5 mt-[-46px] px-2 relative">
        <div
          className="flex-none w-[120px] h-[120px] rounded-full border-[5px] border-bg overflow-hidden"
          style={{ background: '#A98E6B' }}
        >
          <Avatar avatarUrl={profile.avatar_url} username={profile.username} size={110} className="border-0" />
        </div>
        <div className="flex-1 pb-2">
          <h1 className="font-lora font-semibold text-[34px] mb-1">{profile.username}</h1>
          {profile.bio && (
            <p className="text-[15px] text-text-2 max-w-[560px] leading-relaxed">{profile.bio}</p>
          )}
        </div>
        {isMe ? (
          <button
            onClick={() => setEditOpen(true)}
            className="mb-2 cursor-pointer text-[14px] font-semibold px-5 py-2.5 rounded-btn-lg border border-border-2 text-text-2 hover:bg-surface-2 transition-colors"
          >
            Редактировать профиль
          </button>
        ) : me && (
          <button
            onClick={handleFollow}
            className={`mb-2 cursor-pointer text-[14px] font-semibold px-5 py-2.5 rounded-btn-lg border transition-colors ${
              amFollowing
                ? 'bg-surface border-border-2 text-text-2 hover:border-terracotta hover:text-terracotta'
                : 'bg-accent border-accent text-white hover:bg-accent-dark'
            }`}
          >
            {amFollowing ? 'Отписаться' : 'Подписаться'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-10 mt-7 px-2">
        <div>
          <div className="font-lora text-[26px] font-semibold">{profile.recipes_count}</div>
          <div className="text-[12.5px] text-text-3">рецептов</div>
        </div>
        <div>
          <div className="font-lora text-[26px] font-semibold">{profile.followers_count}</div>
          <div className="text-[12.5px] text-text-3">подписчиков</div>
        </div>
        <div>
          <div className="font-lora text-[26px] font-semibold">{profile.following_count}</div>
          <div className="text-[12.5px] text-text-3">подписок</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mt-7 mb-7">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-none bg-none cursor-pointer text-[14.5px] font-semibold px-4 py-2.5 border-b-2 transition-colors ${
              tab === t.key
                ? 'text-accent border-accent'
                : 'text-text-2 border-transparent hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'recipes' && (
        <>
          {recipesLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-2 rounded-card aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-6">
              {recipes?.items.map((r) => (
                <RecipeCard key={r.id} recipe={r} isFavorited={favoriteIds?.includes(r.id) ?? false} isAdmin={me?.role === 'admin'} />
              ))}
            </div>
          )}
          {recipes?.items.length === 0 && (
            <p className="text-center py-16 text-text-3">
              {isMe ? 'Вы ещё не опубликовали ни одного рецепта' : 'Нет рецептов'}
            </p>
          )}
        </>
      )}

      {tab === 'followers' && (
        <div className="flex flex-col gap-3 max-w-lg">
          {!followers?.length && <p className="text-text-3 text-center py-12">Нет подписчиков</p>}
          {followers?.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-card border border-border hover:bg-surface-2 transition-colors">
              <button
                onClick={() => navigate(`/profile/${f.follower?.id}`)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <Avatar avatarUrl={f.follower?.avatar_url ?? null} username={f.follower?.username ?? '?'} size={44} />
                <span className="font-semibold text-sm">{f.follower?.username}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'following' && (
        <div className="flex flex-col gap-3 max-w-lg">
          {!following?.length && <p className="text-text-3 text-center py-12">Нет подписок</p>}
          {following?.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-card border border-border hover:bg-surface-2 transition-colors">
              <button
                onClick={() => navigate(`/profile/${f.following?.id}`)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <Avatar avatarUrl={f.following?.avatar_url ?? null} username={f.following?.username ?? '?'} size={44} />
                <span className="font-semibold text-sm">{f.following?.username}</span>
              </button>
              {isMe && f.following?.id && (
                <UnfollowButton userId={f.following.id} />
              )}
            </div>
          ))}
        </div>
      )}

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
    </div>
  )
}
