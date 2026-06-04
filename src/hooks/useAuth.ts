import { useAuthStore } from '../store/authStore'

// Façade légère — les composants importent ce hook, jamais le store directement
export function useAuth() {
  const { user, session, profile, isLoading, signIn, signUp, signOut } = useAuthStore()
  return { user, session, profile, isLoading, signIn, signUp, signOut }
}