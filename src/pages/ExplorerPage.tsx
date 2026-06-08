import { useEffect, useState } from 'react'
import { Search, Copy, Check, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPublicRecipes, copyRecipeToMyLibrary, type PublicRecipe } from '../services/explorerService'
import { searchProfiles, getMyFriends, getFriendRecipes, getPendingRequests } from '../services/friendshipService'
import { RECIPE_TAG_LABELS } from '../types'
import type { RecipeTag } from '../types'
import type { Profile } from '../types/supabase'
import { useAuthStore } from '../store/authStore'

type Tab = 'recettes' | 'profils' | 'amis'

export default function ExplorerPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('recettes')
  const [recipes, setRecipes] = useState<PublicRecipe[]>([])
  const [friendRecipes, setFriendRecipes] = useState<PublicRecipe[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [pendingRequests, setPendingRequests] = useState<Profile[]>([])
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<RecipeTag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const TAGS: RecipeTag[] = ['rapide', 'elabore', 'mealprep', 'dinner', 'lunch']

  useEffect(() => {
    loadTab()
  }, [tab, query, activeTag])

  const loadTab = async () => {
    setIsLoading(true)
    if (tab === 'recettes') {
      const results = await getPublicRecipes(query || undefined, activeTag ?? undefined)
      setRecipes(results)
    } else if (tab === 'profils') {
      const results = await searchProfiles(query)
      setProfiles(results)
    } else if (tab === 'amis') {
      const [f, fr, pr] = await Promise.all([
        getMyFriends(),
        getFriendRecipes(),
        getPendingRequests(),
      ])
      setFriends(f)
      setFriendRecipes(fr as PublicRecipe[])
      setPendingRequests(pr)
    }
    setIsLoading(false)
  }

  const handleCopy = async (e: React.MouseEvent, recipe: PublicRecipe) => {
    e.stopPropagation()
    const { error } = await copyRecipeToMyLibrary(recipe.id)
    if (!error) {
      setCopied(recipe.id)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4">
          <h1 className="text-xl font-bold text-foreground">Explorer</h1>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-border -mx-4 px-4 gap-4 mb-3">
          {(['recettes', 'profils', 'amis'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setQuery('') }}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            >
              {t === 'amis' && pendingRequests.length > 0
                ? `Amis (${pendingRequests.length})`
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Barre de recherche — cachée pour l'onglet Amis */}
        {tab !== 'amis' && (
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'profils' ? 'Rechercher un profil...' : 'Rechercher une recette...'}
              className="w-full bg-secondary rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Filtres tags — seulement pour recettes */}
        {tab === 'recettes' && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() => setActiveTag(null)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!activeTag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >
              Tout
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTag === tag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                {RECIPE_TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Onglet Recettes */}
            {tab === 'recettes' && (
              recipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-4xl mb-3">🔍</span>
                  <p className="text-foreground font-medium">Aucune recette trouvée</p>
                  <p className="text-muted-foreground text-sm mt-1">Rends tes recettes publiques pour les partager</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recipes.map((recipe) => {
                    const isOwn = recipe.owner_username === user?.email?.split('@')[0]
                    const isCopied = copied === recipe.id
                    return (
                      <div
                        key={recipe.id}
                        onClick={() => navigate(`/explorer/recette/${recipe.id}`)}
                        className="bg-card rounded-2xl border border-border p-4 space-y-3 cursor-pointer active:scale-95 transition-transform"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{recipe.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              par <button onClick={(e) => { e.stopPropagation(); navigate(`/profil/${recipe.owner_username}`) }} className="text-primary hover:underline">@{recipe.owner_username}</button> · {recipe.macros.kcal} kcal · {recipe.prep_time + recipe.cook_time} min
                            </p>
                          </div>
                          {!isOwn && (
                            <button
                              onClick={(e) => handleCopy(e, recipe)}
                              disabled={isCopied}
                              className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${isCopied ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                            >
                              {isCopied ? <Check size={13} /> : <Copy size={13} />}
                              {isCopied ? 'Copié !' : 'Copier'}
                            </button>
                          )}
                        </div>
                        {recipe.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.tags.map((tag) => (
                              <span key={tag} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                                {RECIPE_TAG_LABELS[tag]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* Onglet Profils */}
            {tab === 'profils' && (
              profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-4xl mb-3">🔍</span>
                  <p className="text-foreground font-medium">Aucun profil trouvé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => navigate(`/profil/${profile.username}`)}
                      className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border active:scale-95 transition-transform text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {profile.display_name ?? profile.username}
                        </p>
                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                      </div>
                      <UserPlus size={16} className="text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )
            )}
            {/* Onglet Amis */}
            {tab === 'amis' && (
              <div className="space-y-6">
                {/* Demandes en attente */}
                {pendingRequests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Demandes reçues ({pendingRequests.length})
                    </p>
                    {pendingRequests.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => navigate(`/profil/${profile.username}`)}
                        className="w-full flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-primary">
                            {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {profile.display_name ?? profile.username}
                          </p>
                          <p className="text-xs text-primary">Veut te suivre</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Amis */}
                {friends.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Amis ({friends.length})
                    </p>
                    {friends.map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => navigate(`/profil/${friend.username}`)}
                        className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-2xl text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-primary">
                            {(friend.display_name ?? friend.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {friend.display_name ?? friend.username}
                          </p>
                          <p className="text-xs text-muted-foreground">@{friend.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recettes des amis */}
                {friendRecipes.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Recettes de tes amis
                    </p>
                    {friendRecipes.map((recipe) => {
                      const isCopied = copied === recipe.id
                      return (
                        <div
                          key={recipe.id}
                          onClick={() => navigate(`/explorer/recette/${recipe.id}`)}
                          className="bg-card rounded-2xl border border-border p-4 cursor-pointer active:scale-95 transition-transform"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">{recipe.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">{recipe.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                par <span className="text-primary">@{recipe.owner_username}</span> · {recipe.macros.kcal} kcal
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleCopy(e, recipe)}
                              disabled={isCopied}
                              className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${isCopied ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}
                            >
                              {isCopied ? <Check size={13} /> : <Copy size={13} />}
                              {isCopied ? 'Copié !' : 'Copier'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {friends.length === 0 && pendingRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-4xl mb-3">👥</span>
                    <p className="text-foreground font-medium">Pas encore d'amis</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Recherche des profils dans l'onglet "Profils"
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}