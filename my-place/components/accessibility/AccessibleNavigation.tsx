'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Search, Calendar, User, Phone, HelpCircle, ChevronRight } from 'lucide-react'

type NavigationProps = {
  userRole?: 'client' | 'merchant' | null
  userName?: string
}

export default function AccessibleNavigation({ userRole, userName }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  // Simple navigation items based on role
  const getNavigationItems = () => {
    if (userRole === 'client') {
      return [
        { href: '/client', label: 'Home', icon: Home, description: 'Your dashboard and overview' },
        { href: '/client/search', label: 'Find Services', icon: Search, description: 'Search for local service providers' },
        { href: '/client/bookings', label: 'My Bookings', icon: Calendar, description: 'View your booking requests and appointments' },
        { href: '/client/profile', label: 'My Profile', icon: User, description: 'Update your information and settings' }
      ]
    } else if (userRole === 'merchant') {
      return [
        { href: '/merchant', label: 'Home', icon: Home, description: 'Your business dashboard' },
        { href: '/merchant/bookings', label: 'Booking Requests', icon: Calendar, description: 'Manage incoming booking requests' },
        { href: '/merchant/listings', label: 'My Services', icon: Search, description: 'Manage your service listings' },
        { href: '/merchant/profile', label: 'Business Profile', icon: User, description: 'Update your business information' }
      ]
    } else {
      return [
        { href: '/', label: 'Home', icon: Home, description: 'Welcome to My Place' },
        { href: '/login', label: 'Sign In', icon: User, description: 'Sign in to your account' }
      ]
    }
  }

  const navigationItems = getNavigationItems()

  const isCurrentPage = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <>
      {/* Skip to content link for screen readers */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Main Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href="/"
              className="flex items-center space-x-2 text-xl font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
              aria-label="My Place - Go to homepage"
            >
              <span>My Place</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isCurrentPage(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                    aria-current={isCurrentPage(item.href) ? 'page' : undefined}
                    title={item.description}
                  >
                    <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}

              {/* Help Link */}
              <Link
                href="/help"
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Get help and support"
              >
                <HelpCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                Help
              </Link>

              {/* Contact */}
              <a
                href="tel:+2341234567890"
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                title="Call for immediate help"
              >
                <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
                Call Help
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {/* User greeting */}
              {userName && (
                <div className="px-3 py-2 text-sm text-gray-600 border-b border-gray-100 mb-3">
                  Welcome back, <span className="font-medium">{userName}</span>
                </div>
              )}

              {/* Navigation Items */}
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center justify-between w-full px-3 py-3 rounded-lg text-base font-medium transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isCurrentPage(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                    aria-current={isCurrentPage(item.href) ? 'page' : undefined}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                      <div>
                        <div>{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  </Link>
                )
              })}

              {/* Help and Contact in Mobile */}
              <div className="pt-3 mt-3 border-t border-gray-200 space-y-1">
                <Link
                  href="/help"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 mr-3" aria-hidden="true" />
                    <div>
                      <div>Help & Support</div>
                      <div className="text-xs text-gray-500">Guides and FAQs</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>

                <a
                  href="tel:+2341234567890"
                  className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-base font-medium text-green-600 hover:text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3" aria-hidden="true" />
                    <div>
                      <div>Call for Help</div>
                      <div className="text-xs text-green-500">Free support call</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumb Navigation for Deep Pages */}
      {pathname !== '/' && pathname.split('/').length > 2 && (
        <nav 
          className="bg-gray-50 border-b border-gray-200 py-2"
          role="navigation" 
          aria-label="Breadcrumb"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link 
                  href="/"
                  className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
                >
                  Home
                </Link>
              </li>
              
              {pathname.split('/').slice(1, -1).map((segment, index) => {
                const href = '/' + pathname.split('/').slice(1, index + 2).join('/')
                const label = segment.charAt(0).toUpperCase() + segment.slice(1)
                
                return (
                  <li key={href} className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-1" aria-hidden="true" />
                    <Link 
                      href={href}
                      className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
              
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" aria-hidden="true" />
                <span className="text-gray-600 font-medium">
                  {pathname.split('/').pop()?.charAt(0).toUpperCase() + pathname.split('/').pop()?.slice(1)}
                </span>
              </li>
            </ol>
          </div>
        </nav>
      )}
    </>
  )
}

// Accessible Page Header Component
export function PageHeader({ 
  title, 
  description, 
  action 
}: { 
  title: string
  description?: string
  action?: React.ReactNode 
}) {
  return (
    <header className="bg-white border-b border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 max-w-3xl">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// Accessible Alert Component
export function AccessibleAlert({ 
  type = 'info',
  title,
  message,
  action,
  onClose
}: {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  action?: React.ReactNode
  onClose?: () => void
}) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800', 
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div 
      className={`border rounded-lg p-4 ${styles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium mb-1">
            {title}
          </h3>
          <p className="text-sm">
            {message}
          </p>
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Close alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}