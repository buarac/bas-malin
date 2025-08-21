import { SignInForm } from "@/components/auth/sign-in-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">🌱</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Baš-Malin</CardTitle>
          <CardDescription className="text-green-600">
            Votre potager intelligent - Connexion sécurisée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  )
}