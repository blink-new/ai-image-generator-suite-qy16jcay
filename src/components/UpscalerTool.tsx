import { useState, useRef } from 'react'
import { blink } from '../blink/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Upload, 
  Zap, 
  Download, 
  RefreshCw,
  Image as ImageIcon,
  ArrowUp,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface UpscaledImage {
  id: string
  originalUrl: string
  upscaledUrl: string
  filename: string
  scale: string
  originalSize: string
  upscaledSize: string
  createdAt: Date
}

export function UpscalerTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [scale, setScale] = useState('2x')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [upscaledImages, setUpscaledImages] = useState<UpscaledImage[]>([])
  const [showComparison, setShowComparison] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const scaleOptions = [
    { value: '2x', label: '2x Upscale', description: 'Double the resolution' },
    { value: '4x', label: '4x Upscale', description: 'Quadruple the resolution' },
    { value: '8x', label: '8x Upscale', description: 'Maximum enhancement' }
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, JPEG, WebP).",
        variant: "destructive"
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive"
      })
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const upscaleImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Get original dimensions
      const originalDimensions = await getImageDimensions(selectedFile)
      const originalSize = `${originalDimensions.width}×${originalDimensions.height}`

      // Upload original image to storage first
      const { publicUrl: originalUrl } = await blink.storage.upload(
        selectedFile,
        `upscaler/originals/${selectedFile.name}`,
        { upsert: true }
      )

      setProgress(30)

      // Calculate target dimensions based on scale
      const scaleMultiplier = parseInt(scale.replace('x', ''))
      const targetWidth = originalDimensions.width * scaleMultiplier
      const targetHeight = originalDimensions.height * scaleMultiplier
      const upscaledSize = `${targetWidth}×${targetHeight}`

      // Use AI to upscale the image
      const { data } = await blink.ai.modifyImage({
        images: [originalUrl],
        prompt: `Upscale this image to ${scaleMultiplier}x resolution with enhanced detail, sharpness, and clarity. Maintain the original style and content while adding fine details and improving quality.`,
        quality: 'high',
        n: 1
      })

      setProgress(90)

      const upscaledUrl = data[0].url

      const newUpscaledImage: UpscaledImage = {
        id: `${Date.now()}`,
        originalUrl,
        upscaledUrl,
        filename: selectedFile.name,
        scale,
        originalSize,
        upscaledSize,
        createdAt: new Date()
      }

      setUpscaledImages(prev => [newUpscaledImage, ...prev])
      setProgress(100)

      toast({
        title: "Image upscaled successfully!",
        description: `Your image has been enhanced to ${scale} resolution.`
      })

      // Reset form
      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Error upscaling image:', error)
      toast({
        title: "Upscaling failed",
        description: "Failed to upscale image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleDownload = async (imageUrl: string, filename: string, type: 'original' | 'upscaled', scale?: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'upscaled' ? `${scale}-upscaled-${filename}` : `original-${filename}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download started",
        description: `${type === 'upscaled' ? 'Upscaled' : 'Original'} image is being downloaded.`
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Zap className="w-8 h-8 text-primary" />
          AI Image Upscaler
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Increase image resolution up to 8x with AI-powered enhancement - completely free!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </CardTitle>
              <CardDescription>
                Select an image to upscale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, WebP up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale">Upscale Factor</Label>
                <Select value={scale} onValueChange={setScale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scaleOptions.map((option) => (
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

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Upscaling image...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={upscaleImage} 
                disabled={!selectedFile || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Upscaling...
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Upscale to {scale}
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
                <Zap className="w-5 h-5" />
                Upscaled Images
                {upscaledImages.length > 0 && (
                  <Badge variant="secondary">{upscaledImages.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Your upscaled images with before/after comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upscaledImages.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No images upscaled yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload an image to see the AI upscaling in action
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {upscaledImages.map((image) => (
                    <div key={image.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{image.filename}</h4>
                          <p className="text-sm text-muted-foreground">
                            Upscaled {image.scale} on {image.createdAt.toLocaleString()}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {image.originalSize} → {image.upscaledSize}
                            </Badge>
                            <Badge variant="default" className="text-xs">
                              {image.scale} Enhanced
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowComparison(showComparison === image.id ? null : image.id)}
                          >
                            {showComparison === image.id ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide Comparison
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Compare
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(image.upscaledUrl, image.filename, 'upscaled', image.scale)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {showComparison === image.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Original ({image.originalSize})</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownload(image.originalUrl, image.filename, 'original')}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={image.originalUrl}
                                alt="Original"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Upscaled ({image.upscaledSize})</Label>
                              <Badge variant="default" className="text-xs">
                                <ArrowUp className="w-3 h-3 mr-1" />
                                {image.scale} Enhanced
                              </Badge>
                            </div>
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={image.upscaledUrl}
                                alt="Upscaled"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <img
                            src={image.upscaledUrl}
                            alt="Upscaled"
                            className="w-full h-full object-cover"
                          />
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