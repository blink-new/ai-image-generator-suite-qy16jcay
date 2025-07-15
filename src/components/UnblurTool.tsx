import { useState, useRef } from 'react'
import { blink } from '../blink/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { 
  Upload, 
  Wand2, 
  Download, 
  RefreshCw,
  Image as ImageIcon,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface ProcessedImage {
  id: string
  originalUrl: string
  enhancedUrl: string
  filename: string
  createdAt: Date
}

export function UnblurTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([])
  const [showComparison, setShowComparison] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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

  const processImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Upload original image to storage first
      const { publicUrl: originalUrl } = await blink.storage.upload(
        selectedFile,
        `unblur/originals/${selectedFile.name}`,
        { upsert: true }
      )

      setProgress(30)

      // Use AI to enhance the image
      const { data } = await blink.ai.modifyImage({
        images: [originalUrl],
        prompt: 'Enhance this image by removing blur, increasing sharpness, and improving clarity. Make it crystal clear and detailed.',
        quality: 'high',
        n: 1
      })

      setProgress(90)

      const enhancedUrl = data[0].url

      const newProcessedImage: ProcessedImage = {
        id: `${Date.now()}`,
        originalUrl,
        enhancedUrl,
        filename: selectedFile.name,
        createdAt: new Date()
      }

      setProcessedImages(prev => [newProcessedImage, ...prev])
      setProgress(100)

      toast({
        title: "Image enhanced successfully!",
        description: "Your blurry image has been sharpened and enhanced."
      })

      // Reset form
      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Error processing image:', error)
      toast({
        title: "Enhancement failed",
        description: "Failed to enhance image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleDownload = async (imageUrl: string, filename: string, type: 'original' | 'enhanced') => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${filename}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download started",
        description: `${type === 'enhanced' ? 'Enhanced' : 'Original'} image is being downloaded.`
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
          <Wand2 className="w-8 h-8 text-primary" />
          AI Unblur Tool
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enhance blurry images with AI-powered sharpening and clarity enhancement - completely free!
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
                Select a blurry image to enhance
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

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Enhancing image...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={processImage} 
                disabled={!selectedFile || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Enhance Image
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
                <Wand2 className="w-5 h-5" />
                Enhanced Images
                {processedImages.length > 0 && (
                  <Badge variant="secondary">{processedImages.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Your enhanced images with before/after comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedImages.length === 0 ? (
                <div className="text-center py-12">
                  <Wand2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No images enhanced yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a blurry image to see the AI enhancement in action
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {processedImages.map((image) => (
                    <div key={image.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{image.filename}</h4>
                          <p className="text-sm text-muted-foreground">
                            Enhanced on {image.createdAt.toLocaleString()}
                          </p>
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
                            onClick={() => handleDownload(image.enhancedUrl, image.filename, 'enhanced')}
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
                              <Label className="text-sm font-medium">Original (Blurry)</Label>
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
                              <Label className="text-sm font-medium">Enhanced (Sharp)</Label>
                              <Badge variant="default" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                AI Enhanced
                              </Badge>
                            </div>
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={image.enhancedUrl}
                                alt="Enhanced"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <img
                            src={image.enhancedUrl}
                            alt="Enhanced"
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