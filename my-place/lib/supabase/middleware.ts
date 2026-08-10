import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // =============================================================================
  // PROTECTED ROUTES & VERIFICATION GATE LOGIC
  // =============================================================================

  // Public routes (accessible without auth)
  const publicRoutes = ['/', '/login', '/login/email', '/signup', '/signup/email']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Auth routes (accessible only when NOT authenticated)
  const authRoutes = ['/login', '/login/email', '/signup', '/signup/email']
  const isAuthRoute = authRoutes.includes(pathname)

  // Onboarding routes (accessible after auth but before profile completion)
  const onboardingRoutes = ['/onboarding', '/verification']
  const isOnboardingRoute = onboardingRoutes.includes(pathname)

  // Protected routes requiring full verification
  const protectedPrefixes = ['/client', '/merchant', '/api']
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  // If user is not authenticated
  if (!authUser) {
    // Allow access to public and auth routes
    if (isPublicRoute || isAuthRoute) {
      return supabaseResponse
    }
    // Redirect to login for everything else
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // User is authenticated - get their profile data
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, role, verification_status')
    .eq('auth_user_id', authUser.id)
    .single()

  // If authenticated but no profile exists → redirect to onboarding
  if (!userProfile && !isOnboardingRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/onboarding'
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated but NOT verified → HARD GATE (non-negotiable requirement)
  if (userProfile && userProfile.verification_status !== 'id_verified') {
    // Allow access to verification page
    if (pathname === '/verification') {
      return supabaseResponse
    }
    // Block everything else and redirect to verification
    if (!pathname.startsWith('/verification')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/verification'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If authenticated and verified → allow access to protected routes
  if (userProfile && userProfile.verification_status === 'id_verified') {
    // Redirect away from auth/onboarding routes to dashboard
    if (isAuthRoute || isOnboardingRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = userProfile.role === 'merchant' ? '/merchant' : '/client'
      return NextResponse.redirect(redirectUrl)
    }

    // Role-based route protection
    if (pathname.startsWith('/merchant') && userProfile.role !== 'merchant') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/client'
      return NextResponse.redirect(redirectUrl)
    }

    if (pathname.startsWith('/client') && userProfile.role !== 'client') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/merchant'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
