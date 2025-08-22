import type { Meta, StoryObj } from '@storybook/react'
import { 
  DeviceDetector, 
  MobileOnly, 
  TabletOnly, 
  DesktopOnly, 
  TVOnly,
  MobileUp,
  TabletUp,
  DesktopUp,
  AdaptiveProps,
  ResponsiveLayout,
  DeviceDebugger,
  useAdaptiveValue
} from './device-detector'
import { Button } from '../forms/button'
import { Card, CardContent, CardHeader, CardTitle } from '../data-display/card'

const meta = {
  title: 'UI/Baš-Malin/DeviceDetector',
  component: DeviceDetector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Système de détection d\'appareils et composants adaptatifs pour différents formats (mobile/tablet/desktop/TV).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeviceDetector>

export default meta
type Story = StoryObj<typeof meta>

export const BasicDeviceDetection: Story = {
  render: () => (
    <div className="space-y-4">
      <DeviceDetector>
        {({ isMobile, isTablet, isDesktop, isTV, deviceType }) => (
          <Card>
            <CardHeader>
              <CardTitle>Appareil détecté : {deviceType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Mobile: {isMobile ? '✅' : '❌'}</p>
                <p>Tablet: {isTablet ? '✅' : '❌'}</p>
                <p>Desktop: {isDesktop ? '✅' : '❌'}</p>
                <p>TV: {isTV ? '✅' : '❌'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </DeviceDetector>
    </div>
  ),
}

export const ConditionalRendering: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Affichage conditionnel</h3>
        <div className="space-y-4">
          <MobileOnly>
            <Card variant="jardin">
              <CardContent className="p-4">
                <p>📱 Ce contenu n'est visible que sur mobile</p>
              </CardContent>
            </Card>
          </MobileOnly>
          
          <TabletOnly>
            <Card variant="earth">
              <CardContent className="p-4">
                <p>📱 Ce contenu n'est visible que sur tablette</p>
              </CardContent>
            </Card>
          </TabletOnly>
          
          <DesktopOnly>
            <Card variant="success">
              <CardContent className="p-4">
                <p>🖥️ Ce contenu n'est visible que sur desktop</p>
              </CardContent>
            </Card>
          </DesktopOnly>
          
          <TVOnly>
            <Card variant="warning">
              <CardContent className="p-4">
                <p>📺 Ce contenu n'est visible que sur TV</p>
              </CardContent>
            </Card>
          </TVOnly>
        </div>
      </div>
    </div>
  ),
}

export const ResponsiveBreakpoints: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Breakpoints adaptatifs</h3>
        <div className="space-y-4">
          <MobileUp>
            <Card>
              <CardContent className="p-4">
                <p>📱+ Visible à partir de mobile (toutes tailles)</p>
              </CardContent>
            </Card>
          </MobileUp>
          
          <TabletUp>
            <Card>
              <CardContent className="p-4">
                <p>📱+ Visible à partir de tablette (tablette, desktop, TV)</p>
              </CardContent>
            </Card>
          </TabletUp>
          
          <DesktopUp>
            <Card>
              <CardContent className="p-4">
                <p>🖥️+ Visible à partir de desktop (desktop et TV)</p>
              </CardContent>
            </Card>
          </DesktopUp>
        </div>
      </div>
    </div>
  ),
}

const AdaptiveButtonExample = () => {
  const size = useAdaptiveValue({
    mobile: 'mobile',
    tablet: 'default', 
    desktop: 'default',
    tv: 'tv'
  })
  
  const text = useAdaptiveValue({
    mobile: 'Ajout',
    tablet: 'Ajouter',
    desktop: 'Ajouter culture', 
    tv: 'Ajouter nouvelle culture'
  })
  
  return (
    <Button size={size as any} variant="jardin">
      {text}
    </Button>
  )
}

export const AdaptiveValues: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Valeurs adaptatives</h3>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bouton adaptatif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Le texte et la taille s'adaptent selon l'appareil :
              </p>
              <AdaptiveButtonExample />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
}

export const AdaptivePropsExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Props adaptatives</h3>
        <div className="space-y-4">
          <AdaptiveProps
            mobile={{ variant: 'jardin', size: 'mobile' }}
            tablet={{ variant: 'earth', size: 'default' }}
            desktop={{ variant: 'success', size: 'lg' }}
            tv={{ variant: 'warning', size: 'tv' }}
          >
            {(props) => (
              <Button {...props}>
                Bouton avec props adaptatives
              </Button>
            )}
          </AdaptiveProps>
        </div>
      </div>
    </div>
  ),
}

