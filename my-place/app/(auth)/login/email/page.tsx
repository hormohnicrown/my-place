'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithEmail } from '@/lib/auth/actions'

export default function EmailLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signInWithEmail(email, password)

      if (!result.success) {
        setError(result.error || 'Sign in failed')
        setLoading(false)
        return
      }

      // Check if this is a new user or existing user
      if (result.data?.isNewUser) {
        router.push('/onboarding')
      } else {
        // Check verification status
        if (result.data?.existingUser?.verification_status !== 'id_verified') {
          router.push('/verification')
        } else {
          const role = result.data?.existingUser?.role
          router.push(role === 'merchant' ? '/merchant' : '/client')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in with Email</CardTitle>
          <CardDescription>
            Fallback method for users without reliable SMS access
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center space-y-2 text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup/email" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  ← Back to phone login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
