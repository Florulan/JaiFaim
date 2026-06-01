import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { getAllRecipes, searchRecipes } from '../db/recipeQueries'
import type { Recipe } from '../types'

interface RecettePickerProps {
  onSelect: (recipeId: string) => void
  onClose: () => void
}

export function RecettePicker({ onSelect, onClose }: RecettePickerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    getAllRecipes().then(setRecipes)
  }, [])

  useEffect(() => {
    if (query.trim()) {
      searchRecipes(query).then(setRecipes)
    } else {
      getAllRecipes().then(setRecipes)
    }
  }, [query])

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground">
          <X size={20} />
        </button>
        <h2 className="font-semibold text-foreground">Choisir une recette</h2>
      </div>

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
                onClick={() => onSelect(recipe.id)}
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
    </div>
  )
}