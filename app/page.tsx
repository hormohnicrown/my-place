import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary">My Place</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Connect with Skilled<br />Local Artisans
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find verified tailors, carpenters, welders, and plumbers in your neighborhood across Nigeria
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Find Artisans</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">I'm an Artisan</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">ID Verified</h3>
              <p className="text-muted-foreground">
                All users verify their identity for your safety and peace of mind
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-2">GPS Tracking</h3>
              <p className="text-muted-foreground">
                Every service tracked with check-in/check-out for complete transparency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Two-Way Ratings</h3>
              <p className="text-muted-foreground">
                Build trust with verified reviews from real completed services
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Service Categories */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Available Services</h3>
          <p className="text-muted-foreground mb-8">
            Launch verticals - more categories coming soon
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Tailoring', icon: '👔' },
              { name: 'Carpentry', icon: '🔨' },
              { name: 'Welding', icon: '🔧' },
              { name: 'Plumbing', icon: '🚰' },
            ].map((category) => (
              <div
                key={category.name}
                className="p-6 border rounded-lg bg-white hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <p className="font-medium">{category.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h3>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join My Place today. Whether you're looking for skilled artisans or offering your services,
            we make it safe and easy.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Sign Up Now
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}
