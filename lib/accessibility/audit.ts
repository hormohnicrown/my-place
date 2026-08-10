'use server'

// Accessibility and Digital Literacy Audit System
// For identifying and fixing usability issues for low digital-literacy users

export type AccessibilityIssue = {
  component: string
  severity: 'critical' | 'major' | 'minor'
  category: 'language' | 'navigation' | 'visual' | 'cognitive' | 'motor' | 'technical'
  issue: string
  recommendation: string
  user_impact: string
}

export type UsabilityReport = {
  overall_score: number
  total_issues: number
  critical_issues: number
  major_issues: number
  minor_issues: number
  issues: AccessibilityIssue[]
  recommendations: string[]
}

// =============================================================================
// ACCESSIBILITY GUIDELINES FOR MY PLACE
// =============================================================================

export const ACCESSIBILITY_GUIDELINES = {
  // Language and Communication
  language: {
    plain_english: "Use simple, conversational language. Avoid technical jargon.",
    clear_instructions: "Provide step-by-step guidance with numbered steps.",
    positive_messaging: "Use encouraging, supportive tone throughout.",
    error_messages: "Explain what went wrong and how to fix it in simple terms.",
    success_feedback: "Celebrate user achievements with clear confirmation messages."
  },
  
  // Visual Design
  visual: {
    text_size: "Minimum 16px font size for body text, 18px preferred.",
    contrast_ratio: "Minimum 4.5:1 contrast ratio for normal text, 3:1 for large text.",
    color_coding: "Never use color alone to convey information. Always include text/icons.",
    spacing: "Adequate white space between interactive elements (minimum 44px touch targets).",
    visual_hierarchy: "Clear headings, consistent styling, logical flow."
  },
  
  // Navigation and Interaction
  navigation: {
    breadcrumbs: "Show users where they are and how to go back.",
    progress_indicators: "Show progress through multi-step processes.",
    clear_buttons: "Button text describes the action (e.g., 'Send Code' not 'Submit').",
    error_prevention: "Prevent errors before they happen with validation.",
    undo_actions: "Allow users to easily undo or go back."
  },
  
  // Cognitive Load
  cognitive: {
    one_thing_per_page: "Focus on single primary action per page.",
    chunking: "Break complex information into digestible chunks.",
    familiar_patterns: "Use standard web conventions users already know.",
    minimal_choices: "Limit options to prevent decision paralysis.",
    persistent_help: "Always provide help and support options."
  },
  
  // Technical Accessibility
  technical: {
    keyboard_navigation: "All functionality available via keyboard.",
    screen_reader_support: "Proper ARIA labels and semantic HTML.",
    loading_states: "Clear loading indicators for slow connections.",
    offline_tolerance: "Graceful degradation when network is poor.",
    mobile_optimized: "Touch-friendly design for mobile devices."
  }
}

// =============================================================================
// USABILITY ISSUES IDENTIFIED IN CURRENT SYSTEM
// =============================================================================

