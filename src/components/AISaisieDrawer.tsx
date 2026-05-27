import { useState } from 'react'
import { Sparkles, X, ChevronRight } from 'lucide-react'
import { generateRecipe, type SaisieMode } from '../services/claudeService'
import { RecetteForm } from './RecetteForm'
import type { Recipe } from '../types'

interface AISaisieDrawerProps {
  onClose: () => void
  onSave: (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

const MODES: { id: SaisieMode; label: string; emoji: string; placeholder: string }[] = [
  {
    id: 'nom',
    label: 'Nom de recette',
    emoji: '📝',
    placeholder: 'Ex: osso buco, pad thai, tarte tatin...',
  },
  {
    id: 'ingredient',
    label: 'Ingredient ou technique',
    emoji: '🧴',
    placeholder: 'Ex: marinade soja miel ail, poulet citron...',
  },
  {
    id: 'description',
    label: 'Description libre',
    emoji: '🎥',
    placeholder: 'Ex: il fait revenir des oignons, ajoute de la viande hachee, des tomates...',
  },
]

export function AISaisieDrawer({ onClose, onSave }: AISaisieDrawerProps) {
  const [mode, setMode] = useState<SaisieMode>('nom')
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedRecipe, setGeneratedRecipe] = useState<Omit<Recipe, 'id' | 'created_at' | 'updated_at'> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentMode = MODES.find((m) => m.id === mode)!

  const handleGenerate = async () => {
    if (!input.trim()) return
    setIsGenerating(true)
    setError(null)
    setGeneratedRecipe(null)
    try {
      const recipe = await generateRecipe(input.trim(), mode)
      setGeneratedRecipe(recipe)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => {
    setIsSaving(true)
    await onSave(data)
    setIsSaving(false)
  }

  if (generatedRecipe) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => setGeneratedRecipe(null)}
            className="p-2 -ml-2 text-muted-foreground"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-foreground">Verifier la recette</h1>
            <p className="text-xs text-muted-foreground">Modifie si besoin puis enregistre</p>
          </div>
        </div>
        <div className="px-4 pt-4">
          <div className="mb-4 bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Sparkles size={16} className="text-accent flex-shrink-0" />
            <p className="text-xs text-accent font-medium">Genere par IA - verifie les macros et les quantites</p>
          </div>
          <RecetteForm
            initial={generatedRecipe}
            onSubmit={handleSave}
            onCancel={() => setGeneratedRecipe(null)}
            isLoading={isSaving}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-4 flex items-center gap-3">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground">
          <X size={20} />
        </button>
        <div>
          <h1 className="font-semibold text-foreground">Ajouter par IA</h1>
          <p className="text-xs text-muted-foreground">Decris ce que tu veux cuisiner</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        <section className="space-y-3">
          <label className="block text-sm font-semibold text-foreground">Mode de saisie</label>
          <div className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setInput('') }}
                className={"w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors text-left " +
                  (mode === m.id
                    ? 'bg-primary/5 border-primary'
                    : 'bg-card border-border')}
              >
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className={"font-medium text-sm " + (mode === m.id ? 'text-primary' : 'text-foreground')}>
                    {m.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.placeholder}</p>
                </div>
                {mode === m.id && <ChevronRight size={16} className="text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="block text-sm font-semibold text-foreground">Ta demande</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentMode.placeholder}
            rows={4}
            className="w-full border border-border rounded-2xl bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </section>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!input.trim() || isGenerating}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Generation en cours...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generer la recette
            </>
          )}
        </button>
      </div>
    </div>
  )
}