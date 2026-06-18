import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '../store/auth'
import type {
  UserMe,
  UserProfile,
  UserAdmin,
  RecipeCard,
  RecipeDetail,
  RecipeListResponse,
  CommentOut,
  RatingOut,
  NotificationOut,
  LoginResponse,
  RecipeCreatePayload,
} from './types'

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const FAV_IDS_LS_KEY = 'fav_ids_cache'

function loadFavIds(): number[] | undefined {
  try {
    const raw = localStorage.getItem(FAV_IDS_LS_KEY)
    return raw ? (JSON.parse(raw) as number[]) : undefined
  } catch { return undefined }
}

function saveFavIds(ids: number[]) {
  try { localStorage.setItem(FAV_IDS_LS_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { username: string; email: string; password: string }) => {
      await apiClient.post('/auth/register', data)
    },
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const form = new URLSearchParams()
      form.append('username', data.username)
      form.append('password', data.password)
      const res = await apiClient.post<LoginResponse>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      return res.data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token)
      useAuthStore.getState().setAuthenticated(true)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem(FAV_IDS_LS_KEY)
    useAuthStore.getState().setAuthenticated(false)
    useAuthStore.getState().setUser(null)
    qc.clear()
  }
}

// ─── Me ──────────────────────────────────────────────────────────────────────

export function useMe(options?: Partial<UseQueryOptions<UserMe>>) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery<UserMe>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<UserMe>('/users/me')
      return res.data
    },
    enabled: isAuthenticated,
    retry: false,
    ...options,
  })
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { username?: string; bio?: string }) => {
      const res = await apiClient.patch<UserMe>('/users/me', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      await apiClient.post('/users/me/avatar', form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useUploadCover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      await apiClient.post('/users/me/cover', form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function useUserProfile(userId: number | undefined) {
  return useQuery<UserProfile>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await apiClient.get<UserProfile>(`/users/${userId}`)
      return res.data
    },
    enabled: !!userId,
  })
}

// ─── Recipes ─────────────────────────────────────────────────────────────────

export function useRecipes(params: {
  q?: string
  cuisine?: string
  category?: string
  difficulty?: string
  cook_time_max?: number
  tag?: string
  author_id?: number
  sort?: string
  page?: number
  size?: number
}) {
  return useQuery<RecipeListResponse>({
    queryKey: ['recipes', params],
    queryFn: async () => {
      const res = await apiClient.get<RecipeListResponse>('/recipes', {
        params: Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
        ),
      })
      return res.data
    },
  })
}

export function useRecipe(id: number | undefined) {
  return useQuery<RecipeDetail>({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const res = await apiClient.get<RecipeDetail>(`/recipes/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: RecipeCreatePayload) => {
      const res = await apiClient.post<RecipeDetail>('/recipes', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useUpdateRecipe(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<RecipeCreatePayload>) => {
      const res = await apiClient.patch<RecipeDetail>(`/recipes/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipe', id] })
      qc.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useDeleteRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/recipes/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useUploadRecipeCover(recipeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      await apiClient.post(`/recipes/${recipeId}/cover`, form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipe', recipeId] }),
  })
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export function useFeed(page = 1) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery<RecipeListResponse>({
    queryKey: ['feed', page],
    queryFn: async () => {
      const res = await apiClient.get<RecipeListResponse>('/feed', { params: { page, size: 20 } })
      return res.data
    },
    enabled: isAuthenticated,
  })
}

// ─── Comments ────────────────────────────────────────────────────────────────

export function useComments(recipeId: number | undefined) {
  return useQuery<CommentOut[]>({
    queryKey: ['comments', recipeId],
    queryFn: async () => {
      const res = await apiClient.get<CommentOut[]>(`/comments/${recipeId}`)
      return res.data
    },
    enabled: !!recipeId,
  })
}

export function usePostComment(recipeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { text: string; parent_id?: number }) => {
      await apiClient.post(`/comments/${recipeId}`, data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', recipeId] }),
  })
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export function useRating(recipeId: number | undefined) {
  return useQuery<RatingOut>({
    queryKey: ['rating', recipeId],
    queryFn: async () => {
      const res = await apiClient.get<RatingOut>(`/ratings/${recipeId}`)
      return res.data
    },
    enabled: !!recipeId,
  })
}

export function useRateRecipe(recipeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (score: number) => {
      await apiClient.post(`/ratings/${recipeId}`, { score })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rating', recipeId] })
      qc.invalidateQueries({ queryKey: ['recipe', recipeId] })
    },
  })
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export function useFavorites(page = 1) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery<RecipeListResponse>({
    queryKey: ['favorites', page],
    queryFn: async () => {
      const res = await apiClient.get<RecipeListResponse>('/favorites', { params: { page, size: 20 } })
      return res.data
    },
    enabled: isAuthenticated,
  })
}

export function useFavoriteIds() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery<number[]>({
    queryKey: ['favorite-ids'],
    queryFn: async () => {
      const res = await apiClient.get<RecipeListResponse>('/favorites', { params: { page: 1, size: 500 } })
      const ids = res.data.items.map((r) => r.id)
      saveFavIds(ids)
      return ids
    },
    // Мгновенно отдаём данные из localStorage, пока идёт запрос к серверу
    initialData: loadFavIds,
    initialDataUpdatedAt: 0,  // помечаем как устаревшие → фоновый рефетч всё равно будет
    enabled: isAuthenticated,
  })
}

export function useToggleFavorite(recipeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (isFavorited: boolean) => {
      if (isFavorited) {
        await apiClient.delete(`/favorites/${recipeId}`)
      } else {
        await apiClient.post(`/favorites/${recipeId}`)
      }
    },
    onSuccess: (_data, isFavorited) => {
      // Обновляем кеш напрямую — без нового запроса, без гонок при навигации
      qc.setQueryData<number[]>(['favorite-ids'], (old = []) => {
        const next = isFavorited
          ? old.filter((id) => id !== recipeId)
          : [...old, recipeId]
        saveFavIds(next)  // сохраняем в localStorage сразу
        return next
      })
      qc.invalidateQueries({ queryKey: ['recipe', recipeId] })
      qc.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

// ─── Follows ─────────────────────────────────────────────────────────────────

export function useFollowToggle(userId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (isFollowing) {
        await apiClient.delete(`/follows/${userId}`)
      } else {
        await apiClient.post(`/follows/${userId}`)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', userId] })
      qc.invalidateQueries({ queryKey: ['followers', userId] })
      qc.invalidateQueries({ queryKey: ['following'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useFollowers(userId: number | undefined) {
  return useQuery<{ id: number; follower: { id: number; username: string; avatar_url: string | null }; created_at: string }[]>({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const res = await apiClient.get(`/follows/${userId}/followers`)
      return res.data
    },
    enabled: !!userId,
  })
}

export function useFollowing(userId: number | undefined) {
  return useQuery<{ id: number; following: { id: number; username: string; avatar_url: string | null }; created_at: string }[]>({
    queryKey: ['following', userId],
    queryFn: async () => {
      const res = await apiClient.get(`/follows/${userId}/following`)
      return res.data
    },
    enabled: !!userId,
  })
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery<NotificationOut[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get<NotificationOut[]>('/notifications')
      return res.data
    },
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery<UserAdmin[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get<UserAdmin[]>('/admin/users?size=200')
      return res.data
    },
  })
}

export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/admin/users/${userId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminSetRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: 'user' | 'admin' }) => {
      await apiClient.patch(`/admin/users/${userId}/role?role=${role}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminDeleteRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recipeId: number) => {
      await apiClient.delete(`/admin/recipes/${recipeId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
