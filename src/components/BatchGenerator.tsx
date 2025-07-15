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
  Layers, 
  RefreshCw,
  Copy,
  DownloadCloud,
  Grid3X3,
  Sparkles
} from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface BatchImage {
  id: string
  url: string
  prompt: string
  variation: number
  createdAt: Date
}

interface BatchJob {
  id: string
  basePrompt: string
  variations: string[]
  images: BatchImage[]
  size: string
  quality: string
  style: string
  createdAt: Date
  status: 'generating' | 'completed' | 'failed'
}

export function BatchGenerator() {
  const [basePrompt, setBasePrompt] = useState('')
  const [variations, setVariations] = useState<string[]>([''])
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('high')
  const [style, setStyle] = useState('natural')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([])
  const { toast } = useToast()

  const sizeOptions = [
    { value: '1024x1024', label: 'Square (1024×1024)' },
    { value: '1792x1024', label: 'Landscape (1792×1024)' },
    { value: '1024x1792', label: 'Portrait (1024×1792)' }
  ]

  const qualityOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ]

  const styleOptions = [
    { value: 'natural', label: 'Natural' },
    { value: 'vivid', label: 'Vivid' }
  ]

  const addVariation = () => {
    if (variations.length < 10) {
      setVariations([...variations, ''])
    }
  }

  const removeVariation = (index: number) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index))
    }
  }

  const updateVariation = (index: number, value: string) => {
    const newVariations = [...variations]
    newVariations[index] = value
    setVariations(newVariations)
  }

  const generateBatch = async () => {
    const validVariations = variations.filter(v => v.trim())
    
    if (!basePrompt.trim()) {
      toast({
        title: "Base prompt required",
        description: "Please enter a base prompt for your batch generation.",
        variant: "destructive"
      })
      return
    }

    if (validVariations.length === 0) {
      toast({
        title: "At least one variation required",
        description: "Please add at least one variation to generate.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    const jobId = `batch-${Date.now()}`
    const newJob: BatchJob = {
      id: jobId,
      basePrompt,
      variations: validVariations,
      images: [],
      size,
      quality,
      style,
      createdAt: new Date(),
      status: 'generating'
    }

    setBatchJobs(prev => [newJob, ...prev])

    try {
      const totalImages = validVariations.length
      const generatedImages: BatchImage[] = []

      for (let i = 0; i < validVariations.length; i++) {
        const variation = validVariations[i]
        const fullPrompt = `${basePrompt}, ${variation}`.trim().replace(/,\s*,/g, ',')

        try {
          const { data } = await blink.ai.generateImage({
            prompt: fullPrompt,
            size: size as '1024x1024' | '1792x1024' | '1024x1792',
            quality: quality as 'auto' | 'low' | 'medium' | 'high',
            style: style as 'natural' | 'vivid',
            n: 1
          })

          const newImage: BatchImage = {
            id: `${jobId}-${i}`,
            url: data[0].url,
            prompt: fullPrompt,
            variation: i + 1,
            createdAt: new Date()
          }

          generatedImages.push(newImage)
          setProgress(((i + 1) / totalImages) * 100)

          // Update the job with new image
          setBatchJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { ...job, images: [...generatedImages] }
              : job
          ))

        } catch (error) {
          console.error(`Error generating variation ${i + 1}:`, error)
        }
      }

      // Mark job as completed
      setBatchJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed' as const }
          : job
      ))

      toast({
        title: "Batch generation completed!",
        description: `Generated ${generatedImages.length} images from ${validVariations.length} variations.`
      })

    } catch (error) {
      console.error('Error in batch generation:', error)
      setBatchJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed' as const }
          : job
      ))
      toast({
        title: "Batch generation failed",
        description: "Failed to generate batch images. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const downloadAll = async (job: BatchJob) => {
    try {
      for (const image of job.images) {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `batch-${job.id}-variation-${image.variation}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      toast({
        title: "Batch download started",
        description: `Downloading ${job.images.length} images from this batch.`
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download batch images. Please try again.",
        variant: "destructive"
      })
    }
  }

  const downloadSingle = async (image: BatchImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `variation-${image.variation}-${image.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`
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
          <Layers className="w-8 h-8 text-primary" />
          Batch Image Generator
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generate multiple image variations from a single base prompt - perfect for exploring different styles and concepts!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Batch Settings
              </CardTitle>
              <CardDescription>
                Configure your batch generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="basePrompt">Base Prompt</Label>
                <Textarea
                  id="basePrompt"
                  placeholder="Enter your base prompt (e.g., 'A beautiful landscape')"
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Variations ({variations.length}/10)</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addVariation}
                    disabled={variations.length >= 10}
                  >
                    Add Variation
                  </Button>
                </div>
                
                {variations.map((variation, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Variation ${index + 1} (e.g., 'at sunset')`}
                      value={variation}
                      onChange={(e) => updateVariation(index, e.target.value)}
                    />
                    {variations.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeVariation(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

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
                          {option.label}
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
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generating batch...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={generateBatch} 
                disabled={isGenerating || !basePrompt.trim() || variations.filter(v => v.trim()).length === 0}
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
                    Generate Batch ({variations.filter(v => v.trim()).length} images)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                Batch Results
                {batchJobs.length > 0 && (
                  <Badge variant="secondary">{batchJobs.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Your batch generation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No batch jobs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first batch generation to see multiple variations of your prompt
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {batchJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{job.basePrompt}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.variations.length} variations • {job.createdAt.toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant={
                              job.status === 'completed' ? 'default' : 
                              job.status === 'generating' ? 'secondary' : 
                              'destructive'
                            }>
                              {job.status === 'completed' ? 'Completed' : 
                               job.status === 'generating' ? 'Generating...' : 
                               'Failed'}
                            </Badge>
                            <Badge variant="outline">{job.size}</Badge>
                            <Badge variant="outline">{job.quality}</Badge>
                            <Badge variant="outline">{job.style}</Badge>
                          </div>
                        </div>
                        {job.status === 'completed' && job.images.length > 0 && (
                          <Button
                            size="sm"
                            onClick={() => downloadAll(job)}
                          >
                            <DownloadCloud className="w-4 h-4 mr-2" />
                            Download All ({job.images.length})
                          </Button>
                        )}
                      </div>

                      {job.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {job.images.map((image) => (
                            <div key={image.id} className="group relative">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={image.url}
                                  alt={`Variation ${image.variation}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              </div>
                              
                              {/* Image Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => downloadSingle(image)}
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
                                </div>
                              </div>

                              {/* Variation Number */}
                              <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="text-xs">
                                  #{image.variation}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}