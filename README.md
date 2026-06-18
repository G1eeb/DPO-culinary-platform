# Со вкусом — кулинарная платформа

Социальная сеть для публикации и обмена рецептами.

**Стек:** FastAPI · SQLAlchemy 2.0 · PostgreSQL · React 18 · TypeScript · Tailwind CSS · Docker

---

## Быстрый старт

```bash
# 1. Скопируйте конфигурацию и при необходимости смените SECRET_KEY и пароли
cp .env.example .env

# 2. Сборка фронтенда (первый раз и после изменений в frontend/)
docker compose --profile build run --rm frontend

# 3. Запуск всех сервисов
docker compose up -d --build
```

Приложение будет доступно на **http://localhost**  
Swagger UI: **http://localhost/api/docs**

```bash
# Остановка
docker compose down
```

---

## Тестовые аккаунты

Создаются автоматически при первом запуске через `backend/seed.py`.

> **Только для локальной разработки.** Перед деплоем смените пароли в `.env`.

| Логин | Пароль | Роль |
|---|---|---|
| `admin` | `changeme123` | Администратор |
| `chef_marina` | `marina123` | Пользователь |
| `foodie_alex` | `alex1234` | Пользователь |
| `baker_kate` | `kate1234` | Пользователь |

---

## Структура проекта

```
backend/
  app/
    models/     SQLAlchemy-модели (User, Recipe, Comment, Rating, …)
    routers/    FastAPI-роутеры (auth, recipes, comments, ratings, …)
    schemas/    Pydantic-схемы
    services/   Бизнес-логика
  alembic/      Миграции БД
  seed.py       Тестовые данные
  entrypoint.sh Точка входа: миграции → seed → uvicorn

frontend/
  src/
    api/        Axios-клиент и TanStack Query хуки
    components/ Переиспользуемые компоненты (Navbar, RecipeCard, …)
    pages/      Страницы (Feed, RecipeDetail, Profile, Publish, Search, …)
    store/      Zustand (состояние аутентификации)

nginx/          Конфигурация reverse proxy
media/          Загружаемые файлы (аватары, обложки) — не в репо
```

---

## Переменные окружения

Файл `.env` создаётся из `.env.example`:

| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `POSTGRES_DB` | `culinary` | Имя базы данных |
| `POSTGRES_USER` | `culinary` | Пользователь БД |
| `POSTGRES_PASSWORD` | `culinary_secret` | Пароль БД |
| `SECRET_KEY` | `your-super-secret-key-change-in-production` | JWT-секрет (**обязательно сменить**) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `43200` | Срок жизни токена (30 дней) |
| `ADMIN_USERNAME` | `admin` | Логин администратора |
| `ADMIN_EMAIL` | `admin@example.com` | Email администратора |
| `ADMIN_PASSWORD` | `changeme123` | Пароль администратора |
