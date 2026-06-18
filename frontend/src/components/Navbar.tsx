import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useLogout, useNotifications, useMarkAllRead } from '../api/hooks'
import { Avatar } from './Avatar'

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function Navbar() {
  const navigate = useNavigate()
  const { user, openAuthModal } = useAuthStore()
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const { data: notifications } = useNotifications()
  const markAllRead = useMarkAllRead()
  const unread = notifications?.filter((n) => !n.is_read).length ?? 0

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifOpen = () => {
    setNotifOpen((v) => !v)
    if (unread > 0) markAllRead.mutate()
  }

  const notifTypeLabel: Record<string, string> = {
    like: 'оценил ваш рецепт',
    comment: 'прокомментировал рецепт',
    reply: 'ответил на комментарий',
    follow: 'подписался на вас',
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border h-[68px] flex items-center">
      <div className="max-w-[1200px] mx-auto w-full px-7 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-lora font-semibold text-[22px] text-text no-underline">
          Со вкусом
        </Link>

        {/* Center search */}
        <form
          className="hidden md:flex items-center gap-2 bg-surface-2 border border-border rounded-[11px] px-3.5 py-2 w-72"
          onSubmit={(e) => {
            e.preventDefault()
            const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
            if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9486" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            name="q"
            placeholder="Найти рецепт…"
            className="bg-transparent flex-1 text-sm text-text placeholder:text-text-3 border-none outline-none"
          />
        </form>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/publish"
                className="hidden sm:flex items-center gap-1.5 bg-accent text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-accent-dark transition-colors no-underline"
              >
                + Рецепт
              </Link>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleNotifOpen}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-2 transition-colors"
                >
                  <BellIcon />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-terracotta rounded-full" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-card shadow-popup z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <span className="font-semibold text-sm">Уведомления</span>
                      {unread > 0 && (
                        <span className="font-mono text-[10px] text-accent bg-accent-bg px-2 py-0.5 rounded-badge">
                          {unread} новых
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!notifications?.length && (
                        <p className="text-sm text-text-3 text-center py-8">Нет уведомлений</p>
                      )}
                      {notifications?.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-border last:border-0 ${!n.is_read ? 'bg-accent-bg/40' : ''}`}
                        >
                          <p className="text-sm">
                            <span className="font-semibold">{n.from_user?.username ?? 'Кто-то'}</span>{' '}
                            {notifTypeLabel[n.type] ?? n.type}
                          </p>
                          <p className="text-xs text-text-3 mt-0.5">
                            {new Date(n.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)}>
                  <Avatar avatarUrl={user.avatar_url} username={user.username} size={36} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-card shadow-popup z-50 overflow-hidden text-sm">
                    <Link
                      to={`/profile/${user.id}`}
                      className="block px-4 py-3 text-text hover:bg-surface-2 no-underline"
                      onClick={() => setMenuOpen(false)}
                    >
                      Мой профиль
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-4 py-3 text-text hover:bg-surface-2 no-underline"
                      onClick={() => setMenuOpen(false)}
                    >
                      Избранное
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-3 text-text hover:bg-surface-2 no-underline"
                        onClick={() => setMenuOpen(false)}
                      >
                        Админ-панель
                      </Link>
                    )}
                    <div className="border-t border-border" />
                    <button
                      onClick={() => { logout(); setMenuOpen(false); navigate('/') }}
                      className="w-full text-left px-4 py-3 text-terracotta hover:bg-surface-2 transition-colors"
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('login')}
                className="text-sm font-semibold text-text-2 hover:text-text transition-colors"
              >
                Войти
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-accent-dark transition-colors"
              >
                Регистрация
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
