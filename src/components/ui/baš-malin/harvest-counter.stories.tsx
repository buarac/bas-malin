import type { Meta, StoryObj } from '@storybook/react'
import { HarvestCounter, HarvestCounterWithData } from './harvest-counter'

const meta = {
  title: 'UI/Baš-Malin/HarvestCounter',
  component: HarvestCounter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Compteur de récoltes spécialisé pour Baš-Malin avec suivi des quantités et statistiques.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['simple', 'detailed', 'analytics'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'mobile', 'desktop', 'tv'],
    },
  },
} satisfies Meta<typeof HarvestCounter>

export default meta
type Story = StoryObj<typeof meta>

const mockHarvestData = {
  daily: {
    quantity: 2.5,
    unit: 'kg',
    items: [
      { name: 'Tomates cerises', quantity: 500, unit: 'g' },
      { name: 'Courgettes', quantity: 1.2, unit: 'kg' },
      { name: 'Radis', quantity: 800, unit: 'g' },
    ],
  },
  weekly: {
    quantity: 15.7,
    unit: 'kg',
    trend: 'up',
    change: 12,
  },
  monthly: {
    quantity: 48.3,
    unit: 'kg',
    trend: 'up',
    change: 8,
  },
  seasonal: {
    quantity: 127.8,
    unit: 'kg',
    trend: 'up',
    change: 15,
  },
  yearly: {
    quantity: 245.6,
    unit: 'kg',
    trend: 'up',
    change: 22,
  },
  topCrops: [
    { name: 'Tomates', quantity: 45.2, unit: 'kg', percentage: 35 },
    { name: 'Courgettes', quantity: 28.7, unit: 'kg', percentage: 23 },
    { name: 'Radis', quantity: 18.3, unit: 'kg', percentage: 14 },
    { name: 'Salade', quantity: 15.6, unit: 'kg', percentage: 12 },
    { name: 'Autres', quantity: 20.0, unit: 'kg', percentage: 16 },
  ],
  goals: {
    daily: { target: 3, current: 2.5, unit: 'kg' },
    weekly: { target: 20, current: 15.7, unit: 'kg' },
    monthly: { target: 60, current: 48.3, unit: 'kg' },
  },
  history: [
    { date: '2024-08-21', quantity: 2.5, unit: 'kg' },
    { date: '2024-08-20', quantity: 3.2, unit: 'kg' },
    { date: '2024-08-19', quantity: 1.8, unit: 'kg' },
    { date: '2024-08-18', quantity: 2.9, unit: 'kg' },
    { date: '2024-08-17', quantity: 2.1, unit: 'kg' },
    { date: '2024-08-16', quantity: 3.8, unit: 'kg' },
    { date: '2024-08-15', quantity: 2.7, unit: 'kg' },
  ],
}

export const Simple: Story = {
  args: {
    variant: 'simple',
    data: mockHarvestData,
  },
}

export const Detailed: Story = {
  args: {
    variant: 'detailed',
    data: mockHarvestData,
  },
}

export const Analytics: Story = {
  args: {
    variant: 'analytics',
    data: mockHarvestData,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-3">Simple</h3>
        <HarvestCounter variant="simple" data={mockHarvestData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Detailed</h3>
        <HarvestCounter variant="detailed" data={mockHarvestData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Analytics</h3>
        <HarvestCounter variant="analytics" data={mockHarvestData} />
      </div>
    </div>
  ),
}

export const DifferentPeriods: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <HarvestCounter 
        variant="simple" 
        data={mockHarvestData}
        period="daily"
      />
      <HarvestCounter 
        variant="simple" 
        data={mockHarvestData}
        period="weekly"
      />
      <HarvestCounter 
        variant="simple" 
        data={mockHarvestData}
        period="monthly"
      />
      <HarvestCounter 
        variant="simple" 
        data={mockHarvestData}
        period="seasonal"
      />
    </div>
  ),
}

export const WithGoals: Story = {
  render: () => (
    <div className="space-y-4">
      <HarvestCounter 
        variant="detailed" 
        data={mockHarvestData}
        period="daily"
        showGoals
      />
      
      <HarvestCounter 
        variant="detailed" 
        data={{
          ...mockHarvestData,
          goals: {
            ...mockHarvestData.goals,
            daily: { target: 3, current: 3.2, unit: 'kg' },
          }
        }}
        period="daily"
        showGoals
      />
      
      <HarvestCounter 
        variant="detailed" 
        data={{
          ...mockHarvestData,
          goals: {
            ...mockHarvestData.goals,
            daily: { target: 3, current: 1.5, unit: 'kg' },
          }
        }}
        period="daily"
        showGoals
      />
    </div>
  ),
}

