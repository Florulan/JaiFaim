import { supabase } from '../lib/supabase'
import type { Recipe } from '../types'

export interface CourseItem {
  name: string
  quantity: number
  unit: string
  recipes: string[]
  checked: boolean
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return user.id
}

export async function generateCourseList(weekDates: string[]): Promise<CourseItem[]> {
  const userId = await getCurrentUserId()

  const { data: slots, error: slotsError } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('user_id', userId)
    .in('date', weekDates)

  if (slotsError) throw new Error(slotsError.message)
  if (!slots || slots.length === 0) return []

  const recipeIds = [
    ...new Set(
      slots
        .filter((s) => !s.is_leftover && s.recipe_id)
        .map((s) => s.recipe_id as string)
    ),
  ]

  if (recipeIds.length === 0) return []

  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', recipeIds)

  if (recipesError) throw new Error(recipesError.message)

  const recipeMap = new Map<string, Recipe>(
    (recipes ?? []).map((r) => [r.id, r as Recipe])
  )

  const itemMap = new Map<string, CourseItem>()

  for (const slot of slots) {
    if (!slot.recipe_id) continue
    const recipe = recipeMap.get(slot.recipe_id)
    if (!recipe) continue

    const servings = slot.servings_override ?? recipe.servings

    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim() + '_' + ing.unit
      const scaledQty = (ing.quantity / recipe.servings) * servings

      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!
        existing.quantity = Math.round((existing.quantity + scaledQty) * 10) / 10
        if (!existing.recipes.includes(recipe.name)) {
          existing.recipes.push(recipe.name)
        }
      } else {
        itemMap.set(key, {
          name: ing.name,
          quantity: Math.round(scaledQty * 10) / 10,
          unit: ing.unit,
          recipes: [recipe.name],
          checked: false,
        })
      }
    }
  }

  return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}