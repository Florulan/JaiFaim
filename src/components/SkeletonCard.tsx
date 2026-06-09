export function SkeletonRecipeCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary rounded-full w-3/4" />
          <div className="h-3 bg-secondary rounded-full w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonExplorerCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary rounded-full w-2/3" />
          <div className="h-3 bg-secondary rounded-full w-1/2" />
        </div>
        <div className="w-16 h-7 bg-secondary rounded-xl shrink-0" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-secondary rounded-full" />
        <div className="h-5 w-20 bg-secondary rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonProfil() {
  return (
    <div className="px-4 py-6 space-y-6 animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-secondary" />
        <div className="space-y-2 flex flex-col items-center">
          <div className="h-5 w-32 bg-secondary rounded-full" />
          <div className="h-3 w-24 bg-secondary rounded-full" />
        </div>
        <div className="h-9 w-28 bg-secondary rounded-xl" />
      </div>
      <div className="h-20 bg-secondary rounded-2xl" />
      <div className="space-y-2">
        {[1,2,3].map((i) => (
          <div key={i} className="h-16 bg-secondary rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
