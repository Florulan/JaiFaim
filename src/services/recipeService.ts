import { supabase } from '../lib/supabase'
import type { Recipe } from '../types'

function getUserId(): string {
  const session = supabase.auth.getSession()
  // On récupère le user depuis le store auth directement via supabase
  return '' // sera remplacé par le vrai user_id ci-dessous
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return user.id
}

// Convertit une ligne Supabase en Recipe V1 (compatible avec le reste de l'app)
function rowToRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: row.id as string,
    name: row.name as string,
    emoji: row.emoji as string,
    photo_url: row.photo_url as string | null,
    prep_time: row.prep_time as number,
    cook_time: row.cook_time as number,
    servings: row.servings as number,
    tags: row.tags as Recipe['tags'],
    ingredients: row.ingredients as Recipe['ingredients'],
    steps: row.steps as string[],
    macros: row.macros as Recipe['macros'],
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('owner_id', userId)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToRecipe)
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return undefined
  return rowToRecipe(data)
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const userId = await getCurrentUserId()
  const q = query.toLowerCase().trim()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('owner_id', userId)
    .order('name')

  if (error) throw new Error(error.message)
  const recipes = (data ?? []).map(rowToRecipe)

  if (!q) return recipes

  return recipes.filter((r) => {
    const inName = r.name.toLowerCase().includes(q)
    const inIngredients = r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    return inName || inIngredients
  })
}

export async function createRecipe(recipe: Recipe): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase.from('recipes').insert({
    id: recipe.id,
    owner_id: userId,
    original_id: null,
    name: recipe.name,
    emoji: recipe.emoji,
    photo_url: recipe.photo_url,
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    servings: recipe.servings,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    macros: recipe.macros,
    notes: recipe.notes,
    is_public: false,
    is_system: false,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
  })

  if (error) throw new Error(error.message)
}

export async function updateRecipe(recipe: Recipe): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('recipes')
    .update({
      name: recipe.name,
      emoji: recipe.emoji,
      photo_url: recipe.photo_url,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      macros: recipe.macros,
      notes: recipe.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recipe.id)
    .eq('owner_id', userId)

  if (error) throw new Error(error.message)
}

export async function deleteRecipe(id: string): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId)

  if (error) throw new Error(error.message)
}