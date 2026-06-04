import { useState } from 'react'
import { X, Snowflake, CalendarDays, Minus, Plus } from 'lucide-react'
import type { Recipe, LeftoverItem, MealSlot } from '../types'
import { createLeftover } from '../db/leftoverQueries'
import { upsertSlot } from '../db/planningQueries'
import { getWeekDays, getMondayOfWeek, addWeeks, formatDayLabel } from '../lib/dates'

interface CuisineDrawerProps {
  recipe: Recipe
  onClose: () => void
}

export function CuisineDrawer({ recipe, onClose }: CuisineDrawerProps) {
  const [portionsCuisinees, setPortionsCuisinees] = useState(recipe.servings)
  const [portionsMangees, setPortionsMangees] = useState(1)
  const [step, setStep] = useState<'portions' | 'destination'>('portions')
  const [destination, setDestination] = useState<'planning' | 'congelateur' | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; mealType: 'lunch' | 'dinner' }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [done, setDone] = useState(false)

  const portionsRestantes = portionsCuisinees - portionsMangees

  // 2 semaines de dates
  const monday = getMondayOfWeek(new Date())
  const week1 = getWeekDays(monday)
  const week2 = getWeekDays(addWeeks(monday, 1))
  const allDates = [...week1, ...week2]

  const toggleSlot = (date: string, mealType: 'lunch' | 'dinner') => {
    const exists = selectedSlots.find((s) => s.date === date && s.mealType === mealType)
    if (exists) {
      setSelectedSlots((p) => p.filter((s) => !(s.date === date && s.mealType === mealType)))
    } else if (selectedSlots.length < portionsRestantes) {
      setSelectedSlots((p) => [...p, { date, mealType }])
    }
  }

  const isSlotSelected = (date: string, mealType: 'lunch' | 'dinner') =>
    selectedSlots.some((s) => s.date === date && s.mealType === mealType)

  const handleSave = async () => {
    if (portionsRestantes <= 0) { onClose(); return }
    setIsSaving(true)

    const now = new Date().toISOString()
    const expires = new Date()
    expires.setDate(expires.getDate() + 4)

    if (destination === 'congelateur') {
      const leftover: LeftoverItem = {
        id: crypto.randomUUID(),
        recipe_id: recipe.id,
        portions: portionsRestantes,
        cooked_at: now,
        expires_at: null,
        frozen: true,
        notes: null,
        created_at: now,
      }
      await createLeftover(leftover)
    } else if (destination === 'planning' && selectedSlots.length > 0) {
      for (const slot of selectedSlots) {
        const mealSlot: MealSlot = {
          id: crypto.randomUUID(),
          date: slot.date,
          meal_type: slot.mealType,
          recipe_id: recipe.id,
          servings_override: 1,
          is_suggestion: false,
          is_leftover: true,
          validated_at: now,
          created_at: now,
        }
        await upsertSlot(mealSlot)
      }
      const remainingPortions = portionsRestantes - selectedSlots.length
      if (remainingPortions > 0) {
        const leftover: LeftoverItem = {
          id: crypto.randomUUID(),
          recipe_id: recipe.id,
          portions: remainingPortions,
          cooked_at: now,
          expires_at: expires.toISOString(),
          frozen: false,
          notes: null,
          created_at: now,
        }
        await createLeftover(leftover)
      }
    } else {
      const leftover: LeftoverItem = {
        id: crypto.randomUUID(),
        recipe_id: recipe.id,
        portions: portionsRestantes,
        cooked_at: now,
        expires_at: expires.toISOString(),
        frozen: false,
        notes: null,
        created_at: now,
      }
      await createLeftover(leftover)
    }

    setIsSaving(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="fixed inset-0 bg-background z-[60] flex flex-col items-center justify-center px-8 text-center">
        <span className="text-6xl mb-4">✅</span>
        <h2 className="text-xl font-bold text-foreground mb-2">C'est enregistre !</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {portionsRestantes <= 0
            ? "Tout a ete mange, rien a conserver."
            : destination === 'congelateur'
            ? portionsRestantes + " portion(s) au congelateur."
            : selectedSlots.length + " repas places dans le planning."}
        </p>
        <button onClick={onClose} className="w-full max-w-xs py-3 rounded-2xl bg-primary text-primary-foreground font-semibold">
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col">
      <div className="shrink-0 border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground"><X size={20} /></button>
        <div>
          <h2 className="font-semibold text-foreground">J'ai cuisine ca</h2>
          <p className="text-xs text-muted-foreground">{recipe.emoji} {recipe.name}</p>
        </div>
      </div>

      {step === 'portions' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
            <section className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">Combien de portions as-tu cuisine ?</label>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setPortionsCuisinees(Math.max(1, portionsCuisinees - 1))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Minus size={18} />
                </button>
                <span className="text-4xl font-bold text-foreground w-12 text-center">{portionsCuisinees}</span>
                <button onClick={() => setPortionsCuisinees(portionsCuisinees + 1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Plus size={18} />
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">Combien en as-tu mange maintenant ?</label>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setPortionsMangees(Math.max(0, portionsMangees - 1))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Minus size={18} />
                </button>
                <span className="text-4xl font-bold text-foreground w-12 text-center">{portionsMangees}</span>
                <button onClick={() => setPortionsMangees(Math.min(portionsCuisinees, portionsMangees + 1))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Plus size={18} />
                </button>
              </div>
            </section>

            {portionsRestantes > 0 && (
              <div className="bg-primary/10 rounded-2xl px-4 py-3 text-center">
                <p className="text-primary font-semibold">{portionsRestantes} portion{portionsRestantes > 1 ? 's' : ''} restante{portionsRestantes > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground mt-1">Que veux-tu en faire ?</p>
              </div>
            )}
          </div>

          <div className="shrink-0 px-4 py-4 border-t border-border">
            <button
              onClick={() => portionsRestantes <= 0 ? handleSave() : setStep('destination')}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold"
            >
              {portionsRestantes <= 0 ? 'Tout mange !' : 'Suivant'}
            </button>
          </div>
        </>
      )}

      {step === 'destination' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Que faire des {portionsRestantes} portion{portionsRestantes > 1 ? 's' : ''} restante{portionsRestantes > 1 ? 's' : ''} ?
            </p>

            <button
              onClick={() => setDestination(destination === 'planning' ? null : 'planning')}
              className={"w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors " + (destination === 'planning' ? 'border-primary bg-primary/5' : 'border-border bg-card')}
            >
              <CalendarDays size={24} className={destination === 'planning' ? 'text-primary' : 'text-muted-foreground'} />
              <div className="text-left">
                <p className={"font-semibold text-sm " + (destination === 'planning' ? 'text-primary' : 'text-foreground')}>Placer dans le planning</p>
                <p className="text-xs text-muted-foreground">Choisir les repas sur 2 semaines</p>
              </div>
            </button>

            <button
              onClick={() => setDestination(destination === 'congelateur' ? null : 'congelateur')}
              className={"w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors " + (destination === 'congelateur' ? 'border-primary bg-primary/5' : 'border-border bg-card')}
            >
              <Snowflake size={24} className={destination === 'congelateur' ? 'text-primary' : 'text-muted-foreground'} />
              <div className="text-left">
                <p className={"font-semibold text-sm " + (destination === 'congelateur' ? 'text-primary' : 'text-foreground')}>Congelateur</p>
                <p className="text-xs text-muted-foreground">Disponible pour un planning futur</p>
              </div>
            </button>

            {destination === 'planning' && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  Selectionne jusqu'a {portionsRestantes} repas ({selectedSlots.length}/{portionsRestantes} selectionnes)
                </p>
                {allDates.map((date) => {
                  const { day, num } = formatDayLabel(date)
                  const isWeek2 = week2.includes(date)
                  return (
                    <div key={date}>
                      {date === week2[0] && (
                        <p className="text-xs font-semibold text-muted-foreground pt-2 pb-1">Semaine suivante</p>
                      )}
                      <div className="bg-card rounded-2xl border border-border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={"w-7 h-7 rounded-full flex items-center justify-center " + (isWeek2 ? 'bg-accent/20' : 'bg-secondary')}>
                            <span className="text-xs font-bold">{num}</span>
                          </div>
                          <span className="text-sm font-medium capitalize">{day}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['lunch', 'dinner'] as const).map((mealType) => {
                            const selected = isSlotSelected(date, mealType)
                            const disabled = !selected && selectedSlots.length >= portionsRestantes
                            return (
                              <button
                                key={mealType}
                                onClick={() => toggleSlot(date, mealType)}
                                disabled={disabled}
                                className={"py-2 rounded-xl text-xs font-medium border-2 transition-colors disabled:opacity-40 " + (selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-transparent')}
                              >
                                {mealType === 'lunch' ? 'Dejeuner' : 'Diner'}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 px-4 py-4 border-t border-border space-y-2">
            <button
              onClick={handleSave}
              disabled={!destination || isSaving}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setStep('portions')} className="w-full py-2 text-sm text-muted-foreground">
              Retour
            </button>
          </div>
        </>
      )}
    </div>
  )
}