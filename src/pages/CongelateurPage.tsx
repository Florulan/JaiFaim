import { useEffect, useState } from 'react'
import { Snowflake, Trash2, Plus } from 'lucide-react'
import { getAllLeftovers, deleteLeftover, updateLeftover } from '../services/leftoverService'
import { getRecipeById } from '../services/recipeService'
import type { LeftoverItem, Recipe } from '../types'

interface LeftoverWithRecipe {
  leftover: LeftoverItem
  recipe: Recipe | null
}

export default function CongelateurPage() {
  const [items, setItems] = useState<LeftoverWithRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    setIsLoading(true)
    const leftovers = await getAllLeftovers()
    const withRecipes = await Promise.all(
      leftovers.map(async (l) => ({
        leftover: l,
        recipe: await getRecipeById(l.recipe_id) ?? null,
      }))
    )
    setItems(withRecipes)
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet element ?')) return
    await deleteLeftover(id)
    await load()
  }

  const handleAddPortion = async (item: LeftoverItem) => {
    await updateLeftover({ ...item, portions: item.portions + 1 })
    await load()
  }

  const handleRemovePortion = async (item: LeftoverItem) => {
    if (item.portions <= 1) {
      await handleDelete(item.id)
    } else {
      await updateLeftover({ ...item, portions: item.portions - 1 })
      await load()
    }
  }

  const frozen = items.filter((i) => i.leftover.frozen)
  const fresh = items.filter((i) => !i.leftover.frozen)

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4">
          <h1 className="text-xl font-bold text-foreground">Stocks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Restes et congelateur</p>
        </div>
      </div>

      <div className="px-4 py-4 pb-8 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Snowflake size={48} className="text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Aucun stock</p>
            <p className="text-muted-foreground text-sm mt-1">
              Utilise "J'ai cuisine ca" sur une recette pour tracker tes restes
            </p>
          </div>
        ) : (
          <>
            {frozen.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Snowflake size={16} className="text-blue-400" />
                  <h2 className="font-semibold text-foreground">Congelateur ({frozen.length})</h2>
                </div>
                <div className="space-y-2">
                  {frozen.map(({ leftover, recipe }) => (
                    <div key={leftover.id} className="bg-card rounded-2xl border border-blue-200 p-3 flex items-center gap-3">
                      <span className="text-2xl">{recipe?.emoji ?? '🥡'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{recipe?.name ?? 'Recette inconnue'}</p>
                        <p className="text-xs text-muted-foreground">Congele</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRemovePortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold">−</button>
                        <span className="text-sm font-bold text-foreground w-4 text-center">{leftover.portions}</span>
                        <button onClick={() => handleAddPortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => handleDelete(leftover.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {fresh.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground">Restes frais ({fresh.length})</h2>
                <div className="space-y-2">
                  {fresh.map(({ leftover, recipe }) => {
                    const expiresAt = leftover.expires_at ? new Date(leftover.expires_at) : null
                    const isExpired = expiresAt ? expiresAt < new Date() : false
                    return (
                      <div key={leftover.id} className={"bg-card rounded-2xl border p-3 flex items-center gap-3 " + (isExpired ? 'border-destructive/50' : 'border-border')}>
                        <span className="text-2xl">{recipe?.emoji ?? '🥡'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{recipe?.name ?? 'Recette inconnue'}</p>
                          {expiresAt && (
                            <p className={"text-xs " + (isExpired ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                              {isExpired ? 'Expire !' : 'Expire le ' + expiresAt.toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleRemovePortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold">−</button>
                          <span className="text-sm font-bold text-foreground w-4 text-center">{leftover.portions}</span>
                          <button onClick={() => handleAddPortion(leftover)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground">
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
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}