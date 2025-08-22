import colors from './colors.json'
import typography from './typography.json'
import spacing from './spacing.json'

export interface DesignTokens {
  colors: typeof colors.colors
  typography: typeof typography.typography
  spacing: typeof spacing.spacing
}

export const designTokens: DesignTokens = {
  colors: colors.colors,
  typography: typography.typography,
  spacing: spacing.spacing
}

// Utilitaires pour accéder aux tokens
export const getColor = (path: string) => {
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = designTokens.colors
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value as string
}

export const getTypography = (path: string) => {
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = designTokens.typography
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value as string | string[]
}

export const getSpacing = (path: string) => {
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = designTokens.spacing
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value as string
}

// Export direct des tokens pour utilisation dans Tailwind
export { colors, typography, spacing }