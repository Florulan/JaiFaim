import { db } from './database'
import type { Recipe } from '../types'

export async function getAllRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy('name').toArray()
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const q = query.toLowerCase().trim()
  if (!q) return getAllRecipes()

  const all = await db.recipes.toArray()
  return all.filter((r) => {
    const inName = r.name.toLowerCase().includes(q)
    const inIngredients = r.ingredients.some((i) =>
      i.name.toLowerCase().includes(q)
    )
    return inName || inIngredients
  })
}

export async function createRecipe(recipe: Recipe): Promise<void> {
  await db.recipes.add(recipe)
}

export async function updateRecipe(recipe: Recipe): Promise<void> {
  await db.recipes.put(recipe)
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
}