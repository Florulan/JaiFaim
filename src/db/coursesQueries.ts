import { db } from './database'
import type { Recipe } from '../types'

export interface CourseItem {
  name: string
  quantity: number
  unit: string
  recipes: string[]
  checked: boolean
}

export async function generateCourseList(weekDates: string[]): Promise<CourseItem[]> {
  const slots = await db.meal_slots
    .where('date')
    .anyOf(weekDates)
    .toArray()

  const recipeIds = [...new Set(slots.map((s) => s.recipe_id).filter(Boolean) as string[])]
  if (recipeIds.length === 0) return []

  const recipes = await db.recipes.where('id').anyOf(recipeIds).toArray()
  const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]))

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