import type { Macros, MacrosTarget, RecipeTag, Ingredient } from './index'

// ─── Profil V2 ───────────────────────────────────────────────
export interface Profile {
  id: string                        // UUID Supabase Auth
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  macros_target: MacrosTarget
  no_repeat_days: number
  week_start: 'monday' | 'sunday'
  planning_session_day: 'saturday' | 'sunday'
  cuisine_prefs: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

// ─── Recette V2 ──────────────────────────────────────────────
export interface RecipeV2 {
  id: string
  owner_id: string
  original_id: string | null
  name: string
  emoji: string
  photo_url: string | null
  prep_time: number
  cook_time: number
  servings: number
  tags: RecipeTag[]
  ingredients: Ingredient[]
  steps: string[]
  macros: Macros
  notes: string | null
  is_public: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}

// ─── MealSlot V2 ─────────────────────────────────────────────
export interface MealSlotV2 {
  id: string
  user_id: string
  date: string
  meal_type: 'lunch' | 'dinner'
  recipe_id: string | null
  servings_override: number | null
  is_suggestion: boolean
  is_leftover: boolean
  is_frozen: boolean
  validated_at: string | null
  created_at: string
}

// ─── Leftover V2 ─────────────────────────────────────────────
export interface LeftoverV2 {
  id: string
  user_id: string
  recipe_id: string
  portions: number
  cooked_at: string
  expires_at: string | null
  frozen: boolean
  notes: string | null
  created_at: string
}