export const ResponsiveLayoutExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Layout responsive</h3>
        <ResponsiveLayout
          mobile={
            <div className="space-y-2">
              <Card size="sm">
                <CardContent className="p-3">
                  <p className="text-sm">Layout mobile - Stack vertical</p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="p-3">
                  <p className="text-sm">Seconde carte</p>
                </CardContent>
              </Card>
            </div>
          }
          tablet={
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p>Layout tablette - Grid 2 colonnes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p>Seconde carte</p>
                </CardContent>
              </Card>
            </div>
          }
          desktop={
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p>Layout desktop - Grid 3 colonnes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p>Seconde carte</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p>Troisième carte</p>
                </CardContent>
              </Card>
            </div>
          }
          tv={
            <div className="grid grid-cols-4 gap-8">
              <Card size="lg">
                <CardContent className="p-8">
                  <p className="text-lg">Layout TV - Grid 4 colonnes</p>
                </CardContent>
              </Card>
              <Card size="lg">
                <CardContent className="p-8">
                  <p className="text-lg">Seconde carte</p>
                </CardContent>
              </Card>
              <Card size="lg">
                <CardContent className="p-8">
                  <p className="text-lg">Troisième carte</p>
                </CardContent>
              </Card>
              <Card size="lg">
                <CardContent className="p-8">
                  <p className="text-lg">Quatrième carte</p>
                </CardContent>
              </Card>
            </div>
          }
        />
      </div>
    </div>
  ),
}

export const DeviceDebuggerExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Debugger d'appareil</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Outil de développement pour visualiser les breakpoints et tester différentes tailles :
        </p>
        <DeviceDebugger />
      </div>
    </div>
  ),
}

export const GardeningUseCase: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Cas d'usage jardinage</h3>
        <div className="space-y-4">
          {/* Navigation adaptative */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation adaptative</CardTitle>
            </CardHeader>
            <CardContent>
              <MobileOnly>
                <div className="flex justify-center">
                  <Button size="mobile" variant="jardin" className="w-full">
                    🌱 Menu
                  </Button>
                </div>
              </MobileOnly>
              
              <TabletUp>
                <div className="flex gap-2 justify-center">
                  <Button size="default" variant="jardin">🌱 Cultures</Button>
                  <Button size="default" variant="earth">🧺 Récoltes</Button>
                  <Button size="default" variant="outline">📊 Stats</Button>
                </div>
              </TabletUp>
              
              <TVOnly>
                <div className="flex gap-4 justify-center">
                  <Button size="tv" variant="jardin">🌱 Mes Cultures</Button>
                  <Button size="tv" variant="earth">🧺 Mes Récoltes</Button>
                  <Button size="tv" variant="outline">📊 Statistiques</Button>
                  <Button size="tv" variant="outline">⚙️ Paramètres</Button>
                </div>
              </TVOnly>
            </CardContent>
          </Card>
          
          {/* Interface de plantation */}
          <Card>
            <CardHeader>
              <CardTitle>Interface de plantation</CardTitle>
            </CardHeader>
            <CardContent>
              <MobileOnly>
                <div className="space-y-3">
                  <Button size="mobile" variant="jardin" className="w-full">
                    ➕ Nouvelle plantation
                  </Button>
                  <p className="text-sm text-center">Interface simplifiée mobile</p>
                </div>
              </MobileOnly>
              
              <TabletOnly>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="jardin">➕ Planter</Button>
                  <Button variant="earth">💧 Arroser</Button>
                  <Button variant="outline">📊 Suivre</Button>
                  <Button variant="outline">🧺 Récolter</Button>
                </div>
              </TabletOnly>
              
              <DesktopUp>
                <div className="grid grid-cols-4 gap-4">
                  <Button variant="jardin" leftIcon="➕">
                    Nouvelle plantation
                  </Button>
                  <Button variant="earth" leftIcon="💧">
                    Arroser culture
                  </Button>
                  <Button variant="outline" leftIcon="📊">
                    Suivre croissance
                  </Button>
                  <Button variant="outline" leftIcon="🧺">
                    Programmer récolte
                  </Button>
                </div>
              </DesktopUp>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
}

export const PerformanceTest: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Test de performance</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Multiples composants adaptatifs pour tester les performances :
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <MobileUp key={i}>
              <Card>
                <CardContent className="p-4">
                  <AdaptiveProps
                    mobile={{ size: 'mobile' }}
                    desktop={{ size: 'default' }}
                    tv={{ size: 'tv' }}
                  >
                    {(props) => (
                      <Button {...props} variant="jardin" className="w-full">
                        Bouton {i + 1}
                      </Button>
                    )}
                  </AdaptiveProps>
                </CardContent>
              </Card>
            </MobileUp>
          ))}
        </div>
      </div>
    </div>
  ),
}