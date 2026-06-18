export type UserRole = 'user' | 'admin'

export interface UserPublic {
  id: number
  username: string
  avatar_url: string | null
  created_at: string
}

export interface UserProfile extends UserPublic {
  bio: string | null
  cover_url: string | null
  recipes_count: number
  followers_count: number
  following_count: number
}

export interface UserMe extends UserProfile {
  email: string
  role: UserRole
}

export interface UserAdmin extends UserPublic {
  email: string
  role: UserRole
}

export interface RecipeCard {
  id: number
  title: string
  cover_url: string | null
  cook_time: number
  servings: number
  cuisine: string
  category: string
  difficulty: string
  author: UserPublic
  avg_rating: number | null
  ratings_count: number
  created_at: string
}

export interface Ingredient {
  id: number
  name: string
  amount: string
  unit: string
}

export interface Step {
  id: number
  order: number
  description: string
  photo_url: string | null
}

export interface Tag {
  id: number
  name: string
}

export interface RecipeDetail extends RecipeCard {
  description: string | null
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
  is_favorited: boolean
}

export interface RecipeListResponse {
  items: RecipeCard[]
  total: number
  page: number
  size: number
}

export interface CommentOut {
  id: number
  text: string
  parent_id: number | null
  created_at: string
  user: UserPublic
  replies: CommentOut[]
}

export interface RatingOut {
  avg: number | null
  count: number
  user_score: number | null
}

export interface NotificationOut {
  id: number
  type: 'like' | 'comment' | 'follow' | 'reply'
  is_read: boolean
  created_at: string
  from_user: UserPublic | null
  recipe_id: number | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

// Form types
export interface IngredientIn {
  name: string
  amount: string
  unit: string
}

export interface StepIn {
  order: number
  description: string
}

export interface RecipeCreatePayload {
  title: string
  description: string
  cook_time: number
  servings: number
  cuisine: string
  category: string
  difficulty: string
  tags: string[]
  ingredients: IngredientIn[]
  steps: StepIn[]
}
