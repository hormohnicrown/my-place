'use client'

import { useState } from 'react'
import { Search, Phone, Mail, MessageCircle, Play, ChevronRight, ChevronDown, HelpCircle, Book, Video, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type HelpTopic = {
  id: string
  title: string
  description: string
  category: 'getting-started' | 'booking' | 'account' | 'safety' | 'payment' | 'technical'
  type: 'article' | 'video' | 'steps'
  content: string[]
  difficulty: 'easy' | 'medium' | 'advanced'
  videoUrl?: string
  relatedTopics?: string[]
}

type FAQItem = {
  question: string
  answer: string
  category: string
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'first-time-signup',
    title: 'How to Create Your Account',
    description: 'Step-by-step guide to signing up for the first time',
    category: 'getting-started',
    type: 'steps',
    difficulty: 'easy',
    content: [
      'Go to the My Place website or app',
      'Click "Get Started" or "Sign Up"',
      'Enter your phone number (example: 080 1234 5678)',
      'Check your phone for a 6-digit code',
      'Type the code you received',
      'Fill in your name and basic information',
      'Choose whether you want to find services (Client) or offer services (Merchant)',
      'Upload a photo of your ID for safety verification',
      'Wait for approval (usually within 24 hours)',
      'Start using My Place once approved!'
    ],
    relatedTopics: ['id-verification', 'choose-role']
  },
  {
    id: 'find-service-provider',
    title: 'How to Find a Service Provider',
    description: 'Learn how to search for and book local services',
    category: 'booking',
    type: 'steps',
    difficulty: 'easy',
    content: [
      'Go to "Find Services" from the main menu',
      'Choose what service you need (hair, cleaning, etc.)',
      'Enter your location or allow location access',
      'Look through the list of available providers',
      'Check their ratings (stars) and reviews',
      'Look for the green "Verified" badge for safety',
      'Click on a provider to see more details',
      'Click "Book This Service" if you like what you see',
      'Fill out the booking form with your needs',
      'Wait for the provider to accept your request'
    ],
    relatedTopics: ['make-booking', 'safety-tips']
  },
  {
    id: 'make-booking',
    title: 'How to Make a Booking Request',
    description: 'Complete guide to requesting a service',
    category: 'booking',
    type: 'steps',
    difficulty: 'easy',
    content: [
      'Choose your service provider',
      'Click "Book This Service"',
      'Describe exactly what you need (be specific!)',
      'Pick your preferred date and time',
      'Enter your complete address',
      'Add any special requests if needed',
      'Review everything to make sure it\'s correct',
      'Click "Send Booking Request"',
      'The provider will respond within 24 hours',
      'You\'ll get a notification when they accept or decline'
    ],
    relatedTopics: ['address-privacy', 'booking-status']
  },
  {
    id: 'address-privacy',
    title: 'How Your Address is Protected',
    description: 'Understanding how we keep your address private and safe',
    category: 'safety',
    type: 'article',
    difficulty: 'easy',
    content: [
      'Your full address is NEVER shown to service providers until they accept your booking',
      'Before acceptance, providers only see your general area (like "Victoria Island area")',
      'This protects your privacy and prevents unwanted contact',
      'Once a provider accepts your booking, they need your exact address to provide the service',
      'You will be notified when your address is shared',
      'Only verified, ID-checked providers can see your address',
      'Your address is never shown to other clients or the general public'
    ],
    relatedTopics: ['safety-tips', 'id-verification']
  },
  {
    id: 'gps-checkin',
    title: 'Service Check-in and Check-out',
    description: 'How GPS tracking works during your service',
    category: 'safety',
    type: 'article',
    difficulty: 'medium',
    content: [
      'When your service provider arrives, they will "check in" using GPS',
      'This records exactly when and where they started working',
      'The GPS location proves they arrived at your address',
      'When the service is finished, they will "check out"',
      'This creates a complete record of the service for safety',
      'Both you and the provider can see this GPS record',
      'This helps resolve any disputes about timing or location',
      'The GPS data is stored permanently and cannot be changed'
    ],
    relatedTopics: ['safety-tips', 'service-completion']
  },
  {
    id: 'rating-system',
    title: 'How to Rate Your Experience',
    description: 'Rating service providers and why it matters',
    category: 'booking',
    type: 'steps',
    difficulty: 'easy',
    content: [
      'After your service is completed, you can rate your experience',
      'Give 1 to 5 stars (5 being excellent, 1 being poor)',
      'Write a helpful comment about your experience',
      'Be honest - this helps other clients choose good providers',
      'The service provider can also rate you as a client',
      'Good ratings help build trust in the community',
      'Ratings cannot be changed once submitted',
      'Your rating becomes part of the provider\'s public profile'
    ],
    relatedTopics: ['service-completion', 'community-trust']
  }
]

