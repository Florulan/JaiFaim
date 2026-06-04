import Dexie, { type Table } from 'dexie'
import type { Recipe, MealSlot, UserProfile, LeftoverItem } from '../types'

class EpicurienDatabase extends Dexie {
  recipes!: Table<Recipe, string>
  meal_slots!: Table<MealSlot, string>
  user_profile!: Table<UserProfile, string>
  leftovers!: Table<LeftoverItem, string>

  constructor() {
    super('epicurien-db')
    this.version(1).stores({
      recipes: 'id, name, created_at, updated_at, *tags',
      meal_slots: 'id, [date+meal_type], date, recipe_id, is_suggestion',
      user_profile: 'id',
    })
    this.version(2).stores({
      recipes: 'id, name, created_at, updated_at, *tags',
      meal_slots: 'id, [date+meal_type], date, recipe_id, is_suggestion',
      user_profile: 'id',
      leftovers: 'id, recipe_id, frozen, cooked_at',
    })
  }
}

export const db = new EpicurienDatabase()

export async function initDatabase(): Promise<void> {
  const { DEFAULT_USER_PROFILE } = await import('../types')
  const { SEED_RECIPES } = await import('./seedData')

  const profile = await db.user_profile.get('local')
  if (!profile) {
    await db.user_profile.put(DEFAULT_USER_PROFILE)
  }

  const count = await db.recipes.count()
  if (count === 0) {
    await db.recipes.bulkPut(SEED_RECIPES)
  }
}