import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAdminUsers, useAdminDeleteUser, useAdminSetRole } from '../api/hooks'
import { Avatar } from '../components/Avatar'
import type { UserAdmin } from '../api/types'

type Tab = 'users'

export function AdminPage() {
  const navigate = useNavigate()
  const { user: me } = useAuthStore()
  const [tab] = useState<Tab>('users')
  const [confirmDelete, setConfirmDelete] = useState<UserAdmin | null>(null)

  const { data: users, isLoading } = useAdminUsers()
  const deleteUser = useAdminDeleteUser()
  const setRole = useAdminSetRole()

  // Только для администраторов
  if (!me || me.role !== 'admin') {
    return (
      <div className="max-w-[1120px] mx-auto px-7 py-20 text-center text-text-3">
        Доступ запрещён
      </div>
    )
  }

  const handleToggleRole = (user: UserAdmin) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    setRole.mutate({ userId: user.id, role: newRole })
  }

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return
    deleteUser.mutate(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <div className="max-w-[1120px] mx-auto px-7 py-10">
      <h1 className="font-lora font-semibold text-[32px] mb-8">Админ-панель</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8">
        <button
          className={`text-[14.5px] font-semibold px-4 py-2.5 border-b-2 transition-colors ${
            tab === 'users' ? 'text-accent border-accent' : 'text-text-2 border-transparent'
          }`}
        >
          Пользователи
          {users && (
            <span className="ml-2 font-mono text-[11px] bg-surface-2 px-1.5 py-0.5 rounded-badge text-text-3">
              {users.length}
            </span>
          )}
        </button>
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-2 rounded-card" />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-4 py-3 text-text-3 font-semibold text-[12px] uppercase tracking-wide">
                  Пользователь
                </th>
                <th className="text-left px-4 py-3 text-text-3 font-semibold text-[12px] uppercase tracking-wide hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-text-3 font-semibold text-[12px] uppercase tracking-wide">
                  Роль
                </th>
                <th className="text-left px-4 py-3 text-text-3 font-semibold text-[12px] uppercase tracking-wide hidden sm:table-cell">
                  Регистрация
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/profile/${u.id}`)}
                      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                    >
                      <Avatar avatarUrl={u.avatar_url} username={u.username} size={32} />
                      <span className="font-semibold text-text">{u.username}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-2 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-badge text-[11px] font-semibold font-mono uppercase ${
                        u.role === 'admin'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-surface-2 text-text-3'
                      }`}
                    >
                      {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-3 text-xs hidden sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me.id && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={setRole.isPending}
                          title={u.role === 'admin' ? 'Снять права администратора' : 'Сделать администратором'}
                          className="text-xs font-semibold px-2.5 py-1 border border-border-2 rounded-btn text-text-2 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                        >
                          {u.role === 'admin' ? '↓ Разжаловать' : '↑ Назначить админом'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          title="Удалить пользователя"
                          className="text-xs font-semibold px-2.5 py-1 border border-border-2 rounded-btn text-text-2 hover:border-terracotta hover:text-terracotta transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-surface rounded-card-lg shadow-popup w-full max-w-sm mx-4 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-lora font-semibold text-[22px] mb-3">Удалить пользователя?</h2>
            <p className="text-text-2 text-sm mb-6">
              Аккаунт <span className="font-semibold text-text">@{confirmDelete.username}</span> и все его
              рецепты будут удалены безвозвратно.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-border-2 rounded-btn-lg py-3 text-sm font-semibold text-text-2 hover:bg-surface-2 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteUser.isPending}
                className="flex-1 bg-terracotta text-white rounded-btn-lg py-3 text-sm font-semibold hover:bg-terracotta/90 transition-colors disabled:opacity-60"
              >
                {deleteUser.isPending ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
