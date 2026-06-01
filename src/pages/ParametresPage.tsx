import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, Trash2 } from 'lucide-react'
import { getApiKey, saveApiKey, clearApiKey } from '../services/claudeService'
import { db } from '../db/database'
import type { UserProfile } from '../types'
import { DEFAULT_USER_PROFILE } from '../types'

export default function ParametresPage() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE)
  const [macrosSaved, setMacrosSaved] = useState(false)

  useEffect(() => {
    const key = getApiKey()
    if (key) { setHasKey(true); setApiKey(key) }
    db.user_profile.get('local').then((p) => { if (p) setProfile(p) })
  }, [])

  const handleSaveKey = () => {
    if (!apiKey.trim()) return
    saveApiKey(apiKey.trim())
    setHasKey(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearKey = () => {
    clearApiKey()
    setApiKey('')
    setHasKey(false)
  }

  const handleSaveMacros = async () => {
    const updated: UserProfile = { ...profile, updated_at: new Date().toISOString() }
    await db.user_profile.put(updated)
    setMacrosSaved(true)
    setTimeout(() => setMacrosSaved(false), 2000)
  }

  const updateMacro = (field: 'kcal' | 'p' | 'g' | 'l', value: number) => {
    setProfile((prev) => ({ ...prev, macros_target: { ...prev.macros_target, [field]: value } }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe">
        <div className="py-4">
          <h1 className="text-xl font-bold text-foreground">Parametres</h1>
        </div>
      </div>

      <div className="px-4 space-y-8 pb-8">

        <section className="space-y-3">
          <div>
            <h2 className="font-semibold text-foreground">Macros cibles</h2>
            <p className="text-xs text-muted-foreground mt-1">Objectifs quotidiens utilises pour le planning.</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Kcal', field: 'kcal' as const },
              { label: 'Prot g', field: 'p' as const },
              { label: 'Gluc g', field: 'g' as const },
              { label: 'Lip g', field: 'l' as const },
            ].map(({ label, field }) => (
              <div key={field} className="space-y-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <input
                  type="number"
                  value={profile.macros_target[field]}
                  min={0}
                  onChange={(e) => updateMacro(field, Number(e.target.value))}
                  className="w-full border border-border rounded-xl bg-card px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveMacros}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            {macrosSaved ? 'Enregistrees !' : 'Enregistrer les macros'}
          </button>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-semibold text-foreground">Cle API Anthropic</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Necessaire pour la generation de recettes par IA. Stockee uniquement sur cet appareil.
            </p>
          </div>

          {hasKey && (
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3">
              <Check size={16} className="text-accent flex-shrink-0" />
              <p className="text-sm text-accent font-medium">Cle API configuree</p>
            </div>
          )}

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full border border-border rounded-2xl bg-card px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-3.5 text-muted-foreground"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
            >
              {saved ? 'Enregistree !' : 'Enregistrer'}
            </button>
            {hasKey && (
              <button
                onClick={handleClearKey}
                className="p-3 rounded-2xl border border-border text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Obtiens une cle sur console.anthropic.com. 5$ de credits suffisent pour des mois d'utilisation.
          </p>
        </section>

      </div>
    </div>
  )
}