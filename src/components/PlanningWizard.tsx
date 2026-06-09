import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, RefreshCw } from 'lucide-react'
import { generatePlanningWithAI, type PlanningAIResult, getApiKey } from '../services/claudeService'
import { generatePlanning } from '../services/planningService'
import { getAllRecipes } from '../services/recipeService'
import { useAuthStore } from '../store/authStore'
import { formatDayLabel } from '../lib/dates'
import type { Recipe } from '../types'

export interface GeneratedSlot {
  date: string
  mealType: 'lunch' | 'dinner'
  recipeId: string
  recipe: Recipe
  reason?: string
}

interface PlanningWizardProps {
  weekStart: Date
  dates: string[]
  onClose: () => void
  onValidate: (slots: GeneratedSlot[]) => Promise<void>
}

const DAY_MEALS = ['lunch', 'dinner'] as const

export function PlanningWizard({ dates, onClose, onValidate }: PlanningWizardProps) {
  const { profile } = useAuthStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; mealType: 'lunch' | 'dinner' }[]>([])
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [imposedMap, setImposedMap] = useState<Map<string, string>>(new Map())
  const [generatedSlots, setGeneratedSlots] = useState<GeneratedSlot[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pickerSlotKey, setPickerSlotKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  function slotKey(date: string, mealType: 'lunch' | 'dinner') {
    return date + '_' + mealType
  }

  const toggleSlot = (date: string, mealType: 'lunch' | 'dinner') => {
    const exists = selectedSlots.find((s) => s.date === date && s.mealType === mealType)
    if (exists) {
      setSelectedSlots((p) => p.filter((s) => !(s.date === date && s.mealType === mealType)))
    } else {
      setSelectedSlots((p) => [...p, { date, mealType }])
    }
  }

  const isSlotSelected = (date: string, mealType: 'lunch' | 'dinner') =>
    selectedSlots.some((s) => s.date === date && s.mealType === mealType)

  const goToStep2 = async () => {
    const recipes = await getAllRecipes()
    setAllRecipes(recipes)
    setStep(2)
  }

  const goToStep3 = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const macrosTarget = profile?.macros_target ?? { kcal: 2200, p: 160, g: 220, l: 75 }
      const hasApiKey = !!getApiKey()

      // Slots imposés
      const imposedSlots: GeneratedSlot[] = []
      for (const [key, recipeId] of imposedMap.entries()) {
        const [date, mealType] = key.split('_') as [string, 'lunch' | 'dinner']
        const recipe = allRecipes.find((r) => r.id === recipeId)
        if (recipe) imposedSlots.push({ date, mealType, recipeId, recipe })
      }

      const daysToFill = selectedSlots.filter((s) => !imposedMap.has(slotKey(s.date, s.mealType)))
      const alreadyPlanned = imposedSlots.map((s) => ({
        date: s.date,
        mealType: s.mealType,
        recipeName: s.recipe.name,
        macros: s.recipe.macros,
      }))

      let aiSlots: GeneratedSlot[] = []

      if (daysToFill.length > 0) {
        if (hasApiKey) {
          // Mode IA
          const results: PlanningAIResult[] = await generatePlanningWithAI({
            recipes: allRecipes,
            macrosTarget,
            daysToFill,
            alreadyPlanned,
            noRepeatDays: profile?.no_repeat_days ?? 10,
          })
          for (const result of results) {
            const recipe = allRecipes.find((r) => r.id === result.recipeId)
            if (recipe) aiSlots.push({ date: result.date, mealType: result.mealType, recipeId: recipe.id, recipe, reason: result.reason })
          }
        } else {
          // Fallback algorithme local
          const generated = await generatePlanning({
            weekStart: new Date(daysToFill[0].date),
            selectedSlots: daysToFill,
            imposedRecipes: [],
            noRepeatDays: profile?.no_repeat_days ?? 10,
          })
          for (const slot of generated) {
            aiSlots.push({ date: slot.date, mealType: slot.mealType, recipeId: slot.recipeId, recipe: slot.recipe })
          }
        }
      }

      setGeneratedSlots([...imposedSlots, ...aiSlots])
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de génération')
    } finally {
      setIsGenerating(false)
    }
  } 

  const regenerateSlot = async (date: string, mealType: 'lunch' | 'dinner') => {
    const key = slotKey(date, mealType)
    if (imposedMap.has(key)) return

    try {
      const hasApiKey = !!getApiKey()
      const macrosTarget = profile?.macros_target ?? { kcal: 2200, p: 160, g: 220, l: 75 }
      const alreadyPlanned = generatedSlots
        .filter((s) => !(s.date === date && s.mealType === mealType))
        .map((s) => ({ date: s.date, mealType: s.mealType, recipeName: s.recipe.name, macros: s.recipe.macros }))

      if (hasApiKey) {
        const results = await generatePlanningWithAI({
          recipes: allRecipes,
          macrosTarget,
          daysToFill: [{ date, mealType }],
          alreadyPlanned,
          noRepeatDays: profile?.no_repeat_days ?? 10,
        })
        if (results[0]) {
          const recipe = allRecipes.find((r) => r.id === results[0].recipeId)
          if (recipe) {
            setGeneratedSlots((prev) =>
              prev.map((s) => s.date === date && s.mealType === mealType
                ? { date, mealType, recipeId: recipe.id, recipe, reason: results[0].reason }
                : s
              )
            )
          }
        }
      } else {
        const generated = await generatePlanning({
          weekStart: new Date(date),
          selectedSlots: [{ date, mealType }],
          imposedRecipes: [],
          noRepeatDays: profile?.no_repeat_days ?? 10,
        })
        if (generated[0]) {
          setGeneratedSlots((prev) =>
            prev.map((s) => s.date === date && s.mealType === mealType
              ? { date, mealType, recipeId: generated[0].recipeId, recipe: generated[0].recipe }
              : s
            )
          )
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const handleValidate = async () => {
    setIsSaving(true)
    await onValidate(generatedSlots)
    setIsSaving(false)
  }

  const filteredRecipes = allRecipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── Étape 1 ────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-background z-[60] flex flex-col">
        <div className="shrink-0 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground"><X size={20} /></button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Planifier ma semaine</h2>
            <p className="text-xs text-muted-foreground">Étape 1 — Quels repas veux-tu planifier ?</p>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-2 h-2 rounded-full bg-muted" />
            <div className="w-2 h-2 rounded-full bg-muted" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
          {dates.map((date) => {
            const { day, num } = formatDayLabel(date)
            return (
              <div key={date} className="bg-card rounded-2xl border border-border p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">{num}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground capitalize">{day}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DAY_MEALS.map((mealType) => {
                    const selected = isSlotSelected(date, mealType)
                    return (
                      <button
                        key={mealType}
                        onClick={() => toggleSlot(date, mealType)}
                        className={`py-2.5 rounded-xl text-xs font-medium border-2 transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-transparent'}`}
                      >
                        {mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="shrink-0 px-4 py-4 border-t border-border bg-background">
          <p className="text-xs text-muted-foreground text-center mb-3">
            {selectedSlots.length} repas sélectionné{selectedSlots.length > 1 ? 's' : ''}
          </p>
          <button
            onClick={goToStep2}
            disabled={selectedSlots.length === 0}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Suivant <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  // ─── Étape 2 ────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-background z-[60] flex flex-col">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
          <button onClick={() => setStep(1)} className="p-2 -ml-2 text-muted-foreground"><ChevronLeft size={20} /></button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Planifier ma semaine</h2>
            <p className="text-xs text-muted-foreground">Étape 2 — Des recettes à imposer ? (optionnel)</p>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-2 h-2 rounded-full bg-muted" />
          </div>
        </div>

        {pickerSlotKey ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="shrink-0 px-4 py-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une recette..."
                  autoFocus
                  className="w-full bg-secondary rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4 min-h-0">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => {
                      setImposedMap((prev) => new Map(prev).set(pickerSlotKey, recipe.id))
                      setPickerSlotKey(null)
                      setSearchQuery('')
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border text-left"
                  >
                    <span className="text-2xl">{recipe.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground">{recipe.macros.kcal} kcal · {recipe.macros.p}g prot</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            <p className="text-xs text-muted-foreground pb-2">
              Appuie sur un repas pour lui assigner une recette précise. Laisse vide et l'IA choisit en fonction de tes macros.
            </p>
            {selectedSlots.map((slot) => {
              const key = slotKey(slot.date, slot.mealType)
              const imposedId = imposedMap.get(key)
              const imposedRecipe = imposedId ? allRecipes.find((r) => r.id === imposedId) : null
              const { day, num } = formatDayLabel(slot.date)

              return (
                <div key={key} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">{num}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground capitalize">{day} — {slot.mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}</p>
                    {imposedRecipe ? (
                      <p className="text-sm font-medium text-foreground truncate">{imposedRecipe.emoji} {imposedRecipe.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Choix IA</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {imposedRecipe && (
                      <button
                        onClick={() => setImposedMap((prev) => { const m = new Map(prev); m.delete(key); return m })}
                        className="p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setPickerSlotKey(key)}
                      className="text-xs text-primary font-medium px-3 py-1.5 rounded-xl bg-primary/10"
                    >
                      {imposedRecipe ? 'Changer' : 'Choisir'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!pickerSlotKey && (
          <div className="px-4 py-4 border-t border-border space-y-2">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <button
              onClick={goToStep3}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> L'IA réfléchit...</>
              ) : (
                <><Sparkles size={18} /> Générer avec l'IA</>
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Étape 3 ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => setStep(2)} className="p-2 -ml-2 text-muted-foreground"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">Planifier ma semaine</h2>
          <p className="text-xs text-muted-foreground">Étape 3 — Valide ton planning</p>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {generatedSlots.map((slot) => {
          const { day, num } = formatDayLabel(slot.date)
          const isImposed = imposedMap.has(slotKey(slot.date, slot.mealType))
          return (
            <div key={slotKey(slot.date, slot.mealType)} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">{num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground capitalize">{day} — {slot.mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}</p>
                <p className="text-sm font-medium text-foreground truncate">{slot.recipe.emoji} {slot.recipe.name}</p>
                {slot.reason && (
                  <p className="text-[10px] text-primary mt-0.5 italic">{slot.reason}</p>
                )}
                <p className="text-[10px] text-muted-foreground">{slot.recipe.macros.kcal} kcal · {slot.recipe.macros.p}g prot</p>
              </div>
              {!isImposed && (
                <button
                  onClick={() => regenerateSlot(slot.date, slot.mealType)}
                  className="p-2 text-muted-foreground hover:text-primary"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              {isImposed && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full">Imposé</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={handleValidate}
          disabled={isSaving}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Enregistrement...</>
          ) : 'Valider le planning'}
        </button>
      </div>
    </div>
  )
}