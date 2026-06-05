import { supabase } from '../lib/supabase'
import type { Profile } from '../types/supabase'

export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data as Profile
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error) return null
  return data as Profile
}

export async function updateMyProfile(updates: Partial<Pick<Profile, 'display_name' | 'bio' | 'is_public'>>): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function getPublicRecipesByUser(userId: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getMyRecipesCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  return count ?? 0
}

export async function getMyPublicRecipesCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('is_public', true)

  return count ?? 0
}