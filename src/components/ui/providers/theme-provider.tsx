'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Theme = 'light' | 'dark' | 'auto' | 'jardin'
type SystemTheme = 'light' | 'dark'

interface CustomThemeSettings {
  primaryColor?: string
  accentColor?: string
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  fontSize?: 'sm' | 'md' | 'lg' | 'xl'
  density?: 'compact' | 'comfortable' | 'spacious'
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  systemTheme: SystemTheme
  resolvedTheme: 'light' | 'dark'
  customSettings: CustomThemeSettings
  updateCustomSettings: (settings: Partial<CustomThemeSettings>) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  customSettings?: CustomThemeSettings
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  customSettings: initialCustomSettings = {}
}: ThemeProviderProps) {
  const { data: session } = useSession()
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<SystemTheme>('light')
  const [customSettings, setCustomSettings] = useState<CustomThemeSettings>(initialCustomSettings)
  const [isLoading, setIsLoading] = useState(true)

  // Détecter le thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    // Initial check
    updateSystemTheme()

    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemTheme)
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  // Charger les préférences depuis localStorage et/ou session
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        // Charger depuis localStorage
        const localTheme = localStorage.getItem('bas-malin-theme') as Theme
        const localCustomSettings = localStorage.getItem('bas-malin-custom-settings')
        
        if (localTheme && ['light', 'dark', 'auto', 'jardin'].includes(localTheme)) {
          setThemeState(localTheme)
        }
        
        if (localCustomSettings) {
          try {
            const parsedSettings = JSON.parse(localCustomSettings)
            setCustomSettings(prev => ({ ...prev, ...parsedSettings }))
          } catch (error) {
            console.warn('Failed to parse custom theme settings:', error)
          }
        }

        // Si l'utilisateur est connecté, charger ses préférences depuis la base
        if (session?.user?.id) {
          try {
            const response = await fetch(`/api/user/preferences?userId=${session.user.id}`)
            if (response.ok) {
              const preferences = await response.json()
              
              if (preferences.theme) {
                setThemeState(preferences.theme)
              }
              
              if (preferences.customTheme) {
                setCustomSettings(prev => ({ ...prev, ...preferences.customTheme }))
              }
            }
          } catch (error) {
            console.warn('Failed to load user preferences:', error)
          }
        }
      } catch (error) {
        console.error('Error loading theme preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadThemePreferences()
  }, [session?.user?.id])

  // Calculer le thème résolu
  const resolvedTheme: 'light' | 'dark' = 
    theme === 'auto' ? systemTheme :
    theme === 'jardin' ? 'light' :
    theme

  // Sauvegarder les préférences
  const savePreferences = async (newTheme: Theme, newCustomSettings: CustomThemeSettings) => {
    try {
      // Sauvegarder dans localStorage
      localStorage.setItem('bas-malin-theme', newTheme)
      localStorage.setItem('bas-malin-custom-settings', JSON.stringify(newCustomSettings))

      // Si l'utilisateur est connecté, sauvegarder dans la base
      if (session?.user?.id) {
        await fetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: newTheme,
            customTheme: newCustomSettings
          })
        })
      }
    } catch (error) {
      console.error('Error saving theme preferences:', error)
    }
  }

  // Mettre à jour le thème
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    savePreferences(newTheme, customSettings)
  }

  // Mettre à jour les paramètres personnalisés
  const updateCustomSettings = (newSettings: Partial<CustomThemeSettings>) => {
    const updatedSettings = { ...customSettings, ...newSettings }
    setCustomSettings(updatedSettings)
    savePreferences(theme, updatedSettings)
  }

  // Appliquer le thème au document
  useEffect(() => {
    if (isLoading) return

    const root = document.documentElement
    
    // Supprimer les anciennes classes
    root.classList.remove('light', 'dark', 'jardin')
    
    // Ajouter la nouvelle classe
    if (theme === 'jardin') {
      root.classList.add('jardin')
    } else {
      root.classList.add(resolvedTheme)
    }

    // Appliquer les paramètres personnalisés
    if (customSettings.primaryColor) {
      root.style.setProperty('--primary-color', customSettings.primaryColor)
    }
    
    if (customSettings.accentColor) {
      root.style.setProperty('--accent-color', customSettings.accentColor)
    }
    
    if (customSettings.borderRadius) {
      root.style.setProperty('--border-radius-scale', customSettings.borderRadius)
    }
    
    if (customSettings.fontSize) {
      root.style.setProperty('--font-size-scale', customSettings.fontSize)
    }
    
    if (customSettings.density) {
      root.style.setProperty('--spacing-density', customSettings.density)
    }

    // Mettre à jour la méta couleur du navigateur
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const themeColors = {
        light: '#ffffff',
        dark: '#0a0a0a',
        jardin: '#f0f9f0'
      }
      
      const color = theme === 'jardin' ? themeColors.jardin : 
                   resolvedTheme === 'dark' ? themeColors.dark : themeColors.light
      
      metaThemeColor.setAttribute('content', color)
    }
  }, [theme, resolvedTheme, customSettings, isLoading])

  const value: ThemeContextType = {
    theme,
    setTheme,
    systemTheme,
    resolvedTheme,
    customSettings,
    updateCustomSettings,
    isLoading
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

// Hook pour détecter le device type
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | 'tv'>('desktop')

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Détection TV (résolution haute + User-Agent ou ratio)
      if (width >= 1920 && height >= 1080) {
        if (userAgent.includes('tv') || 
            userAgent.includes('smart-tv') || 
            userAgent.includes('crkey') || // Chromecast
            width >= 3840) { // 4K
          return 'tv'
        }
      }
      
      // Mobile
      if (width < 768) {
        return 'mobile'
      }
      
      // Tablet
      if (width >= 768 && width < 1024) {
        return 'tablet'
      }
      
      // Desktop par défaut
      return 'desktop'
    }

    const updateDeviceType = () => {
      setDeviceType(detectDevice())
    }

    // Initial detection
    updateDeviceType()

    // Listen for resize
    window.addEventListener('resize', updateDeviceType)
    
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  return deviceType
}