import { useEffect, useState } from 'react'
import { Search, Copy, Check } from 'lucide-react'
import { getPublicRecipes, copyRecipeToMyLibrary, type PublicRecipe } from '../services/explorerService'
import { RECIPE_TAG_LABELS } from '../types'
import type { RecipeTag } from '../types'
import { useAuthStore } from '../store/authStore'

export default function ExplorerPage() {
  const { user } = useAuthStore()
  const [recipes, setRecipes] = useState<PublicRecipe[]>([])
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<RecipeTag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    const results = await getPublicRecipes(query || undefined, activeTag ?? undefined)
    setRecipes(results)
    setIsLoading(false)
  }

  useEffect(() => { load() }, [query, activeTag])

  const handleCopy = async (recipe: PublicRecipe) => {
    const { error } = await copyRecipeToMyLibrary(recipe.id)
    if (!error) {
      setCopied(recipe.id)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const TAGS: RecipeTag[] = ['rapide', 'elabore', 'mealprep', 'dinner', 'lunch']

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4">
          <h1 className="text-xl font-bold text-foreground">Explorer</h1>
        </div>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une recette..."
            className="w-full bg-secondary rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
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
      </div>

      <div className="px-4 py-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-foreground font-medium">Aucune recette trouvée</p>
            <p className="text-muted-foreground text-sm mt-1">
              Rends tes recettes publiques pour les partager
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => {
              const isOwn = recipe.owner_username === user?.id
              const isCopied = copied === recipe.id
              return (
                <div
                  key={recipe.id}
                  className="bg-card rounded-2xl border border-border p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{recipe.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        par @{recipe.owner_username} · {recipe.macros.kcal} kcal · {recipe.prep_time + recipe.cook_time} min
                      </p>
                    </div>
                    {!isOwn && (
                      <button
                        onClick={() => handleCopy(recipe)}
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
        )}
      </div>
    </div>
  )
}