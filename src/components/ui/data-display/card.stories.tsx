import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, MetricCard, CultureCard } from './card'
import { Button } from '../forms/button'

const meta = {
  title: 'UI/Data Display/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant Card responsive avec variantes spécialisées pour Baš-Malin.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined', 'filled', 'jardin', 'earth', 'success', 'warning', 'error', 'culture', 'harvest', 'weather'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl', 'mobile', 'desktop', 'tv'],
    },
    hover: {
      control: { type: 'select' },
      options: ['none', 'lift', 'scale', 'glow'],
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Titre de la carte</CardTitle>
        <CardDescription>Description de la carte avec plus de détails.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Contenu principal de la carte avec des informations importantes.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
      <Card variant="default">
        <CardHeader>
          <CardTitle>Default</CardTitle>
        </CardHeader>
        <CardContent>Carte par défaut</CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
        </CardHeader>
        <CardContent>Carte avec ombre</CardContent>
      </Card>
      
      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Outlined</CardTitle>
        </CardHeader>
        <CardContent>Carte avec bordure</CardContent>
      </Card>
      
      <Card variant="jardin">
        <CardHeader>
          <CardTitle>Jardin</CardTitle>
        </CardHeader>
        <CardContent>Thème jardin</CardContent>
      </Card>
      
      <Card variant="earth">
        <CardHeader>
          <CardTitle>Earth</CardTitle>
        </CardHeader>
        <CardContent>Thème terre</CardContent>
      </Card>
      
      <Card variant="culture">
        <CardHeader>
          <CardTitle>Culture</CardTitle>
        </CardHeader>
        <CardContent>Carte de culture</CardContent>
      </Card>
    </div>
  ),
}

export const HoverEffects: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card hover="lift" variant="elevated">
        <CardHeader>
          <CardTitle>Lift Effect</CardTitle>
        </CardHeader>
        <CardContent>Survole pour voir l'effet de levée</CardContent>
      </Card>
      
      <Card hover="scale" variant="outlined">
        <CardHeader>
          <CardTitle>Scale Effect</CardTitle>
        </CardHeader>
        <CardContent>Survole pour voir l'effet d'échelle</CardContent>
      </Card>
      
      <Card hover="glow" variant="jardin">
        <CardHeader>
          <CardTitle>Glow Effect</CardTitle>
        </CardHeader>
        <CardContent>Survole pour voir l'effet de lueur</CardContent>
      </Card>
    </div>
  ),
}

export const MetricCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Poids total"
        value="15.7 kg"
        description="Récoltes cette saison"
        icon="🧺"
        trend="up"
        trendValue="+12%"
      />
      
      <MetricCard
        title="Nombre de cultures"
        value={23}
        description="Cultures actives"
        icon="🌱"
        trend="stable"
        trendValue="0%"
      />
      
      <MetricCard
        title="Zones actives"
        value={8}
        description="Sur 12 zones total"
        icon="🗺️"
        trend="up"
        trendValue="+2"
      />
      
      <MetricCard
        title="Température"
        value="22°C"
        description="Conditions actuelles"
        icon="🌡️"
        trend="down"
        trendValue="-3°C"
      />
    </div>
  ),
}

export const CultureCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CultureCard
        name="Tomates cerises"
        variety="Cherry Belle"
        stage="Floraison"
        daysFromPlanting={45}
        zone="Zone A"
        health="good"
        onAction={() => alert('Culture sélectionnée')}
      />
      
      <CultureCard
        name="Courgettes"
        variety="Black Beauty"
        stage="Fructification"
        daysFromPlanting={60}
        zone="Zone B"
        health="warning"
        onAction={() => alert('Culture sélectionnée')}
      />
      
      <CultureCard
        name="Radis"
        variety="French Breakfast"
        stage="Récolte"
        daysFromPlanting={25}
        zone="Zone C"
        health="poor"
        onAction={() => alert('Culture sélectionnée')}
      />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Petite carte</CardTitle>
        </CardHeader>
        <CardContent>Contenu compact</CardContent>
      </Card>
      
      <Card size="default">
        <CardHeader>
          <CardTitle>Carte normale</CardTitle>
        </CardHeader>
        <CardContent>Contenu standard</CardContent>
      </Card>
      
      <Card size="lg">
        <CardHeader>
          <CardTitle>Grande carte</CardTitle>
        </CardHeader>
        <CardContent>Contenu spacieux</CardContent>
      </Card>
    </div>
  ),
}

export const SemanticVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card variant="success">
        <CardHeader>
          <CardTitle>✅ Succès</CardTitle>
        </CardHeader>
        <CardContent>Opération réussie avec succès</CardContent>
      </Card>
      
      <Card variant="warning">
        <CardHeader>
          <CardTitle>⚠️ Attention</CardTitle>
        </CardHeader>
        <CardContent>Vérifiez ces paramètres</CardContent>
      </Card>
      
      <Card variant="error">
        <CardHeader>
          <CardTitle>❌ Erreur</CardTitle>
        </CardHeader>
        <CardContent>Une erreur s'est produite</CardContent>
      </Card>
    </div>
  ),
}