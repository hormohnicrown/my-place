'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithEmail, signUpWithEmail } from '@/lib/auth/actions'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleSignIn = async () => {
    const result = await signInWithEmail(email, password)

    if (!result.success) {
      setError(result.error || 'Sign in failed')
      setLoading(false)
      return
    }

    // New auth account with no profile row yet, or an existing one.
    if (result.data?.isNewUser) {
      router.push('/onboarding')
      return
    }

    const role = result.data?.existingUser?.role
    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'merchant') {
      router.push('/merchant')
    } else {
      router.push('/client')
    }
  }

  const handleSignUp = async () => {
    const result = await signUpWithEmail(email, password)

    if (!result.success) {
      setError(result.error || 'Sign up failed')
      setLoading(false)
      return
    }

    // Email confirmation off: session is live, continue to onboarding.
    // Email confirmation on: no session yet, tell the user to confirm first.
    if (result.data?.session) {
      router.push('/onboarding')
    } else {
      setNotice('Account created. Check your email to confirm, then sign in.')
      setMode('signin')
      setPassword('')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        await handleSignIn()
      } else {
        await handleSignUp()
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setNotice('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'signin' ? 'Sign in to My Place' : 'Create your account'}</CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'Enter your email and password to continue'
              : 'Sign up with your email and a password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {notice && <p className="text-sm text-green-600">{notice}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === 'signin' ? 'Signing in...' : 'Creating account...'
                : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {mode === 'signin' ? (
                <p>
                  New to My Place?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-primary hover:underline"
                    disabled={loading}
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-primary hover:underline"
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
