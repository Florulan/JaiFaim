import Dexie, { type Table } from 'dexie'
import type { Recipe, MealSlot, UserProfile } from '../types'

// ============================================================
// Base de données Dexie — Épicurien Sportif
// 3 tables : recipes, meal_slots, user_profile
// ============================================================

class EpicurienDatabase extends Dexie {
  recipes!: Table<Recipe, string>
  meal_slots!: Table<MealSlot, string>
  user_profile!: Table<UserProfile, string>

  constructor() {
    super('epicurien-db')

    this.version(1).stores({
      // Index primaire + index de recherche
      recipes: 'id, name, created_at, updated_at, *tags',
      // Index composé pour la contrainte (date + meal_type)
      meal_slots: 'id, [date+meal_type], date, recipe_id, is_suggestion',
      // Clé primaire fixe 'local'
      user_profile: 'id',
    })
  }
}

export const db = new EpicurienDatabase()

// ─── Initialisation du profil par défaut ─────────────────────
// Appelée au démarrage de l'app — idempotente
export async function initDatabase(): Promise<void> {
  const profile = await db.user_profile.get('local')
  if (!profile) {
    const { DEFAULT_USER_PROFILE } = await import('../types')
    await db.user_profile.put(DEFAULT_USER_PROFILE)
  }
}
