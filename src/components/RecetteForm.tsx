import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import type { Recipe, Ingredient, RecipeTag, Unit } from '../types'
import { RECIPE_TAGS, RECIPE_TAG_LABELS, UNIT_LABELS } from '../types'
import { cn } from '../lib/utils'

interface RecetteFormProps {
  initial?: Partial<Recipe>
  onSubmit: (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
  isLoading?: boolean
}

const EMPTY_INGREDIENT: Ingredient = {
  name: '',
  quantity: 0,
  unit: 'g',
  note: null,
}

const UNITS: Unit[] = ['g', 'kg', 'ml', 'cl', 'l', 'cas', 'cac', 'piece', 'tranche', 'filet', 'botte', 'pincee']

export function RecetteForm({ initial, onSubmit, onCancel, isLoading }: RecetteFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '')
  const [prepTime, setPrepTime] = useState(initial?.prep_time ?? 10)
  const [cookTime, setCookTime] = useState(initial?.cook_time ?? 20)
  const [servings, setServings] = useState(initial?.servings ?? 2)
  const [tags, setTags] = useState<RecipeTag[]>(initial?.tags ?? [])
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? [{ ...EMPTY_INGREDIENT }]
  )
  const [steps, setSteps] = useState<string[]>(initial?.steps ?? [''])
  const [kcal, setKcal] = useState(initial?.macros?.kcal ?? 0)
  const [prot, setProt] = useState(initial?.macros?.p ?? 0)
  const [gluc, setGluc] = useState(initial?.macros?.g ?? 0)
  const [lip, setLip] = useState(initial?.macros?.l ?? 0)
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(
    initial?.macros?.confidence ?? 'medium'
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const updateIngredient = (i: number, field: keyof Ingredient, value: string | number | null) => {
    setIngredients((prev) => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing))
  }
  const addIngredient = () => setIngredients((p) => [...p, { ...EMPTY_INGREDIENT }])
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, idx) => idx !== i))

  const updateStep = (i: number, value: string) =>
    setSteps((p) => p.map((s, idx) => idx === i ? value : s))
  const addStep = () => setSteps((p) => [...p, ''])
  const removeStep = (i: number) => setSteps((p) => p.filter((_, idx) => idx !== i))

  const toggleTag = (tag: RecipeTag) =>
    setTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag])

  const handleSubmit = () => {
    if (!name.trim()) return
    const cleanIngredients = ingredients.filter((i) => i.name.trim())
    const cleanSteps = steps.filter((s) => s.trim())
    onSubmit({
      name: name.trim(),
      emoji,
      photo_url: null,
      prep_time: prepTime,
      cook_time: cookTime,
      servings,
      tags,
      ingredients: cleanIngredients,
      steps: cleanSteps,
      macros: { kcal, p: prot, g: gluc, l: lip, confidence },
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">Recette</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 text-2xl text-center border border-border rounded-xl bg-card p-2"
            maxLength={2}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la recette"
            className="flex-1 border border-border rounded-xl bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">Infos pratiques</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Prep (min)', value: prepTime, set: setPrepTime },
            { label: 'Cuisson (min)', value: cookTime, set: setCookTime },
            { label: 'Portions', value: servings, set: setServings },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                type="number"
                value={value}
                min={0}
                onChange={(e) => set(Number(e.target.value))}
                className="w-full border border-border rounded-xl bg-card px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">Tags</label>
        <div className="flex flex-wrap gap-2">
          {RECIPE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors',
                tags.includes(tag)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border'
              )}
            >
              {RECIPE_TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">Ingredients</label>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value.toLowerCase())}
                placeholder="ingredient"
                className="flex-1 min-w-0 border border-border rounded-xl bg-card px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={ing.quantity || ''}
                min={0}
                onChange={(e) => updateIngredient(i, 'quantity', Number(e.target.value))}
                placeholder="qte"
                className="w-16 border border-border rounded-xl bg-card px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="relative">
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value as Unit)}
                  className="appearance-none border border-border rounded-xl bg-card pl-2 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-1.5 top-3 text-muted-foreground pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={ingredients.length === 1}
                className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-1.5 text-sm text-primary font-medium"
        >
          <Plus size={16} /> Ajouter un ingredient
        </button>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">Etapes</label>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-semibold">
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={"Etape " + (i + 1) + "..."}
                rows={2}
                className="flex-1 border border-border rounded-xl bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                disabled={steps.length === 1}
                className="mt-2 p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-1.5 text-sm text-primary font-medium"
        >
          <Plus size={16} /> Ajouter une etape
        </button>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">
          Macros <span className="text-muted-foreground font-normal">(par portion)</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Kcal', value: kcal, set: setKcal },
            { label: 'Prot g', value: prot, set: setProt },
            { label: 'Gluc g', value: gluc, set: setGluc },
            { label: 'Lip g', value: lip, set: setLip },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                type="number"
                value={value || ''}
                min={0}
                onChange={(e) => set(Number(e.target.value))}
                className="w-full border border-border rounded-xl bg-card px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Fiabilite de estimation</span>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setConfidence(c)}
                className={cn(
                  'flex-1 text-xs py-1.5 rounded-xl border transition-colors',
                  confidence === c
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border'
                )}
              >
                {c === 'low' ? 'Approx.' : c === 'medium' ? 'Correcte' : 'Fiable'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Notes <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Conseils, variantes, accompagnements..."
          rows={3}
          className="w-full border border-border rounded-xl bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-border text-foreground font-medium text-sm"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || isLoading}
          className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
