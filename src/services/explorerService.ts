import { supabase } from '../lib/supabase'
import type { Recipe } from '../types'
import type { RecipeTag } from '../types'

export interface PublicRecipe extends Recipe {
  owner_username: string
  owner_display_name: string | null
}

export async function getPublicRecipes(query?: string, tag?: RecipeTag): Promise<PublicRecipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      profiles!owner_id (
        username,
        display_name
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []

  let results = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    photo_url: row.photo_url,
    prep_time: row.prep_time,
    cook_time: row.cook_time,
    servings: row.servings,
    tags: row.tags,
    ingredients: row.ingredients,
    steps: row.steps,
    macros: row.macros,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    owner_username: row.profiles?.username ?? '',
    owner_display_name: row.profiles?.display_name ?? null,
  })) as PublicRecipe[]

  if (tag) {
    results = results.filter((r) => r.tags.includes(tag))
  }

  if (query) {
    const q = query.toLowerCase().trim()
    results = results.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    )
  }

  return results
}

export async function copyRecipeToMyLibrary(recipeId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: original, error: fetchError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single()

  if (fetchError || !original) return { error: 'Recette introuvable' }

  const { error } = await supabase.from('recipes').insert({
    id: crypto.randomUUID(),
    owner_id: user.id,
    original_id: original.id,
    name: original.name,
    emoji: original.emoji,
    photo_url: original.photo_url,
    prep_time: original.prep_time,
    cook_time: original.cook_time,
    servings: original.servings,
    tags: original.tags,
    ingredients: original.ingredients,
    steps: original.steps,
    macros: original.macros,
    notes: original.notes,
    is_public: false,
    is_system: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function toggleRecipePublic(recipeId: string, isPublic: boolean): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('recipes')
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', recipeId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  return { error: null }
}