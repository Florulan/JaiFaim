import { supabase } from '../lib/supabase'
import type { MealSlot } from '../types'

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return user.id
}

function rowToSlot(row: Record<string, unknown>): MealSlot {
  return {
    id: row.id as string,
    date: row.date as string,
    meal_type: row.meal_type as 'lunch' | 'dinner',
    recipe_id: row.recipe_id as string | null,
    servings_override: row.servings_override as number | null,
    is_suggestion: row.is_suggestion as boolean,
    is_leftover: row.is_leftover as boolean,
    is_frozen: row.is_frozen as boolean,
    validated_at: row.validated_at as string | null,
    created_at: row.created_at as string,
  }
}

export async function getSlotsForWeek(dates: string[]): Promise<MealSlot[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('user_id', userId)
    .in('date', dates)

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToSlot)
}

export async function getSlot(
  date: string,
  mealType: 'lunch' | 'dinner'
): Promise<MealSlot | undefined> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('meal_type', mealType)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? rowToSlot(data) : undefined
}

export async function upsertSlot(slot: MealSlot): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase.from('meal_slots').upsert(
    {
      id: slot.id,
      user_id: userId,
      date: slot.date,
      meal_type: slot.meal_type,
      recipe_id: slot.recipe_id,
      servings_override: slot.servings_override,
      is_suggestion: slot.is_suggestion,
      is_leftover: slot.is_leftover,
      is_frozen: slot.is_frozen,
      validated_at: slot.validated_at,
      created_at: slot.created_at,
    },
    { onConflict: 'user_id,date,meal_type' }
  )

  if (error) throw new Error(error.message)
}

export async function clearSlot(
  date: string,
  mealType: 'lunch' | 'dinner'
): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('meal_slots')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)
    .eq('meal_type', mealType)

  if (error) throw new Error(error.message)
}

export async function getSlotsWithRecipe(recipeId: string): Promise<MealSlot[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToSlot)
}