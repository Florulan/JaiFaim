import { supabase } from '../lib/supabase'
import type { Profile } from '../types/supabase'

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!query.trim()) return []

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${query.trim()}%`)
    .eq('is_public', true)
    .neq('id', user?.id ?? '')
    .limit(20)

  if (error) return []
  return (data ?? []) as Profile[]
}

export async function getFriendshipStatus(otherUserId: string): Promise<FriendshipStatus> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'none'

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`)
    .maybeSingle()

  if (error || !data) return 'none'

  if (data.status === 'accepted') return 'accepted'
  if (data.requester_id === user.id) return 'pending_sent'
  return 'pending_received'
}

export async function sendFriendRequest(addresseeId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: 'pending',
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function acceptFriendRequest(requesterId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('requester_id', requesterId)
    .eq('addressee_id', user.id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function removeFriend(otherUserId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`)

  if (error) return { error: error.message }
  return { error: null }
}

export async function getMyFriends(): Promise<Profile[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      requester:profiles!requester_id(id, username, display_name, avatar_url, is_public),
      addressee:profiles!addressee_id(id, username, display_name, avatar_url, is_public)
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (error) return []

  return (data ?? []).map((f) => {
    return f.requester_id === user.id ? f.addressee : f.requester
  }) as Profile[]
}

export async function getPendingRequests(): Promise<Profile[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('friendships')
    .select(`requester:profiles!requester_id(*)`)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  if (error) return []
  return (data ?? []).map((f) => f.requester) as unknown as Profile[]
}

export async function getFriendRecipes() {
  const friends = await getMyFriends()
  if (friends.length === 0) return []

  const friendIds = friends.map((f) => f.id)

  const { data, error } = await supabase
    .from('recipes')
    .select(`*, profiles!owner_id(username, display_name)`)
    .in('owner_id', friendIds)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return (data ?? []).map((row) => ({
    ...row,
    owner_username: row.profiles?.username ?? '',
    owner_display_name: row.profiles?.display_name ?? null,
  }))
}