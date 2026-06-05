import { NavLink } from 'react-router-dom'
import { BookOpen, CalendarDays, ShoppingCart, Compass, User } from 'lucide-react'
import { cn } from '../lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Recettes', icon: BookOpen },
  { to: '/planning', label: 'Planning', icon: CalendarDays },
  { to: '/explorer', label: 'Explorer', icon: Compass },
  { to: '/courses', label: 'Courses', icon: ShoppingCart },
  { to: '/mon-profil', label: 'Profil', icon: User },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}