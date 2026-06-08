import { useEffect, useState } from 'react'
import { Camera, Check, X, Snowflake, Plus, Trash2, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { updateMyProfile, getMyRecipesCount, getMyPublicRecipesCount } from '../services/profileService'
import { getAllLeftovers, deleteLeftover, updateLeftover } from '../services/leftoverService'
import { getRecipeById } from '../services/recipeService'
import type { LeftoverItem, Recipe } from '../types'

interface LeftoverWithRecipe {
  leftover: LeftoverItem
  recipe: Recipe | null
}

export default function MonProfilPage() {
  const { profile, loadProfile } = useAuthStore()
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [publicRecipes, setPublicRecipes] = useState(0)

  const [stocks, setStocks] = useState<LeftoverWithRecipe[]>([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setBio(profile.bio ?? '')
      setIsPublic(profile.is_public)
    }
    getMyRecipesCount().then(setTotalRecipes)
    getMyPublicRecipesCount().then(setPublicRecipes)
    loadStocks()
  }, [profile])

  const loadStocks = async () => {
    setIsLoadingStocks(true)
    const leftovers = await getAllLeftovers()
    const withRecipes = await Promise.all(
      leftovers.map(async (l) => ({
        leftover: l,
        recipe: await getRecipeById(l.recipe_id) ?? null,
      }))
    )
    setStocks(withRecipes)
    setIsLoadingStocks(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet élément ?')) return
    await deleteLeftover(id)
    await loadStocks()
  }

  const handleAddPortion = async (item: LeftoverItem) => {
    await updateLeftover({ ...item, portions: item.portions + 1 })
    await loadStocks()
  }

  const handleRemovePortion = async (item: LeftoverItem) => {
    if (item.portions <= 1) {
      await handleDelete(item.id)
    } else {
      await updateLeftover({ ...item, portions: item.portions - 1 })
      await loadStocks()
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await updateMyProfile({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      is_public: isPublic,
    })
    if (!error) {
      await loadProfile()
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  if (!profile) return null

  const frozen = stocks.filter((i) => i.leftover.frozen)
  const fresh = stocks.filter((i) => !i.leftover.frozen)

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Mon profil</h1>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 text-muted-foreground">
                  <X size={18} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary px-3 py-1.5"
                >
                  <Check size={16} />
                  {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-primary">
                  Modifier
                </button>
                <button onClick={() => navigate('/parametres')} className="p-2 text-muted-foreground">
                  <Settings size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
              </span>
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                <Camera size={14} className="text-primary-foreground" />
              </button>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-lg">
              {profile.display_name ?? profile.username}
            </p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalRecipes}</p>
            <p className="text-xs text-muted-foreground mt-1">Recettes</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{publicRecipes}</p>
            <p className="text-xs text-muted-foreground mt-1">Publiques</p>
          </div>
        </div>

        {/* Édition / infos */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Nom affiché</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profile.username}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Épicurien sportif, amateur de bonne cuisine..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Profil public</p>
                <p className="text-xs text-muted-foreground">Visible dans l'Explorer</p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.bio && (
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <p className="text-sm text-foreground">{profile.bio}</p>
              </div>
            )}
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-sm text-muted-foreground">Profil</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${profile.is_public ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {profile.is_public ? 'Public' : 'Privé'}
              </span>
            </div>
          </div>
        )}

        {/* Stocks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Snowflake size={16} className="text-blue-400" />
            <h2 className="font-semibold text-foreground">Stocks</h2>
            {stocks.length > 0 && (
              <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                {stocks.length}
              </span>
            )}
          </div>

          {isLoadingStocks ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stocks.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">Aucun stock</p>
              <p className="text-xs text-muted-foreground mt-1">
                Utilise "J'ai cuisiné ça" sur une recette pour tracker tes restes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {frozen.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Snowflake size={12} className="text-blue-400" /> Congélateur ({frozen.length})
                  </p>
                  {frozen.map(({ leftover, recipe }) => (
                    <div key={leftover.id} className="bg-card rounded-2xl border border-blue-200 p-3 flex items-center gap-3">
                      <span className="text-2xl">{recipe?.emoji ?? '🥡'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{recipe?.name ?? 'Recette inconnue'}</p>
                        <p className="text-xs text-muted-foreground">Congelé</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRemovePortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg leading-none">−</button>
                        <span className="text-sm font-bold text-foreground w-4 text-center">{leftover.portions}</span>
                        <button onClick={() => handleAddPortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => handleDelete(leftover.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {fresh.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Restes frais ({fresh.length})</p>
                  {fresh.map(({ leftover, recipe }) => {
                    const expiresAt = leftover.expires_at ? new Date(leftover.expires_at) : null
                    const isExpired = expiresAt ? expiresAt < new Date() : false
                    return (
                      <div key={leftover.id} className={`bg-card rounded-2xl border p-3 flex items-center gap-3 ${isExpired ? 'border-destructive/50' : 'border-border'}`}>
                        <span className="text-2xl">{recipe?.emoji ?? '🥡'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{recipe?.name ?? 'Recette inconnue'}</p>
                          {expiresAt && (
                            <p className={`text-xs ${isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {isExpired ? 'Expiré !' : 'Expire le ' + expiresAt.toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleRemovePortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg leading-none">−</button>
                          <span className="text-sm font-bold text-foreground w-4 text-center">{leftover.portions}</span>
                          <button onClick={() => handleAddPortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                            <Plus size={14} />
                          </button>
                          <button onClick={() => handleDelete(leftover.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}