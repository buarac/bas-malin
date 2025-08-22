import type { Meta, StoryObj } from '@storybook/react'
import { WeatherWidget, WeatherWidgetWithData } from './weather-widget'

const meta = {
  title: 'UI/Baš-Malin/WeatherWidget',
  component: WeatherWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Widget météo spécialisé pour Baš-Malin avec données en temps réel et prévisions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['compact', 'detailed', 'forecast'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'mobile', 'desktop', 'tv'],
    },
  },
} satisfies Meta<typeof WeatherWidget>

export default meta
type Story = StoryObj<typeof meta>

const mockWeatherData = {
  current: {
    temperature: 22,
    condition: 'sunny',
    humidity: 65,
    windSpeed: 15,
    pressure: 1013,
    uvIndex: 6,
  },
  forecast: [
    {
      date: '2024-08-21',
      high: 25,
      low: 18,
      condition: 'sunny',
      precipitation: 0,
    },
    {
      date: '2024-08-22',
      high: 23,
      low: 16,
      condition: 'cloudy',
      precipitation: 20,
    },
    {
      date: '2024-08-23',
      high: 20,
      low: 14,
      condition: 'rainy',
      precipitation: 80,
    },
    {
      date: '2024-08-24',
      high: 26,
      low: 19,
      condition: 'partlyCloudy',
      precipitation: 10,
    },
    {
      date: '2024-08-25',
      high: 28,
      low: 21,
      condition: 'sunny',
      precipitation: 0,
    },
  ],
  alerts: [
    {
      type: 'heat',
      message: 'Attention canicule prévue demain',
      severity: 'warning',
    },
  ],
  location: 'Lyon, France',
  lastUpdated: '2024-08-21T14:30:00Z',
}

export const Compact: Story = {
  args: {
    variant: 'compact',
    data: mockWeatherData,
  },
}

export const Detailed: Story = {
  args: {
    variant: 'detailed',
    data: mockWeatherData,
  },
}

export const Forecast: Story = {
  args: {
    variant: 'forecast',
    data: mockWeatherData,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-3">Compact</h3>
        <WeatherWidget variant="compact" data={mockWeatherData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Detailed</h3>
        <WeatherWidget variant="detailed" data={mockWeatherData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Forecast</h3>
        <WeatherWidget variant="forecast" data={mockWeatherData} />
      </div>
    </div>
  ),
}

export const DifferentWeatherConditions: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <WeatherWidget 
        variant="compact" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'sunny', temperature: 28 }
        }} 
      />
      <WeatherWidget 
        variant="compact" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'cloudy', temperature: 18 }
        }} 
      />
      <WeatherWidget 
        variant="compact" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'rainy', temperature: 15 }
        }} 
      />
      <WeatherWidget 
        variant="compact" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'snowy', temperature: -2 }
        }} 
      />
      <WeatherWidget 
        variant="compact" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'stormy', temperature: 20 }
        }} 
      />
      <WeatherWidget 
        variant="compact" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'partlyCloudy', temperature: 24 }
        }} 
      />
    </div>
  ),
}

export const WeatherAlerts: Story = {
  render: () => (
    <div className="space-y-4">
      <WeatherWidget 
        variant="detailed" 
        data={{
          ...mockWeatherData,
          alerts: [
            {
              type: 'heat',
              message: 'Canicule prévue - Arrosez vos cultures tôt le matin',
              severity: 'warning',
            },
          ]
        }} 
      />
      
      <WeatherWidget 
        variant="detailed" 
        data={{
          ...mockWeatherData,
          alerts: [
            {
              type: 'frost',
              message: 'Risque de gel cette nuit - Protégez vos plants sensibles',
              severity: 'error',
            },
          ]
        }} 
      />
      
      <WeatherWidget 
        variant="detailed" 
        data={{
          ...mockWeatherData,
          alerts: [
            {
              type: 'rain',
              message: 'Fortes pluies attendues - Reportez les plantations',
              severity: 'info',
            },
          ]
        }} 
      />
    </div>
  ),
}

export const DeviceSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Mobile</h3>
        <WeatherWidget variant="detailed" size="mobile" data={mockWeatherData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Desktop</h3>
        <WeatherWidget variant="detailed" size="desktop" data={mockWeatherData} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">TV</h3>
        <WeatherWidget variant="detailed" size="tv" data={mockWeatherData} />
      </div>
    </div>
  ),
}

export const WithRealTimeData: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Widget avec données en temps réel (simulation) :
      </p>
      <WeatherWidgetWithData variant="detailed" />
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <WeatherWidget variant="compact" loading />
      <WeatherWidget variant="detailed" loading />
    </div>
  ),
}

export const ErrorStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <WeatherWidget 
        variant="compact" 
        error="Impossible de récupérer les données météo"
      />
      <WeatherWidget 
        variant="detailed" 
        error="Service météo temporairement indisponible"
      />
    </div>
  ),
}

export const GardeningAdvice: Story = {
  render: () => (
    <div className="space-y-4">
      <WeatherWidget 
        variant="detailed" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'sunny', temperature: 28 },
          gardeningAdvice: [
            "🌅 Arrosez tôt le matin pour éviter l'évaporation",
            "☂️ Installez des voiles d'ombrage pour protéger vos plants",
            "💧 Vérifiez l'humidité du sol plus fréquemment",
          ]
        }} 
      />
      
      <WeatherWidget 
        variant="detailed" 
        data={{
          ...mockWeatherData,
          current: { ...mockWeatherData.current, condition: 'rainy', temperature: 15 },
          gardeningAdvice: [
            "🌧️ Profitez de la pluie pour économiser l'arrosage",
            "🐌 Surveillez les limaces et escargots",
            "🌱 Idéal pour planter de nouvelles graines",
          ]
        }} 
      />
    </div>
  ),
}

export const InteractiveFeatures: Story = {
  render: () => (
    <WeatherWidget 
      variant="forecast" 
      data={mockWeatherData}
      onLocationChange={(location) => alert(`Nouvelle localisation : ${location}`)}
      onRefresh={() => alert('Actualisation des données...')}
      showSettings
    />
  ),
}