export const CURRENT_ACCESSIBILITY_ISSUES: AccessibilityIssue[] = [
  // Authentication Flow Issues
  {
    component: "Login Page",
    severity: "critical",
    category: "language",
    issue: "Technical terms like 'OTP' without explanation",
    recommendation: "Replace 'OTP' with 'verification code' and add explanation",
    user_impact: "Users may not understand what OTP means and abandon signup"
  },
  {
    component: "Phone Input",
    severity: "major", 
    category: "cognitive",
    issue: "No format example or guidance for phone number entry",
    recommendation: "Show format example: '080 1234 5678' and auto-format input",
    user_impact: "Users unsure of correct phone format may enter invalid numbers"
  },
  {
    component: "Verification Process",
    severity: "major",
    category: "navigation",
    issue: "No clear progress indication through multi-step signup",
    recommendation: "Add step-by-step progress bar: 'Step 1 of 3: Phone Number'",
    user_impact: "Users don't know how many steps remain, may abandon process"
  },
  
  // Navigation Issues  
  {
    component: "Main Navigation",
    severity: "major",
    category: "cognitive",
    issue: "Too many options in main menu without clear hierarchy",
    recommendation: "Simplify to 3-4 main actions, use familiar icons with text",
    user_impact: "Decision paralysis, users can't find what they need quickly"
  },
  {
    component: "Breadcrumbs",
    severity: "minor",
    category: "navigation", 
    issue: "Missing breadcrumbs on deep pages",
    recommendation: "Add breadcrumbs showing: Home > Bookings > Request Details",
    user_impact: "Users get lost in deep pages, don't know how to navigate back"
  },
  
  // Form and Input Issues
  {
    component: "Booking Form",
    severity: "critical",
    category: "cognitive",
    issue: "Complex multi-field form presented all at once",
    recommendation: "Break into wizard: Service → Date/Time → Address → Confirm",
    user_impact: "Form abandonment due to cognitive overload"
  },
  {
    component: "Date/Time Picker", 
    severity: "major",
    category: "motor",
    issue: "Small calendar widget difficult to use on mobile",
    recommendation: "Use large, touch-friendly date selection with common options",
    user_impact: "Difficulty selecting dates, especially for users with motor issues"
  },
  
  // Visual and Design Issues
  {
    component: "Error Messages",
    severity: "major",
    category: "language",
    issue: "Technical error messages: 'Validation failed' instead of helpful guidance",
    recommendation: "Plain English errors: 'Please check your phone number format'",
    user_impact: "Users don't understand what went wrong or how to fix it"
  },
  {
    component: "Button Labels",
    severity: "minor", 
    category: "language",
    issue: "Generic button text: 'Submit', 'Continue' without context",
    recommendation: "Specific actions: 'Send Verification Code', 'Book This Service'",
    user_impact: "Users unsure what will happen when they click buttons"
  },
  {
    component: "Loading States",
    severity: "major",
    category: "technical",
    issue: "No loading indicators, users unsure if action is processing",
    recommendation: "Clear loading spinners with descriptive text: 'Sending code...'",
    user_impact: "Users may click multiple times or think system is broken"
  },
  
  // Trust and Security Communication
  {
    component: "ID Verification",
    severity: "critical",
    category: "language",
    issue: "Unclear why ID verification is required, seems invasive",
    recommendation: "Explain benefits: 'This keeps everyone safe and builds trust'",
    user_impact: "Users abandon signup due to privacy concerns"
  },
  {
    component: "Data Privacy",
    severity: "major",
    category: "language", 
    issue: "No clear explanation of how personal data is protected",
    recommendation: "Simple privacy explanation: 'Your address stays private until booking'",
    user_impact: "Users concerned about sharing personal information"
  },
  
  // Mobile Experience Issues
  {
    component: "Mobile Navigation",
    severity: "major",
    category: "motor",
    issue: "Touch targets smaller than 44px, difficult to tap accurately", 
    recommendation: "Increase button size, add more spacing between elements",
    user_impact: "Accidental taps, frustration with interface on mobile"
  },
  {
    component: "Mobile Forms",
    severity: "major",
    category: "visual",
    issue: "Form fields too small, labels overlap on small screens",
    recommendation: "Larger input fields, clear spacing, proper responsive design",
    user_impact: "Difficulty filling forms on mobile devices"
  }
]

// =============================================================================
// USABILITY IMPROVEMENTS CHECKLIST
// =============================================================================

export const USABILITY_IMPROVEMENTS = {
  immediate_fixes: [
    "Replace 'OTP' with 'verification code' everywhere",
    "Add phone number format examples and auto-formatting",
    "Simplify error messages to plain English",
    "Add loading states with descriptive text",
    "Increase touch target sizes to minimum 44px",
    "Add step-by-step progress indicators"
  ],
  
  language_improvements: [
    "Review all copy for plain English (Grade 8 reading level)",
    "Replace technical terms with everyday language", 
    "Add helpful explanations for required actions",
    "Use positive, encouraging tone throughout",
    "Provide clear success and error messaging"
  ],
  
  navigation_improvements: [
    "Simplify main navigation to 3-4 core actions",
    "Add breadcrumb navigation on all deep pages",
    "Use familiar icons with text labels",
    "Provide clear 'back' and 'home' options",
    "Show current page/step in multi-step processes"
  ],
  
  form_improvements: [
    "Break complex forms into step-by-step wizards",
    "Provide format examples for all inputs",
    "Use auto-formatting where possible",
    "Add inline validation with helpful messages",
    "Allow easy correction of mistakes"
  ],
  
  trust_building: [
    "Explain why information is needed",
    "Show security badges and trust signals",
    "Provide clear privacy explanations",
    "Display verification status prominently", 
    "Show community and safety benefits"
  ]
}

// =============================================================================
// DIGITAL LITERACY SUPPORT FEATURES
// =============================================================================

export const DIGITAL_LITERACY_FEATURES = {
  help_system: {
    contextual_help: "Help tooltips and explanations on every page",
    video_guides: "Short video tutorials for key actions",
    phone_support: "Easy access to human help via phone",
    faq_integration: "Common questions answered in context"
  },
  
  progressive_disclosure: {
    simple_mode: "Hide advanced features initially",
    guided_tours: "Optional walkthrough of key features", 
    smart_defaults: "Pre-fill forms with sensible defaults",
    adaptive_ui: "Adjust complexity based on user confidence"
  },
  
  error_recovery: {
    undo_actions: "Easy way to reverse accidental actions",
    draft_saving: "Auto-save form progress",
    clear_recovery: "Simple steps to fix common mistakes",
    patient_design: "No timeouts or pressure for speed"
  },
  
  confidence_building: [
    "Celebrate small victories with positive feedback",
    "Provide reassurance about safety and privacy",
    "Use familiar real-world metaphors",
    "Show other users' success stories",
    "Build trust through transparency"
  ]
}

