import type { Recipe } from '../types'
import { getAllRecipes } from '../db/recipeQueries'
import { getSlotsForWeek } from '../db/planningQueries'

export interface SlotSelection {
  date: string
  mealType: 'lunch' | 'dinner'
}

export interface PlanningRequest {
  weekStart: Date
  selectedSlots: SlotSelection[]
  imposedRecipes: { slotKey: string; recipeId: string }[]
  noRepeatDays: number
}

export interface GeneratedSlot {
  date: string
  mealType: 'lunch' | 'dinner'
  recipeId: string
  recipe: Recipe
}

function slotKey(date: string, mealType: 'lunch' | 'dinner'): string {
  return date + '_' + mealType
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + 'T12:00:00').getDay()
  return day === 0 || day === 6
}

function scoreRecipe(
  recipe: Recipe,
  date: string,
  remainingKcal: number,
  usedRecipeIds: Set<string>,
  recentRecipeIds: Set<string>
): number {
  let score = 100

  // Penalite si deja utilise cette semaine
  if (usedRecipeIds.has(recipe.id)) score -= 80

  // Penalite si utilise recemment
  if (recentRecipeIds.has(recipe.id)) score -= 40

  // Bonus tag week-end / semaine
  const weekend = isWeekend(date)
  if (weekend && recipe.tags.includes('elabore')) score += 20
  if (!weekend && recipe.tags.includes('rapide')) score += 20
  if (!weekend && recipe.tags.includes('elabore')) score -= 10

  // Bonus si les macros correspondent aux calories restantes
  const diff = Math.abs(recipe.macros.kcal - remainingKcal)
  if (diff < 100) score += 15
  else if (diff < 200) score += 8

  // Bonus mealprep
  if (recipe.tags.includes('mealprep')) score += 5

  // Legerete aleatoire pour eviter toujours le meme ordre
  score += Math.random() * 10

  return score
}

export async function generatePlanning(request: PlanningRequest): Promise<GeneratedSlot[]> {
  const { weekStart, selectedSlots, imposedRecipes, noRepeatDays } = request
  const allRecipes = await getAllRecipes()

  if (allRecipes.length === 0) return []

  // Recuperer l'historique recent pour eviter les repetitions
  const pastDates: string[] = []
  for (let i = 1; i <= noRepeatDays; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - i)
    pastDates.push(d.toISOString().slice(0, 10))
  }
  const pastSlots = await getSlotsForWeek(pastDates)
  const recentRecipeIds = new Set(pastSlots.map((s) => s.recipe_id).filter(Boolean) as string[])

  // Construire la map des recettes imposees
  const imposedMap = new Map<string, string>()
  imposedRecipes.forEach(({ slotKey: key, recipeId }) => imposedMap.set(key, recipeId))

  const result: GeneratedSlot[] = []
  const usedRecipeIds = new Set<string>()
  const dailyKcal = 2200 // valeur par defaut, sera remplace par le profil

  // Placer d'abord les recettes imposees
  for (const slot of selectedSlots) {
    const key = slotKey(slot.date, slot.mealType)
    const imposedId = imposedMap.get(key)
    if (imposedId) {
      const recipe = allRecipes.find((r) => r.id === imposedId)
      if (recipe) {
        result.push({ date: slot.date, mealType: slot.mealType, recipeId: recipe.id, recipe })
        usedRecipeIds.add(recipe.id)
      }
    }
  }

  // Remplir les slots restants
  for (const slot of selectedSlots) {
    const key = slotKey(slot.date, slot.mealType)
    if (imposedMap.has(key)) continue

    // Calculer les kcal deja planifiees ce jour
    const daySlots = result.filter((s) => s.date === slot.date)
    const usedKcal = daySlots.reduce((sum, s) => sum + s.recipe.macros.kcal, 0)
    const remainingKcal = dailyKcal - usedKcal

    // Scorer et trier les recettes disponibles
    const scored = allRecipes
      .map((recipe) => ({
        recipe,
        score: scoreRecipe(recipe, slot.date, remainingKcal, usedRecipeIds, recentRecipeIds),
      }))
      .sort((a, b) => b.score - a.score)

    const best = scored[0]?.recipe
    if (best) {
      result.push({ date: slot.date, mealType: slot.mealType, recipeId: best.id, recipe: best })
      usedRecipeIds.add(best.id)
    }
  }

  return result
}