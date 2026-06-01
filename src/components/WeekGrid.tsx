import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { MealSlot, Recipe } from '../types'
import { formatDayLabel, today } from '../lib/dates'
import { RecettePicker } from './RecettePicker'

interface WeekGridProps {
  dates: string[]
  slots: MealSlot[]
  recipes: Recipe[]
  onSetSlot: (date: string, mealType: 'lunch' | 'dinner', recipeId: string) => Promise<void>
  onRemoveSlot: (date: string, mealType: 'lunch' | 'dinner') => Promise<void>
}

interface PickerTarget {
  date: string
  mealType: 'lunch' | 'dinner'
}

export function WeekGrid({ dates, slots, recipes, onSetSlot, onRemoveSlot }: WeekGridProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const todayStr = today()

  const getSlot = (date: string, mealType: 'lunch' | 'dinner') =>
    slots.find((s) => s.date === date && s.meal_type === mealType)

  const getRecipe = (recipeId: string | null) =>
    recipeId ? recipes.find((r) => r.id === recipeId) : null

  const handleSelect = async (recipeId: string) => {
    if (!pickerTarget) return
    await onSetSlot(pickerTarget.date, pickerTarget.mealType, recipeId)
    setPickerTarget(null)
  }

  return (
    <>
      {pickerTarget && (
        <RecettePicker
          onSelect={handleSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}

      <div className="space-y-2">
        {dates.map((date) => {
          const { day, num } = formatDayLabel(date)
          const isToday = date === todayStr
          const lunchSlot = getSlot(date, 'lunch')
          const dinnerSlot = getSlot(date, 'dinner')
          const lunchRecipe = getRecipe(lunchSlot?.recipe_id ?? null)
          const dinnerRecipe = getRecipe(dinnerSlot?.recipe_id ?? null)

          return (
            <div
              key={date}
              className={'rounded-2xl border p-3 ' + (isToday ? 'border-primary bg-primary/5' : 'border-border bg-card')}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + (isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground')}>
                  <span className="text-xs font-bold">{num}</span>
                </div>
                <span className={'text-sm font-semibold capitalize ' + (isToday ? 'text-primary' : 'text-foreground')}>
                  {day}
                </span>
                {isToday && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Aujourd'hui
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['lunch', 'dinner'] as const).map((mealType) => {
                  const recipe = mealType === 'lunch' ? lunchRecipe : dinnerRecipe
                  const label = mealType === 'lunch' ? 'Dejeuner' : 'Diner'

                  return (
                    <div key={mealType}>
                      <p className="text-[10px] text-muted-foreground mb-1 font-medium">{label}</p>
                      {recipe ? (
                        <div className="bg-secondary rounded-xl p-2 flex items-center gap-2">
                          <span className="text-lg flex-shrink-0">{recipe.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{recipe.name}</p>
                            <p className="text-[10px] text-muted-foreground">{recipe.macros.kcal} kcal</p>
                          </div>
                          <button
                            onClick={() => onRemoveSlot(date, mealType)}
                            className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPickerTarget({ date, mealType })}
                          className="w-full h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Plus size={14} />
                          <span className="text-xs">Ajouter</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}