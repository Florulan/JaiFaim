// ============================================================
// Types — Épicurien Sportif
// Source de vérité : VISION.md §5
// ============================================================

// ─── Unités ──────────────────────────────────────────────────
export type Unit =
  | 'g' | 'kg'
  | 'ml' | 'cl' | 'l'
  | 'cas' | 'cac'
  | 'piece' | 'tranche' | 'filet' | 'botte' | 'pincee'

// ─── Tags recette ────────────────────────────────────────────
export type RecipeTag =
  // Existants
  | 'rapide' | 'elabore' | 'mealprep' | 'dinner' | 'lunch'
  // Style
  | 'festif' | 'healthy' | 'sport' | 'streetfood'
  // Cuisine du monde — Europe
  | 'francais' | 'italien' | 'espagnol' | 'grec'
  // Cuisine du monde — Asie
  | 'japonais' | 'chinois' | 'vietnamien' | 'coreen' | 'thai' | 'indien'
  // Cuisine du monde — Reste du monde
  | 'mexicain' | 'americain' | 'libanais' | 'marocain'
  // Régimes
  | 'vegetarien' | 'pescatarien'

// ─── Ingrédient structuré ────────────────────────────────────
export interface Ingredient {
  name: string       // normalisé en minuscules — ex: "poulet", "ail"
  quantity: number   // toujours un nombre — jamais "2-3"
  unit: Unit
  note: string | null // précision qualitative — ex: "émincé", "râpé"
}

// ─── Macros (estimations IA) ─────────────────────────────────
// ⚠️ Toujours afficher le champ `confidence` dans l'UI
export interface Macros {
  kcal: number
  p: number     // protéines (g)
  g: number     // glucides (g)
  l: number     // lipides (g)
  confidence: 'low' | 'medium' | 'high'
}

// ─── Recette ─────────────────────────────────────────────────
export interface Recipe {
  id: string                // UUID v4 — crypto.randomUUID()
  name: string
  emoji: string
  photo_url: string | null  // blob: en V1, URL cloud en V2
  prep_time: number         // minutes
  cook_time: number         // minutes
  servings: number          // les macros sont TOUJOURS par portion
  tags: RecipeTag[]
  ingredients: Ingredient[]
  steps: string[]           // ordonné — index = numéro d'étape
  macros: Macros
  notes: string | null
  created_at: string        // ISO 8601
  updated_at: string        // ISO 8601 — indispensable pour sync V2
}

// ─── Slot repas ───────────────────────────────────────────────
// Contrainte : un seul slot par (date + meal_type) — enforcer côté app
export interface MealSlot {
  id: string
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

// ─── Profil utilisateur ──────────────────────────────────────
export interface UserProfile {
  id: 'local'                                  // toujours 'local' en V1
  macros_target: Omit<Macros, 'confidence'>    // objectifs quotidiens
  no_repeat_days: number                       // défaut: 10
  week_start: 'monday' | 'sunday'             // défaut: 'monday'
  planning_session_day: 'saturday' | 'sunday'
  cuisine_prefs: string[]                      // injecté dans le prompt de suggestion
  updated_at: string                           // ISO 8601
}

// ─── Helpers de type ─────────────────────────────────────────
export type MacrosTarget = Omit<Macros, 'confidence'>

export const RECIPE_TAGS: RecipeTag[] = [
  'rapide', 'elabore', 'mealprep', 'dinner', 'lunch',
  'festif', 'healthy', 'sport', 'streetfood',
  'francais', 'italien', 'espagnol', 'grec',
  'japonais', 'chinois', 'vietnamien', 'coreen', 'thai', 'indien',
  'mexicain', 'americain', 'libanais', 'marocain',
  'vegetarien', 'pescatarien',
]

export const RECIPE_TAG_LABELS: Record<RecipeTag, string> = {
  rapide: '⚡ Rapide',
  elabore: '👨‍🍳 Élaboré',
  mealprep: '📦 Meal prep',
  dinner: '🌙 Dîner',
  lunch: '☀️ Déjeuner',
  festif: '🎉 Festif',
  healthy: '🥗 Healthy',
  sport: '💪 Sport',
  streetfood: '🥡 Street food',
  francais: '🇫🇷 Français',
  italien: '🇮🇹 Italien',
  espagnol: '🇪🇸 Espagnol',
  grec: '🇬🇷 Grec',
  japonais: '🇯🇵 Japonais',
  chinois: '🇨🇳 Chinois',
  vietnamien: '🇻🇳 Vietnamien',
  coreen: '🇰🇷 Coréen',
  thai: '🇹🇭 Thaï',
  indien: '🇮🇳 Indien',
  mexicain: '🇲🇽 Mexicain',
  americain: '🇺🇸 Américain',
  libanais: '🇱🇧 Libanais',
  marocain: '🇲🇦 Marocain',
  vegetarien: '🌱 Végétarien',
  pescatarien: '🐟 Pescatarien',
}

export const UNIT_LABELS: Record<Unit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  cl: 'cl',
  l: 'l',
  cas: 'c. à s.',
  cac: 'c. à c.',
  piece: 'pièce(s)',
  tranche: 'tranche(s)',
  filet: 'filet(s)',
  botte: 'botte(s)',
  pincee: 'pincée(s)',
}

export const MACRO_CONFIDENCE_LABELS: Record<Macros['confidence'], string> = {
  low: '⚠️ Estimation approximative',
  medium: '〜 Estimation correcte',
  high: '✓ Estimation fiable',
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'local',
  macros_target: { kcal: 2200, p: 160, g: 220, l: 75 },
  no_repeat_days: 10,
  week_start: 'monday',
  planning_session_day: 'saturday',
  cuisine_prefs: [],
  updated_at: new Date().toISOString(),
}

// ─── Restes / Leftovers ──────────────────────────────────────
export interface LeftoverItem {
  id: string
  recipe_id: string
  portions: number              // nombre de portions restantes
  cooked_at: string             // ISO 8601 — date de cuisson
  expires_at: string | null     // null = pas de date limite
  frozen: boolean               // true = au congélateur
  notes: string | null
  created_at: string
}