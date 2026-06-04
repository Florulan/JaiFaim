import { useState, useEffect } from 'react'
import { Search, X, Snowflake } from 'lucide-react'
import { getAllRecipes, searchRecipes } from '../db/recipeQueries'
import { getAllLeftovers } from '../db/leftoverQueries'
import type { Recipe, LeftoverItem } from '../types'

interface RecettePickerProps {
  onSelect: (recipeId: string, isLeftover?: boolean, leftoverId?: string) => void
  onClose: () => void
}

interface LeftoverWithRecipe {
  leftover: LeftoverItem
  recipe: Recipe | null
}

export function RecettePicker({ onSelect, onClose }: RecettePickerProps) {
  const [tab, setTab] = useState<'recettes' | 'stocks'>('recettes')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [leftovers, setLeftovers] = useState<LeftoverWithRecipe[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    getAllRecipes().then(setRecipes)
    loadLeftovers()
  }, [])

  const loadLeftovers = async () => {
    const all = await getAllLeftovers()
    const withRecipes = await Promise.all(
      all.map(async (l) => {
        const { getRecipeById } = await import('../db/recipeQueries')
        return { leftover: l, recipe: await getRecipeById(l.recipe_id) ?? null }
      })
    )
    setLeftovers(withRecipes)
  }

  useEffect(() => {
    if (tab === 'recettes') {
      if (query.trim()) {
        searchRecipes(query).then(setRecipes)
      } else {
        getAllRecipes().then(setRecipes)
      }
    }
  }, [query, tab])

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground">
          <X size={20} />
        </button>
        <h2 className="font-semibold text-foreground">Choisir un repas</h2>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-border px-4">
        <button
          onClick={() => setTab('recettes')}
          className={"flex-1 py-3 text-sm font-medium border-b-2 transition-colors " + (tab === 'recettes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          Recettes
        </button>
        <button
          onClick={() => setTab('stocks')}
          className={"flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 " + (tab === 'stocks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          <Snowflake size={14} />
          Stocks {leftovers.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{leftovers.length}</span>}
        </button>
      </div>

      {tab === 'recettes' && (
        <>
          <div className="px-4 py-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher..."
                autoFocus
                className="w-full bg-secondary rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">🍽️</span>
                <p className="text-muted-foreground text-sm">Aucune recette trouvee</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => onSelect(recipe.id, false)}
                    className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border active:scale-95 transition-transform text-left"
                  >
                    <span className="text-3xl">{recipe.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {recipe.macros.kcal} kcal · {recipe.macros.p}g prot · {recipe.prep_time + recipe.cook_time} min
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'stocks' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
          {leftovers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Snowflake size={40} className="text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Aucun stock disponible</p>
              <p className="text-xs text-muted-foreground mt-1">Utilise "J'ai cuisine ca" pour tracker tes restes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leftovers.map(({ leftover, recipe }) => (
                <button
                  key={leftover.id}
                  onClick={() => onSelect(recipe?.id ?? '', true, leftover.id)}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border active:scale-95 transition-transform text-left"
                >
                  <span className="text-3xl">{leftover.frozen ? '❄️' : '🥡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{recipe?.name ?? 'Recette inconnue'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {leftover.portions} portion{leftover.portions > 1 ? 's' : ''} · {leftover.frozen ? 'Congele' : 'Reste frais'}
                      {leftover.expires_at && !leftover.frozen && (
                        ' · expire le ' + new Date(leftover.expires_at).toLocaleDateString('fr-FR')
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}