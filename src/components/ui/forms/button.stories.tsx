import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button, JardinButton, EarthButton, SeasonalButton, ButtonGroup } from './button'

const meta = {
  title: 'UI/Forms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant Button adaptatif multi-device avec variantes spécialisées Baš-Malin.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'jardin', 'earth', 'success', 'warning', 'seasonal'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'xl', 'icon', 'mobile', 'desktop', 'tv'],
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const JardinVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <JardinButton>Jardin</JardinButton>
      <EarthButton>Earth</EarthButton>
      <SeasonalButton>Seasonal</SeasonalButton>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
}

export const DeviceSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="mobile">Mobile (48px)</Button>
      <Button size="desktop">Desktop (40px)</Button>
      <Button size="tv">TV (64px)</Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button leftIcon="🌱">Planter</Button>
      <Button rightIcon="📊">Statistiques</Button>
      <Button leftIcon="🧺" rightIcon="→">Récolter</Button>
    </div>
  ),
}

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button loading>Loading</Button>
      <Button loading loadingText="Plantation en cours...">Plant</Button>
      <JardinButton loading>Jardin Loading</JardinButton>
    </div>
  ),
}

export const ButtonGroups: Story = {
  render: () => (
    <div className="space-y-4">
      <ButtonGroup>
        <Button>Première action</Button>
        <Button variant="outline">Deuxième action</Button>
        <Button variant="ghost">Troisième action</Button>
      </ButtonGroup>
      
      <ButtonGroup orientation="vertical" spacing="md">
        <JardinButton>Planter</JardinButton>
        <EarthButton>Arroser</EarthButton>
        <Button variant="success">Récolter</Button>
      </ButtonGroup>
    </div>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <Button disabled>Disabled Button</Button>
      <Button aria-label="Ajouter une nouvelle culture" leftIcon="➕">
        Ajouter
      </Button>
      <Button 
        aria-describedby="button-description"
        variant="jardin"
      >
        Action importante
      </Button>
      <p id="button-description" className="text-sm text-muted-foreground">
        Cette action plantera une nouvelle culture dans votre jardin
      </p>
    </div>
  ),
}