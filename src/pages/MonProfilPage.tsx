import { useEffect, useState } from 'react'
import { Camera, Check, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { updateMyProfile, getMyRecipesCount, getMyPublicRecipesCount } from '../services/profileService'

export default function MonProfilPage() {
  const { profile, loadProfile } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [publicRecipes, setPublicRecipes] = useState(0)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setBio(profile.bio ?? '')
      setIsPublic(profile.is_public)
    }
    getMyRecipesCount().then(setTotalRecipes)
    getMyPublicRecipesCount().then(setPublicRecipes)
  }, [profile])

  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await updateMyProfile({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      is_public: isPublic,
    })
    if (!error) {
      await loadProfile()
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 px-4 pt-safe border-b border-border">
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Mon profil</h1>
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="p-2 text-muted-foreground">
                <X size={18} />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary px-3 py-1.5"
              >
                <Check size={16} />
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-primary"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
              </span>
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                <Camera size={14} className="text-primary-foreground" />
              </button>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-lg">
              {profile.display_name ?? profile.username}
            </p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalRecipes}</p>
            <p className="text-xs text-muted-foreground mt-1">Recettes</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{publicRecipes}</p>
            <p className="text-xs text-muted-foreground mt-1">Publiques</p>
          </div>
        </div>

        {/* Édition */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Nom affiché</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profile.username}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Épicurien sportif, amateur de bonne cuisine..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Profil public</p>
                <p className="text-xs text-muted-foreground">Visible dans l'Explorer</p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.bio && (
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <p className="text-sm text-foreground">{profile.bio}</p>
              </div>
            )}
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-sm text-muted-foreground">Profil</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${profile.is_public ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {profile.is_public ? 'Public' : 'Privé'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}