import { auth } from "@/lib/auth"
import { UserMenu } from "@/components/auth/user-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { APP_VERSION } from "@/constants"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <span className="text-sm text-muted-foreground">v{APP_VERSION}</span>
          </div>
          <UserMenu />
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {session.user.name}!</CardTitle>
              <CardDescription>
                This is your protected dashboard page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {session.user.name}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>ID:</strong> {session.user.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}