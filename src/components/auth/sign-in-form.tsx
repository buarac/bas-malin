'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { SignInButton } from './sign-in-button';

interface SignInFormData {
  email: string;
  password: string;
}

export function SignInForm() {
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        setError('Email ou mot de passe incorrect');
      } else {
        // Redirection basée sur le profil sera gérée par le middleware
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Formulaire de connexion par email/password */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="votre@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="username"
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="h-12 text-base pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <span className="text-sm">{error}</span>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>

      {/* Séparateur */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      {/* Connexion OAuth */}
      <div className="space-y-3">
        <SignInButton provider="github" />
        <SignInButton provider="google" />
      </div>

      {/* Informations sur les profils */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-800 mb-2">Types de profil :</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li><strong>Expert :</strong> Accès complet, gestion avancée</li>
          <li><strong>Occasionnel :</strong> Interface simplifiée</li>
          <li><strong>Reader :</strong> Consultation uniquement</li>
        </ul>
      </div>
    </div>
  );
}