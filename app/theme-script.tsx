'use client'

// Theme blocking script to prevent FOUC
export function ThemeScript() {
  const script = `
    (function() {
      function getThemePreference() {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
          return localStorage.getItem('theme')
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      
      function setTheme(theme) {
        const resolvedTheme = theme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme
          
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(resolvedTheme)
        
        // Update meta theme-color immediately
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#1f2937' : '#3b82f6')
        }
      }
      
      setTheme(getThemePreference())
    })()
  `

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}