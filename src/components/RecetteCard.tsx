import { Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Recipe } from '../types'
import { RECIPE_TAG_LABELS } from '../types'
import { cn } from '../lib/utils'

interface RecetteCardProps {
  recipe: Recipe
  className?: string
}

export function RecetteCard({ recipe, className }: RecetteCardProps) {
  const navigate = useNavigate()
  const totalTime = recipe.prep_time + recipe.cook_time

  return (
    <button
      onClick={() => navigate(`/recette/${recipe.id}`)}
      className={cn(
        'bg-card rounded-2xl shadow-sm border border-border text-left w-full overflow-hidden',
        'active:scale-95 transition-transform duration-100',
        className
      )}
    >
      <div className="h-32 bg-secondary rounded-t-2xl flex items-center justify-center overflow-hidden">
        {recipe.photo_url ? (
          <img
            src={recipe.photo_url}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{recipe.emoji}</span>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
          {recipe.name}
        </h3>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {totalTime} min
          </span>
          <span className="font-medium text-foreground">
            {recipe.macros.kcal} kcal
          </span>
          <span>{recipe.macros.p}g prot</span>
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
              >
                {RECIPE_TAG_LABELS[tag]}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}