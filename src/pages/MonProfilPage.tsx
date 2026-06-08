import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, UserCheck, UserX, Clock } from 'lucide-react'
import { getProfileByUsername, getPublicRecipesByUser } from '../services/profileService'
import { getFriendshipStatus, sendFriendRequest, acceptFriendRequest, removeFriend, type FriendshipStatus } from '../services/friendshipService'
import type { Profile } from '../types/supabase'
import type { Recipe } from '../types'

export default function ProfilPage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!username) return
    const load = async () => {
      const p = await getProfileByUsername(username)
      setProfile(p)
      if (p) {
        const [r, fs] = await Promise.all([
          getPublicRecipesByUser(p.id),
          getFriendshipStatus(p.id),
        ])
        setRecipes(r as Recipe[])
        setFriendshipStatus(fs)
      }
      setIsLoading(false)
    }
    load()
  }, [username])

  const handleFriendAction = async () => {
    if (!profile) return
    setIsUpdating(true)

    if (friendshipStatus === 'none') {
      await sendFriendRequest(profile.id)
      setFriendshipStatus('pending_sent')
    } else if (friendshipStatus === 'pending_received') {
      await acceptFriendRequest(profile.id)
      setFriendshipStatus('accepted')
    } else if (friendshipStatus === 'accepted' || friendshipStatus === 'pending_sent') {
      await removeFriend(profile.id)
      setFriendshipStatus('none')
    }

    setIsUpdating(false)
  }

  const friendButtonConfig = {
    none: { label: 'Suivre', icon: UserPlus, className: 'bg-primary text-primary-foreground' },
    pending_sent: { label: 'Demande envoyée', icon: Clock, className: 'bg-secondary text-muted-foreground' },
    pending_received: { label: 'Accepter', icon: UserCheck, className: 'bg-primary text-primary-foreground' },
    accepted: { label: 'Ami ✓', icon: UserX, className: 'bg-secondary text-foreground' },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Profil introuvable</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm">Retour</button>
      </div>
    )
  }

  const btn = friendButtonConfig[friendshipStatus]
  const BtnIcon = btn.icon

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-foreground">@{profile.username}</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-lg">
              {profile.display_name ?? profile.username}
            </p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">{profile.bio}</p>
            )}
          </div>

          <button
            onClick={handleFriendAction}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${btn.className}`}
          >
            <BtnIcon size={15} />
            {btn.label}
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{recipes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Recettes publiques</p>
        </div>

        <div>
          <h2 className="font-semibold text-foreground mb-3">Recettes</h2>
          {recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune recette publique</p>
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => navigate(`/explorer/recette/${recipe.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border active:scale-95 transition-transform text-left"
                >
                  <span className="text-3xl">{recipe.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{recipe.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {recipe.macros.kcal} kcal · {recipe.prep_time + recipe.cook_time} min
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}