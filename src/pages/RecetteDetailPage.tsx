import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Pencil, Trash2, X, Globe, Lock } from 'lucide-react'
import { getRecipeById } from '../services/recipeService'
import { toggleRecipePublic } from '../services/explorerService'
import { supabase } from '../lib/supabase'
import { CuisineDrawer } from '../components/CuisineDrawer'
import { useRecipeStore } from '../store/recipeStore'
import { RecetteForm } from '../components/RecetteForm'
import { RECIPE_TAG_LABELS, UNIT_LABELS, MACRO_CONFIDENCE_LABELS } from '../types'
import type { Recipe } from '../types'

type RecipeFormData = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>

export default function RecetteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateRecipe, deleteRecipe } = useRecipeStore()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCuisine, setShowCuisine] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [isTogglingPublic, setIsTogglingPublic] = useState(false)

  useEffect(() => {
    if (!id) return
    getRecipeById(id).then((r) => {
      setRecipe(r ?? null)
      if (r) {
        supabase
          .from('recipes')
          .select('is_public')
          .eq('id', r.id)
          .single()
          .then(({ data }) => { if (data) setIsPublic(data.is_public) })
      }
    })
  }, [id])

  const handleTogglePublic = async () => {
    if (!recipe) return
    setIsTogglingPublic(true)
    const newValue = !isPublic
    const { error } = await toggleRecipePublic(recipe.id, newValue)
    if (!error) setIsPublic(newValue)
    setIsTogglingPublic(false)
  }

  const handleUpdate = async (data: RecipeFormData) => {
    if (!recipe) return
    const updated: Recipe = { ...recipe, ...data, updated_at: new Date().toISOString() }
    await updateRecipe(updated)
    setRecipe(updated)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!recipe) return
    if (!window.confirm(`Supprimer "${recipe.name}" ?`)) return
    setIsDeleting(true)
    await deleteRecipe(recipe.id)
    navigate('/')
  }

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setIsEditing(false)} className="p-2 -ml-2 text-muted-foreground">
            <X size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Modifier la recette</h1>
        </div>
        <div className="px-4 pt-4">
          <RecetteForm
            initial={recipe}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {showCuisine && (
        <CuisineDrawer recipe={recipe} onClose={() => setShowCuisine(false)} />
      )}

      <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3 flex items-center justify-between pt-safe">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCuisine(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-accent-foreground px-3 py-1.5 rounded-xl"
          >
            👨‍🍳 J'ai cuisiné ça
          </button>
          <button
            onClick={handleTogglePublic}
            disabled={isTogglingPublic}
            className="p-2 text-muted-foreground hover:text-foreground"
            title={isPublic ? 'Rendre privée' : 'Rendre publique'}
          >
            {isPublic ? <Globe size={18} className="text-primary" /> : <Lock size={18} />}
          </button>
          <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:text-foreground">
            <Pencil size={18} />
          </button>
          <button onClick={handleDelete} disabled={isDeleting} className="p-2 text-muted-foreground hover:text-destructive">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="h-48 bg-secondary flex items-center justify-center overflow-hidden">
        {recipe.photo_url ? (
          <img src={recipe.photo_url} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">{recipe.emoji}</span>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{recipe.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {recipe.prep_time + recipe.cook_time} min
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {recipe.servings} portion{recipe.servings > 1 ? 's' : ''}
            </span>
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                  {RECIPE_TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">Macros par portion</h2>
            <span className="text-xs text-muted-foreground">{MACRO_CONFIDENCE_LABELS[recipe.macros.confidence]}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Kcal', value: recipe.macros.kcal, unit: '' },
              { label: 'Prot', value: recipe.macros.p, unit: 'g' },
              { label: 'Gluc', value: recipe.macros.g, unit: 'g' },
              { label: 'Lip', value: recipe.macros.l, unit: 'g' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-secondary rounded-xl py-2">
                <p className="text-lg font-bold text-foreground">
                  {value}<span className="text-xs font-normal">{unit}</span>
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Ingrédients</h2>
          <div className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground capitalize">
                  {ing.name}
                  {ing.note && <span className="text-muted-foreground"> — {ing.note}</span>}
                </span>
                <span className="text-sm font-medium text-foreground whitespace-nowrap ml-2">
                  {ing.quantity} {UNIT_LABELS[ing.unit]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Préparation</h2>
          <div className="space-y-4">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {recipe.notes && (
          <div className="bg-secondary rounded-2xl p-4">
            <h2 className="font-semibold text-foreground text-sm mb-1">Notes</h2>
            <p className="text-sm text-muted-foreground">{recipe.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}