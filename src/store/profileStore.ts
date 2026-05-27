// Store Zustand — Profil utilisateur
// Sera implémenté en Phase 3
import { create } from 'zustand'
import type { UserProfile } from '../types'
import { DEFAULT_USER_PROFILE } from '../types'

interface ProfileStore {
  profile: UserProfile
}

export const useProfileStore = create<ProfileStore>(() => ({
  profile: DEFAULT_USER_PROFILE,
}))
