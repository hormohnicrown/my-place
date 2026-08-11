'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { SignOutButton } from '@/components/navigation/SignOutButton'
import { Search, Grid, Clock, Home } from 'lucide-react'

interface ClientNavbarProps {
  userName: string
  city?: string | null
}

export function ClientNavbar({ userName, city }: ClientNavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', href: '/client', icon: Home },
    { name: 'Find Merchants', href: '/client/search', icon: Search },
    { name: 'Browse Services', href: '/client/services', icon: Grid },
    { name: 'My Requests', href: '/client/bookings', icon: Clock },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/client" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="font-bold text-xl text-gray-900">My Place</span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/client' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                {userName?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-900 leading-none">{userName}</p>
                {city && <p className="text-[10px] text-gray-500 mt-0.5">{city}</p>}
              </div>
            </div>

            <SignOutButton variant="outline" />
          </div>
        </div>
      </div>
    </header>
  )
}