export const TopCrops: Story = {
  render: () => (
    <HarvestCounter 
      variant="analytics" 
      data={mockHarvestData}
      showTopCrops
    />
  ),
}

export const TrendsAndHistory: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Tendances positives</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HarvestCounter 
            variant="detailed" 
            data={mockHarvestData}
            period="weekly"
          />
          <HarvestCounter 
            variant="detailed" 
            data={mockHarvestData}
            period="monthly"
          />
          <HarvestCounter 
            variant="detailed" 
            data={mockHarvestData}
            period="seasonal"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Tendances négatives</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HarvestCounter 
            variant="detailed" 
            data={{
              ...mockHarvestData,
              weekly: { ...mockHarvestData.weekly, trend: 'down', change: -8 }
            }}
            period="weekly"
          />
          <HarvestCounter 
            variant="detailed" 
            data={{
              ...mockHarvestData,
              monthly: { ...mockHarvestData.monthly, trend: 'down', change: -15 }
            }}
            period="monthly"
          />
          <HarvestCounter 
            variant="detailed" 
            data={{
              ...mockHarvestData,
              seasonal: { ...mockHarvestData.seasonal, trend: 'stable', change: 0 }
            }}
            period="seasonal"
          />
        </div>
      </div>
    </div>
  ),
}

export const DeviceSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Mobile</h3>
        <HarvestCounter variant="detailed" size="mobile" data={mockHarvestData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Desktop</h3>
        <HarvestCounter variant="detailed" size="desktop" data={mockHarvestData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">TV</h3>
        <HarvestCounter variant="detailed" size="tv" data={mockHarvestData} />
      </div>
    </div>
  ),
}

export const WithRealTimeData: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compteur avec données en temps réel (simulation) :
      </p>
      <HarvestCounterWithData variant="analytics" />
    </div>
  ),
}

export const InteractiveFeatures: Story = {
  render: () => (
    <div className="space-y-4">
      <HarvestCounter 
        variant="analytics" 
        data={mockHarvestData}
        onAddHarvest={(quantity, unit) => alert(`Ajout de ${quantity} ${unit} à la récolte`)}
        onPeriodChange={(period) => alert(`Changement de période : ${period}`)}
        onExport={() => alert('Export des données de récolte')}
        showActions
      />
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <HarvestCounter variant="simple" loading />
      <HarvestCounter variant="detailed" loading />
    </div>
  ),
}

export const EmptyStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <HarvestCounter 
        variant="simple" 
        data={{
          ...mockHarvestData,
          daily: { quantity: 0, unit: 'kg', items: [] }
        }}
      />
      <HarvestCounter 
        variant="detailed" 
        data={{
          ...mockHarvestData,
          daily: { quantity: 0, unit: 'kg', items: [] },
          weekly: { quantity: 0, unit: 'kg', trend: 'stable', change: 0 }
        }}
      />
    </div>
  ),
}

export const CustomUnits: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HarvestCounter 
        variant="detailed" 
        data={{
          ...mockHarvestData,
          daily: { 
            quantity: 25, 
            unit: 'pièces',
            items: [
              { name: 'Tomates', quantity: 12, unit: 'pièces' },
              { name: 'Concombres', quantity: 8, unit: 'pièces' },
              { name: 'Poivrons', quantity: 5, unit: 'pièces' },
            ]
          }
        }}
      />
      
      <HarvestCounter 
        variant="detailed" 
        data={{
          ...mockHarvestData,
          daily: { 
            quantity: 3.2, 
            unit: 'L',
            items: [
              { name: 'Jus de tomate', quantity: 1.5, unit: 'L' },
              { name: 'Coulis', quantity: 0.8, unit: 'L' },
              { name: 'Sauce', quantity: 0.9, unit: 'L' },
            ]
          }
        }}
      />
      
      <HarvestCounter 
        variant="detailed" 
        data={{
          ...mockHarvestData,
          daily: { 
            quantity: 12, 
            unit: 'bottes',
            items: [
              { name: 'Radis', quantity: 4, unit: 'bottes' },
              { name: 'Carottes', quantity: 3, unit: 'bottes' },
              { name: 'Navets', quantity: 5, unit: 'bottes' },
            ]
          }
        }}
      />
    </div>
  ),
}