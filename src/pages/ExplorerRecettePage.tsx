import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { copyRecipeToMyLibrary } from '../services/explorerService'
import { useAuthStore } from '../store/authStore'
import { RECIPE_TAG_LABELS, UNIT_LABELS, MACRO_CONFIDENCE_LABELS } from '../types'
import type { Recipe } from '../types'

interface PublicRecipeWithOwner extends Recipe {
  owner_username: string
  owner_display_name: string | null
}

export default function ExplorerRecettePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [recipe, setRecipe] = useState<PublicRecipeWithOwner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`*, profiles!owner_id (username, display_name)`)
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (error || !data) { setIsLoading(false); return }

      setRecipe({
        id: data.id,
        name: data.name,
        emoji: data.emoji,
        photo_url: data.photo_url,
        prep_time: data.prep_time,
        cook_time: data.cook_time,
        servings: data.servings,
        tags: data.tags,
        ingredients: data.ingredients,
        steps: data.steps,
        macros: data.macros,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
        owner_username: data.profiles?.username ?? '',
        owner_display_name: data.profiles?.display_name ?? null,
      })
      setIsLoading(false)
    }
    load()
  }, [id])

  const handleCopy = async () => {
    if (!recipe) return
    setIsCopying(true)
    const { error } = await copyRecipeToMyLibrary(recipe.id)
    if (!error) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    setIsCopying(false)
  }

  const isOwn = recipe?.owner_username && user?.email?.startsWith(recipe.owner_username)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Recette introuvable</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm">Retour</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3 flex items-center justify-between pt-safe">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        {!isOwn && (
          <button
            onClick={handleCopy}
            disabled={isCopying || copied}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${copied ? 'bg-primary/10 text-primary' : 'bg-primary text-primary-foreground'}`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copié !' : 'Copier la recette'}
          </button>
        )}
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
          <p className="text-xs text-muted-foreground mb-1">
            par @{recipe.owner_username}
          </p>
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