// =============================================================================
// ACCESSIBILITY TESTING FUNCTIONS
// =============================================================================

export function generateUsabilityReport(): UsabilityReport {
  const issues = CURRENT_ACCESSIBILITY_ISSUES
  const critical = issues.filter(i => i.severity === 'critical').length
  const major = issues.filter(i => i.severity === 'major').length
  const minor = issues.filter(i => i.severity === 'minor').length
  
  // Calculate score: 100 - (critical*20 + major*10 + minor*5)
  const score = Math.max(0, 100 - (critical * 20 + major * 10 + minor * 5))
  
  return {
    overall_score: score,
    total_issues: issues.length,
    critical_issues: critical,
    major_issues: major, 
    minor_issues: minor,
    issues: issues,
    recommendations: [
      "Focus on critical issues first - they block user success",
      "Simplify language throughout the entire application",
      "Break complex processes into simple steps",
      "Add progress indicators and clear navigation",
      "Test with actual low-digital-literacy users"
    ]
  }
}

export function getImprovementPriority(issue: AccessibilityIssue): number {
  const severityWeight = {
    critical: 100,
    major: 50,
    minor: 10
  }
  
  const categoryWeight = {
    language: 1.5,  // Language issues affect comprehension most
    cognitive: 1.4, // Cognitive load affects task completion
    navigation: 1.3, // Navigation affects user success
    visual: 1.2,    // Visual issues affect accessibility
    motor: 1.1,     // Motor issues affect usability  
    technical: 1.0  // Technical issues are important but users adapt
  }
  
  return severityWeight[issue.severity] * categoryWeight[issue.category]
}

// =============================================================================
// PLAIN LANGUAGE CHECKER
// =============================================================================

export function checkPlainLanguage(text: string): {
  reading_level: number
  issues: string[]
  suggestions: string[]
  score: number
} {
  // Simplified plain language analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  
  const avgWordsPerSentence = words.length / sentences.length
  const longWords = words.filter(w => w.length > 6).length
  const longWordPercentage = (longWords / words.length) * 100
  
  // Simplified reading level calculation (Flesch-Kincaid approximation)
  const readingLevel = 0.39 * avgWordsPerSentence + 11.8 * (longWords / words.length) - 15.59
  
  const issues = []
  const suggestions = []
  
  if (readingLevel > 8) {
    issues.push("Text is too complex for general audience")
    suggestions.push("Use shorter sentences and simpler words")
  }
  
  if (avgWordsPerSentence > 15) {
    issues.push("Sentences are too long")
    suggestions.push("Break long sentences into shorter ones")
  }
  
  if (longWordPercentage > 15) {
    issues.push("Too many complex words")
    suggestions.push("Replace complex words with simpler alternatives")
  }
  
  // Technical terms that should be avoided or explained
  const technicalTerms = ['API', 'OTP', 'verification', 'authentication', 'validation']
  const foundTechnical = technicalTerms.filter(term => 
    text.toLowerCase().includes(term.toLowerCase())
  )
  
  if (foundTechnical.length > 0) {
    issues.push(`Technical terms found: ${foundTechnical.join(', ')}`)
    suggestions.push("Replace technical terms with everyday language or add explanations")
  }
  
  const score = Math.max(0, 100 - (issues.length * 20))
  
  return {
    reading_level: Math.round(readingLevel * 10) / 10,
    issues,
    suggestions,
    score
  }
}

// =============================================================================
// USABILITY TESTING SCENARIOS
// =============================================================================

export const USABILITY_TEST_SCENARIOS = [
  {
    name: "First-time user signup",
    description: "New user trying to create account and get verified",
    user_profile: "Low digital literacy, age 45+, using mobile phone",
    success_criteria: "Complete signup and verification within 10 minutes without help",
    pain_points: ["Phone number format confusion", "OTP terminology", "Long form"]
  },
  {
    name: "Finding and booking service", 
    description: "Client searching for hairdresser and making first booking",
    user_profile: "Basic digital skills, unfamiliar with app, safety-conscious",
    success_criteria: "Find suitable merchant and complete booking request",
    pain_points: ["Too many options", "Unclear pricing", "Privacy concerns"]
  },
  {
    name: "Merchant accepting booking",
    description: "Service provider responding to booking request",
    user_profile: "Busy professional, limited time, using phone between clients", 
    success_criteria: "View request details and accept/decline quickly",
    pain_points: ["Information overload", "Unclear next steps", "Small buttons"]
  },
  {
    name: "Service completion flow",
    description: "GPS check-in, service delivery, check-out, and rating",
    user_profile: "Both parties using app during actual service",
    success_criteria: "Complete service flow and mutual rating successfully",
    pain_points: ["GPS confusion", "Complex rating process", "Technical errors"]
  }
]