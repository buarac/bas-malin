export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "My App"
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "A Next.js template with modern stack"
export const APP_VERSION = process.env.NEXT_PUBLIC_VERSION || "dev"

export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/auth/signin",
  SIGN_OUT: "/auth/signout",
  DASHBOARD: "/dashboard",
} as const