import { useEffect, useState } from 'react'
import { ShoppingCart, RefreshCw, Trash2 } from 'lucide-react'
import { generateCourseList, type CourseItem } from '../db/coursesQueries'
import { getWeekDays, getMondayOfWeek } from '../lib/dates'
import { UNIT_LABELS } from '../types'
import type { Unit } from '../types'

export default function CoursesPage() {
  const [items, setItems] = useState<CourseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const weekDates = getWeekDays(getMondayOfWeek(new Date()))

  const load = async () => {
    setIsLoading(true)
    const list = await generateCourseList(weekDates)
    setItems(list)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const toggleCheck = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const clearChecked = () => {
    setChecked(new Set())
  }

  const itemKey = (item: CourseItem) => item.name + '_' + item.unit

  const uncheckedItems = items.filter((i) => !checked.has(itemKey(i)))
  const checkedItems = items.filter((i) => checked.has(itemKey(i)))

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Courses</h1>
          <div className="flex gap-2">
            {checkedItems.length > 0 && (
              <button
                onClick={clearChecked}
                className="flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-2 rounded-xl bg-secondary"
              >
                <Trash2 size={15} />
                Effacer
              </button>
            )}
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-2 rounded-xl bg-secondary"
            >
              <RefreshCw size={15} />
              Rafraichir
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingCart size={48} className="text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Aucune course</p>
            <p className="text-muted-foreground text-sm mt-1">
              Planifie tes repas de la semaine pour generer ta liste
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">
              {items.length} ingredients pour la semaine du {weekDates[0]}
            </p>

            {uncheckedItems.length > 0 && (
              <div className="space-y-2">
                {uncheckedItems.map((item) => {
                  const key = itemKey(item)
                  const unitLabel = UNIT_LABELS[item.unit as Unit] ?? item.unit
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCheck(key)}
                      className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border text-left active:scale-95 transition-transform"
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.recipes.join(', ')}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                        {item.quantity} {unitLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {checkedItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Dans le panier ({checkedItems.length})
                </p>
                {checkedItems.map((item) => {
                  const key = itemKey(item)
                  const unitLabel = UNIT_LABELS[item.unit as Unit] ?? item.unit
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCheck(key)}
                      className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border text-left opacity-50"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-through capitalize">{item.name}</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap line-through">
                        {item.quantity} {unitLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}