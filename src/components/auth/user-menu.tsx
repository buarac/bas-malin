"use client"

import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Eye, Wrench, Crown } from "lucide-react"
import { Permission } from "@/types/auth"

const profilIcons = {
  EXPERT: Crown,
  OCCASIONNEL: Wrench,
  READER: Eye
};

const profilColors = {
  EXPERT: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  OCCASIONNEL: "bg-blue-100 text-blue-800 hover:bg-blue-200", 
  READER: "bg-green-100 text-green-800 hover:bg-green-200"
};

const profilLabels = {
  EXPERT: "Expert",
  OCCASIONNEL: "Occasionnel",
  READER: "Lecteur"
};

export function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const { user } = session
  const ProfilIcon = profilIcons[user.typeProfil];
  const displayName = user.prenom && user.nom 
    ? `${user.prenom} ${user.nom}`
    : user.name || user.email?.split('@')[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || ""} alt={displayName || ""} />
            <AvatarFallback className="bg-green-100 text-green-800">
              {(user.prenom?.charAt(0) || user.name?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <Badge 
              variant="secondary" 
              className={`w-fit ${profilColors[user.typeProfil]}`}
            >
              <ProfilIcon className="mr-1 h-3 w-3" />
              {profilLabels[user.typeProfil]}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Permissions utilisateur */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Permissions
        </DropdownMenuLabel>
        <div className="px-2 pb-2">
          <div className="flex flex-wrap gap-1">
            {user.permissions.map(permission => (
              <Badge key={permission} variant="outline" className="text-xs">
                {permission === Permission.LECTURE && '👁️ Lecture'}
                {permission === Permission.ECRITURE && '✏️ Écriture'}
                {permission === Permission.SUPPRESSION && '🗑️ Suppression'}
                {permission === Permission.ADMIN && '👑 Admin'}
              </Badge>
            ))}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-start h-auto p-2">
            <User className="mr-2 h-4 w-4" />
            Mon profil
          </Button>
        </DropdownMenuItem>
        
        {user.permissions.includes(Permission.ADMIN) && (
          <DropdownMenuItem asChild>
            <Button variant="ghost" className="w-full justify-start h-auto p-2">
              <Settings className="mr-2 h-4 w-4" />
              Administration
            </Button>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}