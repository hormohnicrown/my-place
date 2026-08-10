import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LargerTextButton } from "@/components/accessibility/LargerTextButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Place - Local Services Marketplace",
  description: "Find trusted local service providers for beauty, cleaning, and more in Nigeria. Verified professionals, GPS tracking, and community ratings.",
  keywords: "Nigeria, local services, hairdressing, cleaning, beauty, home services, verified professionals",
  authors: [{ name: "My Place Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Accessibility and Performance */}
        <meta name="color-scheme" content="light" />
        <meta name="format-detection" content="telephone=yes" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My Place" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Skip to main content for screen readers */}
        <a 
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 font-medium"
        >
          Skip to main content
        </a>

        {/* High contrast mode detection */}
        <div className="sr-only" aria-live="polite" id="accessibility-announcements"></div>

        {/* Main Application */}
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <main id="main-content" className="flex-1" role="main">
            {children}
          </main>

          {/* Accessible Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto" role="contentinfo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">My Place</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Connecting you with trusted local service providers across Nigeria. 
                    Safe, verified, and community-rated.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Quick Links</h4>
                  <nav aria-label="Footer navigation">
                    <ul className="space-y-2">
                      <li>
                        <a href="/help" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                          Help & Support
                        </a>
                      </li>
                      <li>
                        <a href="/safety" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                          Safety Center
                        </a>
                      </li>
                      <li>
                        <a href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                          Privacy Policy
                        </a>
                      </li>
                      <li>
                        <a href="/terms" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                          Terms of Service
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Get Help</h4>
                  <div className="space-y-2">
                    <a 
                      href="tel:+2341234567890"
                      className="flex items-center text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                      📞 Call Support
                    </a>
                    <a 
                      href="mailto:help@myplace.com"
                      className="flex items-center text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                      ✉️ Email Help
                    </a>
                    <a 
                      href="https://wa.me/2341234567890"
                      className="flex items-center text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                {/* Accessibility */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Accessibility</h4>
                  <div className="space-y-2">
                    <LargerTextButton />
                    <a
                      href="/accessibility"
                      className="block text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                      ♿ Accessibility Statement
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <p className="text-gray-500 text-sm">
                  © 2026 My Place. Made with ❤️ for Nigerian communities.
                </p>
              </div>
            </div>
          </footer>
        </div>

        {/* Screen reader announcements */}
        <div id="screen-reader-announcements" className="sr-only" aria-live="polite" aria-atomic="true"></div>
      </body>
    </html>
  );
}
