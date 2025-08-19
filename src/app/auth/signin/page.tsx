import { SignInButton } from "@/components/auth/sign-in-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_NAME } from "@/constants"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in to {APP_NAME}</CardTitle>
          <CardDescription>
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInButton provider="github" />
          <SignInButton provider="google" />
        </CardContent>
      </Card>
    </div>
  )
}