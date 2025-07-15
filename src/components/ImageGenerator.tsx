import { useState } from 'react'
import { blink } from '../blink/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { 
  Download, 
  Sparkles, 
  Image as ImageIcon, 
  Wand2, 
  RefreshCw,
  Copy,
  Heart,
  Share2
} from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  size: string
  quality: string
  style: string
  createdAt: Date
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('high')
  const [style, setStyle] = useState('natural')
  const [numImages, setNumImages] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const stylePresets = [
    { value: 'natural', label: 'Natural', description: 'Realistic and natural looking' },
    { value: 'vivid', label: 'Vivid', description: 'Bold and vibrant colors' }
  ]

  const sizeOptions = [
    { value: '1024x1024', label: 'Square (1024×1024)', description: 'Perfect for social media' },
    { value: '1792x1024', label: 'Landscape (1792×1024)', description: 'Great for banners' },
    { value: '1024x1792', label: 'Portrait (1024×1792)', description: 'Ideal for mobile screens' }
  ]

  const qualityOptions = [
    { value: 'auto', label: 'Auto', description: 'Balanced quality and speed' },
    { value: 'low', label: 'Low', description: 'Faster generation' },
    { value: 'medium', label: 'Medium', description: 'Good quality' },
    { value: 'high', label: 'High', description: 'Best quality' }
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your image.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const { data } = await blink.ai.generateImage({
        prompt: prompt.trim(),
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
        quality: quality as 'auto' | 'low' | 'medium' | 'high',
        style: style as 'natural' | 'vivid',
        n: numImages
      })

      clearInterval(progressInterval)
      setProgress(100)

      const newImages: GeneratedImage[] = data.map((img, index) => ({
        id: `${Date.now()}-${index}`,
        url: img.url,
        prompt,
        size,
        quality,
        style,
        createdAt: new Date()
      }))

      setGeneratedImages(prev => [...newImages, ...prev])

      toast({
        title: "Images generated successfully!",
        description: `Generated ${numImages} image${numImages > 1 ? 's' : ''} from your prompt.`
      })

    } catch (error) {
      console.error('Error generating image:', error)
      toast({
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-generated-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download started",
        description: "Your image is being downloaded."
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive"
      })
    }
  }

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast({
      title: "Prompt copied",
      description: "Prompt has been copied to clipboard."
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          AI Image Generator
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create stunning images from text descriptions using advanced AI technology - completely free!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Generation Settings
              </CardTitle>
              <CardDescription>
                Configure your image generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qualityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stylePresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          <div>
                            <div className="font-medium">{preset.label}</div>
                            <div className="text-xs text-muted-foreground">{preset.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numImages">Count</Label>
                  <Select value={numImages.toString()} onValueChange={(value) => setNumImages(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} image{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generating...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Image{numImages > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Images */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Generated Images
                  {generatedImages.length > 0 && (
                    <Badge variant="secondary">{generatedImages.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Your AI-generated images will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No images generated yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Enter a prompt and click generate to create your first AI image
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedImages.map((image) => (
                      <div key={image.id} className="group relative">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        
                        {/* Image Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownload(image.url, image.prompt)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => copyPrompt(image.prompt)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Image Info */}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {image.size}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {image.quality}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {image.style}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {image.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}