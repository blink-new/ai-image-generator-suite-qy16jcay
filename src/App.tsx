import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { Toaster } from './components/ui/toaster'
import { Sparkles, Image, Wand2, Layers, Zap, Scissors, Images, Home, Settings, User, Menu } from 'lucide-react'
import { ImageGenerator } from './components/ImageGenerator'
import { UnblurTool } from './components/UnblurTool'
import { BatchGenerator } from './components/BatchGenerator'
import { UpscalerTool } from './components/UpscalerTool'
import { BackgroundRemover } from './components/BackgroundRemover'
import { Gallery } from './components/Gallery'

interface User {
  id: string
  email: string
  displayName?: string
}

type Tool = 'generator' | 'unblur' | 'batch' | 'upscaler' | 'background-remover' | 'gallery'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState<Tool>('generator')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading AI Image Suite...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">AI Image Generator Suite</CardTitle>
            <CardDescription>
              Create, edit, and enhance images with powerful AI tools - completely FREE!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => blink.auth.login()} 
              className="w-full gradient-bg text-white hover:opacity-90"
              size="lg"
            >
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tools = [
    {
      id: 'generator' as Tool,
      title: 'AI Image Generator',
      description: 'Create high-quality images and clipart from text prompts',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      badge: 'Free'
    },
    {
      id: 'unblur' as Tool,
      title: 'Unblur Tool',
      description: 'Enhance and sharpen blurry images with AI',
      icon: Wand2,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Free'
    },
    {
      id: 'batch' as Tool,
      title: 'Batch Generator',
      description: 'Generate multiple images at once (1-10 images)',
      icon: Layers,
      color: 'from-green-500 to-emerald-500',
      badge: 'Free'
    },
    {
      id: 'upscaler' as Tool,
      title: 'AI Upscaler',
      description: 'Increase image resolution up to 8x with AI',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      badge: 'Free'
    },
    {
      id: 'background-remover' as Tool,
      title: 'Background Remover',
      description: 'Remove backgrounds with precision edge detection',
      icon: Scissors,
      color: 'from-indigo-500 to-purple-500',
      badge: 'Free'
    },
    {
      id: 'gallery' as Tool,
      title: 'Gallery',
      description: 'View and manage your generated images',
      icon: Images,
      color: 'from-gray-500 to-slate-500',
      badge: null
    }
  ]

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: activeTool === 'generator' },
    { icon: Sparkles, label: 'Generator', active: activeTool === 'generator' },
    { icon: Wand2, label: 'Unblur', active: activeTool === 'unblur' },
    { icon: Layers, label: 'Batch', active: activeTool === 'batch' },
    { icon: Zap, label: 'Upscaler', active: activeTool === 'upscaler' },
    { icon: Scissors, label: 'Background', active: activeTool === 'background-remover' },
    { icon: Images, label: 'Gallery', active: activeTool === 'gallery' },
  ]

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Sidebar className="border-r">
          <SidebarHeader className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">AI Suite</h2>
                <p className="text-xs text-muted-foreground">Image Tools</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-4">
            <SidebarMenu>
              {sidebarItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton 
                    onClick={() => {
                      if (item.label === 'Dashboard' || item.label === 'Generator') {
                        setActiveTool('generator')
                      } else if (item.label === 'Unblur') {
                        setActiveTool('unblur')
                      } else if (item.label === 'Batch') {
                        setActiveTool('batch')
                      } else if (item.label === 'Upscaler') {
                        setActiveTool('upscaler')
                      } else if (item.label === 'Background') {
                        setActiveTool('background-remover')
                      } else if (item.label === 'Gallery') {
                        setActiveTool('gallery')
                      }
                    }}
                    className={`w-full justify-start ${item.active ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            <Separator className="my-4" />
            
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => blink.auth.logout()}>
                  <User className="w-4 h-4 mr-3" />
                  Sign Out
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="border-b bg-background/80 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SidebarTrigger>
                <Button variant="ghost" size="sm">
                  <Menu className="w-4 h-4" />
                </Button>
              </SidebarTrigger>
              <div>
                <h1 className="text-2xl font-bold">AI Image Generator Suite</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.displayName || user.email}
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6">
            <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-center">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold">
                  🎉 All AI tools are completely FREE! No limits, no subscriptions, no hidden costs.
                </span>
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
            </div>

            {activeTool === 'generator' && (
              <ImageGenerator />
            )}

            {activeTool === 'unblur' && (
              <UnblurTool />
            )}

            {activeTool === 'batch' && (
              <BatchGenerator />
            )}

            {activeTool === 'upscaler' && (
              <UpscalerTool />
            )}

            {activeTool === 'background-remover' && (
              <BackgroundRemover />
            )}

            {activeTool === 'gallery' && (
              <Gallery />
            )}
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

export default App