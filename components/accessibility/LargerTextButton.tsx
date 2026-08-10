'use client'

// Toggles the root font size between 100% and 120%. This needs a click
// handler, so it lives in its own client component and the root layout
// (a server component) can render it without becoming a client component.
export function LargerTextButton() {
  const toggleFontSize = () => {
    const root = document.documentElement
    root.style.fontSize = root.style.fontSize === '120%' ? '100%' : '120%'
  }

  return (
    <button
      onClick={toggleFontSize}
      className="block text-gray-600 hover:text-gray-900 text-sm transition-colors text-left"
    >
      🔍 Larger Text
    </button>
  )
}
