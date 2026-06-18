import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/auth'
import { useLogin, useRegister } from '../api/hooks'

const loginSchema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})
const registerSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа'),
  email: z.string().email('Неверный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export function AuthModal() {
  const { isAuthModalOpen, authTab, closeAuthModal, setUser } = useAuthStore()
  const [tab, setTab] = useState<'login' | 'register'>(authTab)
  const [serverError, setServerError] = useState('')

  const login = useLogin()
  const register = useRegister()

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const regForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  if (!isAuthModalOpen) return null

  const handleLogin = loginForm.handleSubmit(async (data) => {
    setServerError('')
    try {
      await login.mutateAsync(data)
      closeAuthModal()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setServerError(err.response?.data?.detail ?? 'Неверный логин или пароль')
    }
  })

  const handleRegister = regForm.handleSubmit(async (data) => {
    setServerError('')
    try {
      await register.mutateAsync(data)
      // Auto-login after register
      await login.mutateAsync({ username: data.username, password: data.password })
      closeAuthModal()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setServerError(err.response?.data?.detail ?? 'Ошибка регистрации')
    }
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={closeAuthModal}
    >
      <div
        className="bg-surface rounded-card-lg shadow-popup w-full max-w-sm mx-4 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 p-1 rounded-card mb-6">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setServerError('') }}
              className={`flex-1 py-2 text-sm font-semibold rounded-[8px] transition-colors ${
                tab === t ? 'bg-surface text-text shadow-sm' : 'text-text-2'
              }`}
            >
              {t === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Логин</label>
              <input
                {...loginForm.register('username')}
                className="w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-sm text-text focus:border-accent transition-colors"
                placeholder="username"
              />
              {loginForm.formState.errors.username && (
                <p className="text-terracotta text-xs mt-1">{loginForm.formState.errors.username.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Пароль</label>
              <input
                {...loginForm.register('password')}
                type="password"
                className="w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-sm text-text focus:border-accent transition-colors"
                placeholder="••••••"
              />
              {loginForm.formState.errors.password && (
                <p className="text-terracotta text-xs mt-1">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            {serverError && <p className="text-terracotta text-sm">{serverError}</p>}
            <button
              type="submit"
              disabled={login.isPending}
              className="bg-accent text-white font-semibold py-3 rounded-btn-lg text-sm hover:bg-accent-dark transition-colors disabled:opacity-60"
            >
              {login.isPending ? 'Входим…' : 'Войти'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Имя пользователя</label>
              <input
                {...regForm.register('username')}
                className="w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-sm text-text focus:border-accent transition-colors"
                placeholder="username"
              />
              {regForm.formState.errors.username && (
                <p className="text-terracotta text-xs mt-1">{regForm.formState.errors.username.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Email</label>
              <input
                {...regForm.register('email')}
                type="email"
                className="w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-sm text-text focus:border-accent transition-colors"
                placeholder="you@example.com"
              />
              {regForm.formState.errors.email && (
                <p className="text-terracotta text-xs mt-1">{regForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Пароль</label>
              <input
                {...regForm.register('password')}
                type="password"
                className="w-full border border-border-2 rounded-[10px] px-3.5 py-3 text-sm text-text focus:border-accent transition-colors"
                placeholder="минимум 6 символов"
              />
              {regForm.formState.errors.password && (
                <p className="text-terracotta text-xs mt-1">{regForm.formState.errors.password.message}</p>
              )}
            </div>
            {serverError && <p className="text-terracotta text-sm">{serverError}</p>}
            <button
              type="submit"
              disabled={register.isPending || login.isPending}
              className="bg-accent text-white font-semibold py-3 rounded-btn-lg text-sm hover:bg-accent-dark transition-colors disabled:opacity-60"
            >
              {register.isPending || login.isPending ? 'Создаём…' : 'Создать аккаунт'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