const FAQS: FAQItem[] = [
  {
    question: 'Is My Place free to use?',
    answer: 'Yes! Creating an account and finding services is completely free for clients. You only pay the service provider directly for their work.',
    category: 'getting-started'
  },
  {
    question: 'How do I know if a service provider is trustworthy?',
    answer: 'Look for the green "Verified" badge - this means they passed ID verification. Also check their star ratings and read reviews from other clients.',
    category: 'safety'
  },
  {
    question: 'What if I need to cancel my booking?',
    answer: 'You can cancel pending bookings anytime before they are accepted. Once accepted, contact the service provider directly to discuss cancellation.',
    category: 'booking'
  },
  {
    question: 'How long does ID verification take?',
    answer: 'Usually within 24 hours. We check your ID carefully to keep everyone safe. You\'ll get a notification once you\'re approved.',
    category: 'account'
  },
  {
    question: 'Can service providers see my phone number?',
    answer: 'Only after they accept your booking request. Before acceptance, they cannot contact you directly - everything goes through the My Place system.',
    category: 'safety'
  }
]

export default function HelpSystem() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'booking', label: 'Booking Services' },
    { id: 'safety', label: 'Safety & Privacy' },
    { id: 'account', label: 'Account Help' },
    { id: 'technical', label: 'Technical Issues' }
  ]

  const filteredTopics = HELP_TOPICS.filter(topic => {
    const matchesSearch = searchQuery === '' || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const filteredFAQs = FAQS.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Help Header */}
      <header className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            How Can We Help You?
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Find answers to common questions, step-by-step guides, and get support when you need it
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Call for Help</h3>
              <p className="text-sm text-gray-600 mb-3">
                Speak with a real person who can help you right away
              </p>
              <a
                href="tel:+2341234567890"
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Call: 0123 456 7890
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 mb-3">
                Send us your question and we'll respond within 24 hours
              </p>
              <a
                href="mailto:help@myplace.com"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                help@myplace.com
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">WhatsApp Help</h3>
              <p className="text-sm text-gray-600 mb-3">
                Chat with us on WhatsApp for quick answers
              </p>
              <a
                href="https://wa.me/2341234567890"
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Chat on WhatsApp
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Help Topics */}
        {filteredTopics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Step-by-Step Guides
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map((topic) => (
                <HelpTopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {filteredFAQs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <Card key={index} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full text-left p-4 flex items-center justify-between focus:outline-none focus:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      {expandedFAQ === index ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedFAQ === index && (
                      <div className="px-4 pb-4 text-gray-600">
                        {faq.answer}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery && filteredTopics.length === 0 && filteredFAQs.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found for "{searchQuery}"
            </h3>
            <p className="text-gray-600 mb-4">
              Try different keywords or contact us directly for help
            </p>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function HelpTopicCard({ topic }: { topic: HelpTopic }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'steps': return <Book className="w-4 h-4" />
      default: return <HelpCircle className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getTypeIcon(topic.type)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {topic.title}
              </h3>
              <p className="text-sm text-gray-600">
                {topic.description}
              </p>
            </div>
          </div>
          
          <span className={`
            text-xs px-2 py-1 rounded-full font-medium flex-shrink-0
            ${getDifficultyColor(topic.difficulty)}
          `}>
            {topic.difficulty}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left flex items-center justify-between text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {isExpanded ? 'Hide Steps' : 'Show Steps'}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-4">
            <ol className="space-y-2">
              {topic.content.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 text-xs font-medium rounded-full flex items-center justify-center mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}