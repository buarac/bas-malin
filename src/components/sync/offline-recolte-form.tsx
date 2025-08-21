'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WifiOff, Save, Loader2 } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSyncConnection } from '@/hooks/useSyncConnection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Schéma de validation pour une récolte
const RecolteSchema = z.object({
  dateRecolte: z.string().min(1, 'La date de récolte est requise'),
  quantiteRecoltee: z.number().positive('La quantité doit être positive'),
  uniteQuantite: z.enum(['kg', 'g', 'unite', 'botte', 'panier']),
  qualiteRecolte: z.enum(['Excellente', 'Bonne', 'Correcte', 'Mediocre']).optional(),
  commentaires: z.string().optional(),
  instanceCultureId: z.string().min(1, 'L\'instance de culture est requise'),
});

type RecolteFormData = z.infer<typeof RecolteSchema>;

interface OfflineRecolteFormProps {
  instanceCultureId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OfflineRecolteForm = ({ 
  instanceCultureId, 
  onSuccess, 
  onCancel 
}: OfflineRecolteFormProps) => {
  const { isOnline, storeOfflineChange } = useOfflineSync();
  const { sendMessage, isConnected } = useSyncConnection();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecolteFormData>({
    resolver: zodResolver(RecolteSchema),
    defaultValues: {
      dateRecolte: new Date().toISOString().split('T')[0],
      quantiteRecoltee: 0,
      uniteQuantite: 'kg',
      qualiteRecolte: 'Bonne',
      commentaires: '',
      instanceCultureId: instanceCultureId || '',
    },
  });

  const handleSubmit = async (data: RecolteFormData) => {
    setIsSubmitting(true);

    try {
      const recolteData = {
        ...data,
        dateRecolte: new Date(data.dateRecolte),
        // Génération d'un ID temporaire pour le mode offline
        id: `temp_recolte_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      if (isOnline && isConnected) {
        // Mode online : envoyer directement via WebSocket
        const success = sendMessage({
          id: `sync_${Date.now()}`,
          type: 'DATA_CHANGE',
          entity: 'recolte',
          operation: 'CREATE',
          data: recolteData,
          userId: '', // Sera rempli par le hook
          deviceId: '', // Sera rempli par le hook
          timestamp: new Date().toISOString(),
          version: 1
        });

        if (success) {
          toast.success('Récolte enregistrée et synchronisée');
          form.reset();
          onSuccess?.();
        } else {
          throw new Error('Échec de la synchronisation');
        }
      } else {
        // Mode offline : stockage local
        await storeOfflineChange({
          entity: 'recolte',
          operation: 'CREATE',
          data: recolteData,
          version: 1
        });

        toast.success('Récolte enregistrée (sera synchronisée à la reconnexion)');
        form.reset();
        onSuccess?.();
      }

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la récolte:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Nouvelle Récolte</h2>
        <p className="text-gray-600">Enregistrez votre récolte du jour</p>
      </div>

      {/* Indicateur mode offline */}
      {!isOnline && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Mode hors ligne. Vos données seront synchronisées à la reconnexion.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Date de récolte */}
          <FormField
            control={form.control}
            name="dateRecolte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de récolte</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantité */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantiteRecoltee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uniteQuantite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unité</FormLabel>
                  <FormControl>
                    <select 
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="unite">unité</option>
                      <option value="botte">botte</option>
                      <option value="panier">panier</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Qualité */}
          <FormField
            control={form.control}
            name="qualiteRecolte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qualité de la récolte</FormLabel>
                <FormControl>
                  <select 
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Excellente">Excellente</option>
                    <option value="Bonne">Bonne</option>
                    <option value="Correcte">Correcte</option>
                    <option value="Mediocre">Médiocre</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Commentaires */}
          <FormField
            control={form.control}
            name="commentaires"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commentaires</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Notes sur la récolte, goût, aspect..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              variant={isOnline && isConnected ? 'default' : 'secondary'}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isOnline && isConnected ? 'Enregistrer' : 'Enregistrer (hors ligne)'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}
          </div>

          {/* Indicateur de statut détaillé */}
          <div className="text-xs text-gray-500 text-center">
            {isOnline && isConnected && (
              <span className="text-green-600">🟢 Synchronisation en temps réel</span>
            )}
            {isOnline && !isConnected && (
              <span className="text-yellow-600">🟡 En ligne, connexion en cours...</span>
            )}
            {!isOnline && (
              <span className="text-orange-600">🟠 Mode hors ligne</span>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};