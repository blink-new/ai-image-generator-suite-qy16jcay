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
  Scissors, 
  Download, 
  RefreshCw,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface ProcessedImage {
  id: string
  originalUrl: string
  processedUrl: string
  filename: string
  mode: string
  createdAt: Date
}

export function BackgroundRemover() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [mode, setMode] = useState('remove')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([])
  const [showComparison, setShowComparison] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const modeOptions = [
    { 
      value: 'remove', 
      label: 'Remove Background', 
      description: 'Completely remove the background',
      prompt: 'Remove the background from this image, making it transparent. Keep only the main subject with clean, precise edges.'
    },
    { 
      value: 'blur', 
      label: 'Blur Background', 
      description: 'Blur background while keeping subject sharp',
      prompt: 'Blur the background of this image while keeping the main subject in sharp focus. Create a professional depth of field effect.'
    },
    { 
      value: 'replace-white', 
      label: 'White Background', 
      description: 'Replace background with clean white',
      prompt: 'Replace the background of this image with a clean, pure white background. Keep the main subject intact with smooth edges.'
    },
    { 
      value: 'replace-black', 
      label: 'Black Background', 
      description: 'Replace background with solid black',
      prompt: 'Replace the background of this image with a solid black background. Maintain the main subject with clean, professional edges.'
    }
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

  const processImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Upload original image to storage first
      const { publicUrl: originalUrl } = await blink.storage.upload(
        selectedFile,
        `background-remover/originals/${selectedFile.name}`,
        { upsert: true }
      )

      setProgress(30)

      const selectedMode = modeOptions.find(m => m.value === mode)
      const prompt = selectedMode?.prompt || modeOptions[0].prompt

      // Use AI to process the background
      const { data } = await blink.ai.modifyImage({
        images: [originalUrl],
        prompt,
        quality: 'high',
        n: 1
      })

      setProgress(90)

      const processedUrl = data[0].url

      const newProcessedImage: ProcessedImage = {
        id: `${Date.now()}`,
        originalUrl,
        processedUrl,
        filename: selectedFile.name,
        mode: selectedMode?.label || 'Remove Background',
        createdAt: new Date()
      }

      setProcessedImages(prev => [newProcessedImage, ...prev])
      setProgress(100)

      toast({
        title: "Background processed successfully!",
        description: `Your image background has been ${mode === 'remove' ? 'removed' : 'modified'}.`
      })

      // Reset form
      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Error processing background:', error)
      toast({
        title: "Processing failed",
        description: "Failed to process background. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleDownload = async (imageUrl: string, filename: string, type: 'original' | 'processed', mode?: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'processed' ? `${mode?.toLowerCase().replace(/\s+/g, '-')}-${filename}` : `original-${filename}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download started",
        description: `${type === 'processed' ? 'Processed' : 'Original'} image is being downloaded.`
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
          <Scissors className="w-8 h-8 text-primary" />
          AI Background Remover
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Remove, blur, or replace image backgrounds with precision AI edge detection - completely free!
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
                Select an image to process the background
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
                <Label htmlFor="mode">Processing Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modeOptions.map((option) => (
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
                    <span>Processing background...</span>
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
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    {modeOptions.find(m => m.value === mode)?.label || 'Process Background'}
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
                <Layers className="w-5 h-5" />
                Processed Images
                {processedImages.length > 0 && (
                  <Badge variant="secondary">{processedImages.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Your processed images with before/after comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedImages.length === 0 ? (
                <div className="text-center py-12">
                  <Scissors className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No images processed yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload an image to see the AI background processing in action
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
                            {image.mode} • {image.createdAt.toLocaleString()}
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
                            onClick={() => handleDownload(image.processedUrl, image.filename, 'processed', image.mode)}
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
                              <Label className="text-sm font-medium">Original</Label>
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
                              <Label className="text-sm font-medium">Processed</Label>
                              <Badge variant="default" className="text-xs">
                                <Scissors className="w-3 h-3 mr-1" />
                                {image.mode}
                              </Badge>
                            </div>
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                              <img
                                src={image.processedUrl}
                                alt="Processed"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                          <img
                            src={image.processedUrl}
                            alt="Processed"
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