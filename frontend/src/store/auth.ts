import { create } from 'zustand'
import type { UserMe } from '../api/types'

interface AuthState {
  user: UserMe | null
  isAuthenticated: boolean
  setUser: (user: UserMe | null) => void
  setAuthenticated: (v: boolean) => void
  isAuthModalOpen: boolean
  authTab: 'login' | 'register'
  openAuthModal: (tab?: 'login' | 'register') => void
  closeAuthModal: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  setUser: (user) => set({ user }),
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  isAuthModalOpen: false,
  authTab: 'login',
  openAuthModal: (tab = 'login') => set({ isAuthModalOpen: true, authTab: tab }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
}))
