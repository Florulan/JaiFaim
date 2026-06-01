import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { useRecipeStore } from '../store/recipeStore'
import { WeekGrid } from '../components/WeekGrid'
import { getWeekDays, formatWeekRange } from '../lib/dates'

export default function PlanningPage() {
  const { slots, weekStart, isLoading, loadWeek, nextWeek, prevWeek, goToToday, setSlot, removeSlot } = usePlanningStore()
  const { recipes, loadRecipes } = useRecipeStore()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const init = async () => {
      await loadRecipes()
      await loadWeek(weekStart)
      setInitialized(true)
    }
    init()
  }, [])

  const dates = getWeekDays(weekStart)

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Planning</h1>
          <button onClick={goToToday} className="flex items-center gap-1.5 text-sm text-primary font-medium">
            <CalendarDays size={16} />
            Aujourd'hui
          </button>
        </div>
        <div className="flex items-center justify-between pb-4">
          <button onClick={prevWeek} className="p-2 rounded-xl bg-secondary text-foreground">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-foreground">{formatWeekRange(weekStart)}</span>
          <button onClick={nextWeek} className="p-2 rounded-xl bg-secondary text-foreground">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="px-4 py-4">
        {!initialized || isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <WeekGrid dates={dates} slots={slots} recipes={recipes} onSetSlot={setSlot} onRemoveSlot={removeSlot} />
        )}
      </div>
    </div>
  )
}