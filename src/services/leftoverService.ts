import { supabase } from '../lib/supabase'
import type { LeftoverItem } from '../types'

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return user.id
}

function rowToLeftover(row: Record<string, unknown>): LeftoverItem {
  return {
    id: row.id as string,
    recipe_id: row.recipe_id as string,
    portions: row.portions as number,
    cooked_at: row.cooked_at as string,
    expires_at: row.expires_at as string | null,
    frozen: row.frozen as boolean,
    notes: row.notes as string | null,
    created_at: row.created_at as string,
  }
}

export async function getActiveLefotovers(): Promise<LeftoverItem[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leftovers')
    .select('*')
    .eq('user_id', userId)
    .eq('frozen', false)

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToLeftover)
}

export async function getFrozenLeftovers(): Promise<LeftoverItem[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leftovers')
    .select('*')
    .eq('user_id', userId)
    .eq('frozen', true)

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToLeftover)
}

export async function getAllLeftovers(): Promise<LeftoverItem[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leftovers')
    .select('*')
    .eq('user_id', userId)
    .order('cooked_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToLeftover)
}

export async function createLeftover(item: LeftoverItem): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase.from('leftovers').insert({
    id: item.id,
    user_id: userId,
    recipe_id: item.recipe_id,
    portions: item.portions,
    cooked_at: item.cooked_at,
    expires_at: item.expires_at,
    frozen: item.frozen,
    notes: item.notes,
    created_at: item.created_at,
  })

  if (error) throw new Error(error.message)
}

export async function updateLeftover(item: LeftoverItem): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('leftovers')
    .update({
      portions: item.portions,
      expires_at: item.expires_at,
      frozen: item.frozen,
      notes: item.notes,
    })
    .eq('id', item.id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function deleteLeftover(id: string): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('leftovers')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function consumeLeftoverPortion(id: string): Promise<void> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leftovers')
    .select('portions')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw new Error(error.message)

  if (data.portions <= 1) {
    await deleteLeftover(id)
  } else {
    const { error: updateError } = await supabase
      .from('leftovers')
      .update({ portions: data.portions - 1 })
      .eq('id', id)
      .eq('user_id', userId)

    if (updateError) throw new Error(updateError.message)
  }
}