import type { Meta, StoryObj } from '@storybook/react'
import { Input, InputGroup } from './input'
import { Button } from './button'

const meta = {
  title: 'UI/Forms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant Input adaptatif avec variantes spécialisées pour la gestion du jardin.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'jardin', 'earth', 'filled', 'success', 'warning', 'error'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl', 'mobile', 'desktop', 'tv'],
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Entrez votre texte...',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input variant="default" placeholder="Input par défaut" />
      <Input variant="jardin" placeholder="Thème jardin" />
      <Input variant="earth" placeholder="Thème terre" />
      <Input variant="filled" placeholder="Input rempli" />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input placeholder="État normal" />
      <Input variant="success" placeholder="État succès" />
      <Input variant="warning" placeholder="État attention" />
      <Input variant="error" placeholder="État erreur" />
      <Input disabled placeholder="État désactivé" />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input size="sm" placeholder="Petit input" />
      <Input size="default" placeholder="Input normal" />
      <Input size="lg" placeholder="Grand input" />
      <Input size="xl" placeholder="Très grand input" />
    </div>
  ),
}

export const DeviceSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input size="mobile" placeholder="Taille mobile (44px)" />
      <Input size="desktop" placeholder="Taille desktop (40px)" />
      <Input size="tv" placeholder="Taille TV (60px)" />
    </div>
  ),
}

export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input type="text" placeholder="Nom de la plante" />
      <Input type="email" placeholder="email@exemple.com" />
      <Input type="password" placeholder="Mot de passe" />
      <Input type="number" placeholder="Quantité plantée" />
      <Input type="tel" placeholder="+33 1 23 45 67 89" />
      <Input type="search" placeholder="Rechercher une culture..." />
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input 
        leftIcon="🌱" 
        placeholder="Nom de la culture"
        variant="jardin"
      />
      <Input 
        rightIcon="📊" 
        placeholder="Quantité récoltée"
        type="number"
      />
      <Input 
        leftIcon="🔍" 
        rightIcon="✨"
        placeholder="Recherche avancée"
        type="search"
      />
    </div>
  ),
}

export const InputGroups: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <InputGroup>
        <Input placeholder="Latitude" />
        <Input placeholder="Longitude" />
      </InputGroup>
      
      <InputGroup spacing="md">
        <Input 
          placeholder="Nom de la culture"
          variant="jardin"
          leftIcon="🌱"
        />
        <Button variant="jardin">Ajouter</Button>
      </InputGroup>
      
      <InputGroup orientation="vertical" spacing="sm">
        <Input placeholder="Adresse ligne 1" />
        <Input placeholder="Adresse ligne 2" />
        <InputGroup>
          <Input placeholder="Code postal" />
          <Input placeholder="Ville" />
        </InputGroup>
      </InputGroup>
    </div>
  ),
}

export const JardinSpecific: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input 
        variant="jardin"
        placeholder="Nom de la variété"
        leftIcon="🌱"
        helper="Ex: Tomate cerise Sweet 100"
      />
      <Input 
        variant="earth"
        type="number"
        placeholder="Profondeur (cm)"
        leftIcon="📏"
        helper="Profondeur recommandée pour la plantation"
      />
      <Input 
        variant="jardin"
        type="number"
        placeholder="Espacement (cm)"
        leftIcon="📐"
        helper="Distance entre chaque plant"
      />
      <Input 
        type="date"
        placeholder="Date de plantation"
        leftIcon="📅"
        helper="Sélectionnez la date de plantation"
      />
    </div>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input 
        placeholder="Nom de la culture"
        aria-label="Nom de la culture à planter"
        required
      />
      <Input 
        placeholder="Quantité"
        aria-describedby="quantity-description"
        type="number"
        min="1"
      />
      <p id="quantity-description" className="text-sm text-muted-foreground">
        Nombre de plants à planter (minimum 1)
      </p>
      
      <Input 
        placeholder="Email de notification"
        type="email"
        aria-invalid="true"
        aria-describedby="email-error"
        variant="error"
      />
      <p id="email-error" className="text-sm text-destructive">
        Format d'email invalide
      </p>
    </div>
  ),
}