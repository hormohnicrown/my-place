import { ArrowLeft, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-50 border-b border-blue-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Accessibility Statement
          </h1>
          <p className="text-lg text-gray-600">
            Our commitment to making My Place accessible to everyone
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Our Commitment */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Commitment</h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              My Place is committed to ensuring that our platform is accessible to people with disabilities 
              and those with varying levels of digital literacy. We believe everyone should have equal access 
              to find and offer local services in their communities.
            </p>
            
            <p className="text-gray-700 leading-relaxed">
              We are continuously working to improve the accessibility of our platform and welcome feedback 
              on how we can better serve all users.
            </p>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Accessibility Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Visual Accessibility</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">High Color Contrast</p>
                    <p className="text-sm text-gray-600">Minimum 4.5:1 contrast ratio for all text</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Large Text Options</p>
                    <p className="text-sm text-gray-600">Ability to increase text size up to 120%</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Clear Visual Hierarchy</p>
                    <p className="text-sm text-gray-600">Consistent headings and logical page structure</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Color Independence</p>
                    <p className="text-sm text-gray-600">Information not conveyed by color alone</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Navigation & Interaction</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Keyboard Navigation</p>
                    <p className="text-sm text-gray-600">Full functionality available via keyboard</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Screen Reader Support</p>
                    <p className="text-sm text-gray-600">Proper ARIA labels and semantic HTML</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Touch-Friendly Design</p>
                    <p className="text-sm text-gray-600">Minimum 44px touch targets for mobile</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Skip Navigation Links</p>
                    <p className="text-sm text-gray-600">Quick access to main content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Digital Literacy Support */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Support for All Digital Skill Levels</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Designed for Everyone
            </h3>
            <p className="text-blue-800 leading-relaxed">
              We understand that not everyone has the same level of comfort with technology. 
              My Place is designed to be simple and intuitive for users of all digital literacy levels.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Language & Communication</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Plain English throughout (Grade 8 reading level)</li>
                <li>• Clear, step-by-step instructions</li>
                <li>• Helpful examples and explanations</li>
                <li>• Positive, encouraging tone</li>
                <li>• Technical terms replaced with everyday language</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Simplified User Experience</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• One main action per page</li>
                <li>• Progress indicators for multi-step processes</li>
                <li>• Large buttons with clear labels</li>
                <li>• Confirmation messages for important actions</li>
                <li>• Easy way to undo or go back</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Standards Compliance */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Standards & Guidelines</h2>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              My Place is designed to meet or exceed the following accessibility standards:
            </p>
            
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span><strong>WCAG 2.1 Level AA</strong> - Web Content Accessibility Guidelines</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span><strong>Section 508</strong> - U.S. Federal accessibility standards</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span><strong>EN 301 549</strong> - European accessibility standard</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Known Issues */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Known Issues & Improvements</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-2">Areas We're Working On</h3>
                <p className="text-yellow-800 text-sm">
                  We are continuously improving our platform. Here are some areas where we're currently working to enhance accessibility:
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-gray-900">Video Content</h4>
              <p className="text-sm text-gray-600 mt-1">
                Adding closed captions and audio descriptions to help videos and tutorials
              </p>
              <p className="text-xs text-gray-500 mt-1">Target completion: Next update</p>
            </div>
            
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-gray-900">Voice Interface</h4>
              <p className="text-sm text-gray-600 mt-1">
                Exploring voice navigation options for users with motor disabilities
              </p>
              <p className="text-xs text-gray-500 mt-1">Target completion: Future release</p>
            </div>
            
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-gray-900">Offline Support</h4>
              <p className="text-sm text-gray-600 mt-1">
                Better functionality when internet connection is poor or intermittent
              </p>
            </div>
          </div>
        </section>

        {/* Testing & Feedback */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Testing & User Feedback</h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              We regularly test our platform with users who have disabilities and varying levels of digital literacy. 
              This includes testing with screen readers, keyboard navigation, and high contrast displays.
            </p>
            
            <p className="text-gray-700 leading-relaxed">
              We also conduct usability testing with older adults and users who are new to digital platforms 
              to ensure our interface is intuitive and easy to use for everyone.
            </p>
          </div>
        </section>

        {/* Contact & Support */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get Accessibility Support</h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-green-900 mb-4">
              We're Here to Help
            </h3>
            <p className="text-green-800 leading-relaxed mb-4">
              If you encounter any accessibility barriers or need assistance using My Place, 
              please don't hesitate to contact us. We're committed to helping you access our services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Phone className="w-6 h-6 text-green-600 mr-3" />
                <h4 className="font-medium text-gray-900">Phone Support</h4>
              </div>
              <p className="text-gray-600 mb-2">
                Call us for immediate assistance with accessibility issues
              </p>
              <a 
                href="tel:+2341234567890"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                0123 456 7890
              </a>
              <p className="text-xs text-gray-500 mt-1">
                Available Monday-Friday, 9 AM - 6 PM WAT
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Mail className="w-6 h-6 text-blue-600 mr-3" />
                <h4 className="font-medium text-gray-900">Email Support</h4>
              </div>
              <p className="text-gray-600 mb-2">
                Send us your accessibility feedback or requests for assistance
              </p>
              <a 
                href="mailto:accessibility@myplace.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                accessibility@myplace.com
              </a>
              <p className="text-xs text-gray-500 mt-1">
                We respond within 24 hours
              </p>
            </div>
          </div>
        </section>

        {/* Last Updated */}
        <section className="border-t border-gray-200 pt-8">
          <div className="text-center text-gray-500">
            <p className="text-sm">
              This accessibility statement was last updated on <strong>August 10, 2026</strong>
            </p>
            <p className="text-xs mt-2">
              We review and update this statement regularly as we improve our platform
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}