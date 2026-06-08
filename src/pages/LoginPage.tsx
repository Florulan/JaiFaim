import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const { signIn } = useAuthStore()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Remplis tous les champs')
      return
    }
    setIsLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou mot de passe incorrect')
      setIsLoading(false)
      return
    }
    navigate('/')
  }

  const handleReset = async () => {
    if (!resetEmail.trim()) return
    setIsResetting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: window.location.origin + window.location.pathname,
    })
    if (!error) setResetSent(true)
    setIsResetting(false)
  }

  if (showReset) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Mot de passe oublié</h1>
          <p className="text-muted-foreground mt-1">
            On t'envoie un lien pour te reconnecter
          </p>
        </div>

        {resetSent ? (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-4">
              <p className="text-sm text-primary font-medium">Email envoyé ✓</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vérifie ta boîte mail et clique sur le lien reçu.
              </p>
            </div>
            <button
              onClick={() => { setShowReset(false); setResetSent(false) }}
              className="w-full py-3 rounded-xl border border-border text-foreground text-sm font-medium"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="toi@exemple.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting || !resetEmail.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {isResetting ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <button
              onClick={() => setShowReset(false)}
              className="w-full py-2 text-sm text-muted-foreground"
            >
              Retour
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">Bon retour 👋</h1>
        <p className="text-muted-foreground mt-1">Connecte-toi pour accéder à tes recettes</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.com"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Connexion…' : 'Se connecter'}
        </button>

        <button
          onClick={() => setShowReset(true)}
          className="w-full py-2 text-sm text-muted-foreground"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-primary font-medium">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}