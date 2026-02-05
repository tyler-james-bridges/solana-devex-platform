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

        // Update CSS variables for additional robustness
        const root = document.documentElement
        if (resolvedTheme === 'dark') {
          root.style.setProperty('--bg-primary', '#111827')
          root.style.setProperty('--bg-secondary', '#1f2937')
          root.style.setProperty('--text-primary', '#f9fafb')
          root.style.setProperty('--text-secondary', '#d1d5db')
          root.style.setProperty('--border-color', '#374151')
        } else {
          root.style.setProperty('--bg-primary', '#ffffff')
          root.style.setProperty('--bg-secondary', '#f8fafc') 
          root.style.setProperty('--text-primary', '#1f2937')
          root.style.setProperty('--text-secondary', '#6b7280')
          root.style.setProperty('--border-color', '#e5e7eb')
        }
      }
      
      setTheme(getThemePreference())
    })()
  `

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}