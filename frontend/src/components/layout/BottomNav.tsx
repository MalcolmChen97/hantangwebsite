import { NavLink } from 'react-router-dom'
import { CalendarClock, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', icon: CalendarClock, label: '日程', end: true },
  { to: '/patients', icon: Users, label: '患者' },
  { to: '/calendar', icon: Calendar, label: '日历' },
]

export function BottomNav() {
  return (
    <nav className="bg-card/95 backdrop-blur-md border-t border-border" style={{ paddingBottom: 'var(--safe-area-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
