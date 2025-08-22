import type { Meta, StoryObj } from '@storybook/react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './dialog'
import { Button } from '../forms/button'
import { Input } from '../forms/input'

const meta = {
  title: 'UI/Overlays/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant Dialog adaptatif avec gestion responsive pour mobile/desktop/TV.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ouvrir le dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Titre du dialog</DialogTitle>
          <DialogDescription>
            Description du contenu du dialog avec plus de détails.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Contenu principal du dialog.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const AddCultureDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="jardin" leftIcon="🌱">
          Ajouter une culture
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>🌱 Nouvelle culture</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle culture à votre jardin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Nom
            </label>
            <Input
              id="name"
              placeholder="Ex: Tomate cerise"
              variant="jardin"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="variety" className="text-right">
              Variété
            </label>
            <Input
              id="variety"
              placeholder="Ex: Sweet 100"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="zone" className="text-right">
              Zone
            </label>
            <Input
              id="zone"
              placeholder="Ex: Zone A"
              variant="earth"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right">
              Quantité
            </label>
            <Input
              id="quantity"
              type="number"
              placeholder="Nombre de plants"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button variant="jardin">Ajouter la culture</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Supprimer la culture</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>⚠️ Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette culture ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold">Tomate cerise - Sweet 100</h4>
            <p className="text-sm text-muted-foreground">Zone A • Plantée il y a 45 jours</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button variant="destructive">Supprimer définitivement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const WeatherSettingsDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" leftIcon="⚙️">
          Paramètres météo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>🌤️ Paramètres météo</DialogTitle>
          <DialogDescription>
            Configurez les paramètres d'affichage de la météo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Localisation</label>
            <Input 
              placeholder="Entrez votre ville"
              leftIcon="📍"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Unité de température</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">°C</Button>
              <Button variant="ghost" size="sm">°F</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Prévisions</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">3 jours</Button>
              <Button variant="ghost" size="sm">7 jours</Button>
              <Button variant="ghost" size="sm">14 jours</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Notifications</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="rain" className="rounded" />
                <label htmlFor="rain" className="text-sm">Alerte pluie</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="frost" className="rounded" />
                <label htmlFor="frost" className="text-sm">Alerte gel</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="heat" className="rounded" />
                <label htmlFor="heat" className="text-sm">Alerte canicule</label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button variant="jardin">Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const ResponsiveBehavior: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Les dialogs s'adaptent automatiquement selon l'appareil :
      </p>
      <div className="grid gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="mobile">Dialog Mobile (plein écran)</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog adaptatif</DialogTitle>
              <DialogDescription>
                Sur mobile : plein écran. Sur desktop/TV : modal centré.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Le comportement change automatiquement selon la taille d'écran.</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fermer</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="tv">Dialog TV (grande taille)</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog pour TV</DialogTitle>
              <DialogDescription>
                Tailles et espacements optimisés pour l'affichage TV.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Boutons et textes plus grands pour la navigation à distance.</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="tv">Fermer</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-describedby="dialog-description">
          Dialog accessible
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog avec accessibilité</DialogTitle>
          <DialogDescription id="dialog-description">
            Ce dialog démontre les bonnes pratiques d'accessibilité avec focus automatique et navigation clavier.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <Input 
              placeholder="Premier champ (focus automatique)"
              aria-label="Premier champ de saisie"
            />
            <Input 
              placeholder="Deuxième champ"
              aria-label="Deuxième champ de saisie"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler (Escape)</Button>
          </DialogClose>
          <Button>Confirmer (Enter)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}