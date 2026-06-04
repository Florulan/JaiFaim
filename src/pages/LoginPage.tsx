import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const { signIn } = useAuthStore()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Connexion…' : 'Se connecter'}
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