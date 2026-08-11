'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { SignOutButton } from '@/components/navigation/SignOutButton'
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Flag, 
  Rocket, 
  ShieldCheck, 
  Database 
} from 'lucide-react'

interface AdminNavbarProps {
  userName: string
}

export function AdminNavbar({ userName }: AdminNavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Verifications', href: '/admin/verification', icon: CheckCircle },
    { name: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
    { name: 'Flagged', href: '/admin/flagged-bookings', icon: Flag },
    { name: 'Launch Readiness', href: '/admin/launch-readiness', icon: Rocket },
    { name: 'Security Audit', href: '/admin/security', icon: ShieldCheck },
    { name: 'Seed Data', href: '/admin/seed-data', icon: Database },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="font-bold text-xl text-gray-900">My Place</span>
            </Link>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full border border-purple-200">
              Super-Admin
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Notification Center */}
            <NotificationBell />

            <div className="h-6 w-px bg-gray-200" />

            {/* User Profile Info */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                <span className="text-blue-700 font-bold text-xs">
                  {userName?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[140px] truncate">
                {userName}
              </span>
            </div>

            {/* Sign Out Button */}
            <SignOutButton variant="outline" />
          </div>
        </div>

        {/* Secondary Navigation Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
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
    </header>
  )
}
