import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Images, 
  Search, 
  Download, 
  Copy,
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Tag,
  Trash2
} from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface GalleryImage {
  id: string
  url: string
  prompt: string
  type: 'generated' | 'unblurred' | 'upscaled' | 'background-removed' | 'batch'
  size?: string
  quality?: string
  style?: string
  scale?: string
  mode?: string
  filename?: string
  createdAt: Date
  isFavorite: boolean
}

export function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const typeOptions = [
    { value: 'all', label: 'All Images' },
    { value: 'generated', label: 'Generated' },
    { value: 'unblurred', label: 'Unblurred' },
    { value: 'upscaled', label: 'Upscaled' },
    { value: 'background-removed', label: 'Background Removed' },
    { value: 'batch', label: 'Batch Generated' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'favorites', label: 'Favorites First' }
  ]

  useEffect(() => {
    loadImages()
  }, [])

  useEffect(() => {
    filterAndSortImages()
  }, [images, searchQuery, filterType, sortBy, filterAndSortImages])

  const loadImages = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would load from a database
      // For now, we'll simulate with localStorage
      const savedImages = localStorage.getItem('gallery-images')
      if (savedImages) {
        const parsedImages = JSON.parse(savedImages).map((img: any) => ({
          ...img,
          createdAt: new Date(img.createdAt)
        }))
        setImages(parsedImages)
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveImages = (updatedImages: GalleryImage[]) => {
    localStorage.setItem('gallery-images', JSON.stringify(updatedImages))
    setImages(updatedImages)
  }

  const filterAndSortImages = useCallback(() => {
    let filtered = [...images]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(img => 
        img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.filename?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(img => img.type === filterType)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime()
        case 'favorites':
          if (a.isFavorite && !b.isFavorite) return -1
          if (!a.isFavorite && b.isFavorite) return 1
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

    setFilteredImages(filtered)
  }, [images, searchQuery, filterType, sortBy])

  const toggleFavorite = (imageId: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, isFavorite: !img.isFavorite } : img
    )
    saveImages(updatedImages)
    
    toast({
      title: "Favorite updated",
      description: "Image favorite status has been updated."
    })
  }

  const deleteImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    saveImages(updatedImages)
    
    toast({
      title: "Image deleted",
      description: "Image has been removed from your gallery."
    })
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
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

  const shareImage = async (imageUrl: string, prompt: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Image',
          text: prompt,
          url: imageUrl
        })
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(imageUrl)
        toast({
          title: "URL copied",
          description: "Image URL has been copied to clipboard."
        })
      }
    } else {
      navigator.clipboard.writeText(imageUrl)
      toast({
        title: "URL copied",
        description: "Image URL has been copied to clipboard."
      })
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generated': return 'Generated'
      case 'unblurred': return 'Unblurred'
      case 'upscaled': return 'Upscaled'
      case 'background-removed': return 'Background Removed'
      case 'batch': return 'Batch'
      default: return 'Unknown'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'generated': return 'bg-purple-100 text-purple-800'
      case 'unblurred': return 'bg-blue-100 text-blue-800'
      case 'upscaled': return 'bg-orange-100 text-orange-800'
      case 'background-removed': return 'bg-green-100 text-green-800'
      case 'batch': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Images className="w-8 h-8 text-primary" />
            Gallery
          </h2>
          <p className="text-muted-foreground">Loading your images...</p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Images className="w-8 h-8 text-primary" />
          Gallery
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          View and manage all your AI-generated and processed images in one place
        </p>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts or filenames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">View</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Images className="w-5 h-5" />
              Your Images
              <Badge variant="secondary">{filteredImages.length}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <Images className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {images.length === 0 ? 'No images in gallery' : 'No images match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {images.length === 0 
                  ? 'Start creating images with our AI tools to build your gallery'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
            }>
              {filteredImages.map((image) => (
                <div key={image.id} className={viewMode === 'grid' ? 'group' : 'flex gap-4 p-4 border rounded-lg'}>
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadImage(image.url, `${image.type}-${image.id}.png`)}
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
                              onClick={() => toggleFavorite(image.id)}
                            >
                              <Heart className={`w-4 h-4 ${image.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => shareImage(image.url, image.prompt)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className={`text-xs ${getTypeColor(image.type)}`}>
                            {getTypeLabel(image.type)}
                          </Badge>
                        </div>

                        {/* Favorite Badge */}
                        {image.isFavorite && (
                          <div className="absolute top-2 right-2">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {image.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium line-clamp-1">{image.prompt}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getTypeColor(image.type)}`}>
                                <Tag className="w-3 h-3 mr-1" />
                                {getTypeLabel(image.type)}
                              </Badge>
                              {image.isFavorite && (
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {image.createdAt.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadImage(image.url, `${image.type}-${image.id}.png`)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyPrompt(image.prompt)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFavorite(image.id)}
                            >
                              <Heart className={`w-4 h-4 ${image.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => shareImage(image.url, image.prompt)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteImage(image.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}