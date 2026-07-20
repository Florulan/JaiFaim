import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X, ChevronRight } from 'lucide-react'
import { generateRecipe, getApiKey, type SaisieMode } from '../services/claudeService'
import { toast } from '../store/toastStore'
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
    placeholder: 'Ex: Osso buco, Ratatouille, Pad thaï...',
  },
  {
    id: 'ingredient',
    label: 'Ingrédient / technique',
    emoji: '🧴',
    placeholder: 'Ex: Marinade soja miel ail gingembre pour poulet...',
  },
  {
    id: 'description',
    label: 'Description libre',
    emoji: '🎥',
    placeholder: 'Ex: Il fait revenir des oignons, ajoute de la viande hachée, de la tomate...',
  },
]

export function AISaisieDrawer({ onClose, onSave }: AISaisieDrawerProps) {
  const [mode, setMode] = useState<SaisieMode | null>(null)
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedRecipe, setGeneratedRecipe] = useState<Omit<Recipe, 'id' | 'created_at' | 'updated_at'> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Clé lue une fois au montage : le drawer est remonté à chaque ouverture
  const [hasApiKey] = useState(() => !!getApiKey())

  // Bannière douce affichée quand aucune clé n'est configurée.
  // On ne cache ni ne désactive rien : on informe et on renvoie vers les Paramètres.
  const noKeyNotice = !hasApiKey ? (
    <Link
      to="/parametres"
      onClick={onClose}
      className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 text-sm text-primary"
    >
      <Sparkles size={16} className="shrink-0" />
      <span>Ajoute ta clé API dans les Paramètres pour activer la génération de recettes.</span>
    </Link>
  ) : null

  const handleGenerate = async () => {
    if (!mode || !input.trim()) return
    // État dégradé doux : pas de clé → message clair, pas d'erreur cryptique
    if (!getApiKey()) {
      toast.info('Ajoute ta clé API dans les Paramètres pour activer la génération de recettes')
      return
    }
    setIsGenerating(true)
    setError(null)
    try {
      const recipe = await generateRecipe(input.trim(), mode)
      setGeneratedRecipe(recipe)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => {
    setIsSaving(true)
    await onSave(data)
    setIsSaving(false)
    onClose()
  }

  // Étape 3 — Validation de la recette générée
  if (generatedRecipe) {
    return (
      <div className="fixed inset-0 bg-background z-[60] flex flex-col">
        <div className="shrink-0 border-b border-border px-4 py-4 flex items-center gap-3">
          <button onClick={() => setGeneratedRecipe(null)} className="p-2 -ml-2 text-muted-foreground">
            <X size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-foreground">Valider la recette</h2>
            <p className="text-xs text-muted-foreground">Vérifie et ajuste si besoin</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-4">
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

  // Étape 2 — Saisie du texte
  if (mode) {
    const currentMode = MODES.find((m) => m.id === mode)!
    return (
      <div className="fixed inset-0 bg-background z-[60] flex flex-col">
        <div className="shrink-0 border-b border-border px-4 py-4 flex items-center gap-3">
          <button onClick={() => setMode(null)} className="p-2 -ml-2 text-muted-foreground">
            <X size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-foreground">{currentMode.emoji} {currentMode.label}</h2>
            <p className="text-xs text-muted-foreground">Décris et l'IA génère la fiche</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-4">
          {noKeyNotice}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentMode.placeholder}
            rows={5}
            autoFocus
            className="w-full border border-border rounded-2xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 py-4 border-t border-border">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Générer la recette
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Étape 1 — Choix du mode
  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col">
      <div className="shrink-0 border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground">
          <X size={20} />
        </button>
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Saisie intelligente
          </h2>
          <p className="text-xs text-muted-foreground">Comment tu veux ajouter ta recette ?</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-3">
        {noKeyNotice}
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border active:scale-95 transition-transform text-left"
          >
            <span className="text-3xl">{m.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">{m.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.placeholder}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}