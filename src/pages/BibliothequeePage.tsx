import { useEffect, useState } from 'react'
import { Plus, Search, X, Sparkles } from 'lucide-react'
import { useRecipeStore } from '../store/recipeStore'
import { RecetteCard } from '../components/RecetteCard'
import { RecetteForm } from '../components/RecetteForm'
import { AISaisieDrawer } from '../components/AISaisieDrawer'
import { RECIPE_TAGS, RECIPE_TAG_LABELS, type RecipeTag } from '../types'
import type { Recipe } from '../types'
import { SkeletonRecipeCard } from '../components/SkeletonCard'

type RecipeFormData = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>

export default function BibliothequeePage() {
  const { recipes, isLoading, searchQuery, activeTag, loadRecipes, addRecipe, setSearchQuery, setActiveTag } = useRecipeStore()
  const [showForm, setShowForm] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadRecipes()
  }, [])

  const handleAddRecipe = async (data: RecipeFormData) => {
    setIsSubmitting(true)
    const now = new Date().toISOString()
    await addRecipe({
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    })
    setIsSubmitting(false)
    setShowForm(false)
    setShowAI(false)
  }

  if (showAI) {
    return (
      <AISaisieDrawer
        onClose={() => setShowAI(false)}
        onSave={handleAddRecipe}
      />
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setShowForm(false)} className="p-2 -ml-2 text-muted-foreground">
            <X size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Nouvelle recette</h1>
        </div>
        <div className="px-4 pt-4">
          <RecetteForm
            onSubmit={handleAddRecipe}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe">
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Mes recettes</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAI(true)}
              className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-2xl text-sm font-semibold"
            >
              <Sparkles size={15} /> IA
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-2xl text-sm font-semibold"
            >
              <Plus size={15} /> Manuel
            </button>
          </div>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou ingredient..."
            className="w-full bg-secondary rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-muted-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3">
          <button
            onClick={() => setActiveTag(null)}
            className={"flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors " +
              (activeTag === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border')}
          >
            Toutes
          </button>
          {RECIPE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag as RecipeTag)}
              className={"flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors " +
                (activeTag === tag
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border')}
            >
              {RECIPE_TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4,5,6].map((i) => <SkeletonRecipeCard key={i} />)}
            </div>
          ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-foreground font-medium">Aucune recette trouvee</p>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery || activeTag ? "Essaie d'autres filtres" : 'Ajoute ta premiere recette !'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe) => (
              <RecetteCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}