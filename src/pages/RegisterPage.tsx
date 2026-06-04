import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const { signUp } = useAuthStore()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username || !email || !password) {
      setError('Remplis tous les champs')
      return
    }
    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit faire au moins 3 caractères')
      return
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      setError('Nom d\'utilisateur : lettres minuscules, chiffres, - et _ uniquement')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères')
      return
    }

    setIsLoading(true)
    setError(null)

    const { error } = await signUp(email, password, username)

    if (error) {
      setError(error)
      setIsLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">Créer un compte</h1>
        <p className="text-muted-foreground mt-1">Ta bibliothèque de recettes t'attend</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="epicurien_sportif"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Lettres minuscules, chiffres, - et _ uniquement
          </p>
        </div>

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
            placeholder="8 caractères minimum"
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
          {isLoading ? 'Création…' : 'Créer mon compte'}
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-primary font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  )
}