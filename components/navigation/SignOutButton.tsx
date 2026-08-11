'use client'

import { useTransition } from 'react'
import { signOut } from '@/lib/auth/actions'
import { LogOut } from 'lucide-react'

interface SignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'icon'
  className?: string
}

export function SignOutButton({ variant = 'default', className = '' }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleSignOut}
        disabled={isPending}
        title="Sign Out"
        className={`p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ${className}`}
      >
        <LogOut className="w-5 h-5" />
      </button>
    )
  }

  if (variant === 'ghost') {
    return (
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className={`flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 ${className}`}
      >
        <LogOut className="w-4 h-4" />
        <span>{isPending ? 'Signing Out...' : 'Sign Out'}</span>
      </button>
    )
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50 ${className}`}
      >
        <LogOut className="w-4 h-4" />
        <span>{isPending ? 'Signing Out...' : 'Sign Out'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className={`flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 ${className}`}
    >
      <LogOut className="w-4 h-4" />
      <span>{isPending ? 'Signing Out...' : 'Sign Out'}</span>
    </button>
  )
}
