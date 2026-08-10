'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { uploadProfilePhoto } from '@/lib/merchant/actions'

type ProfilePhotoUploadProps = {
  currentPhotoUrl?: string | null
  onUploadComplete?: (url: string) => void
}

export function ProfilePhotoUpload({ currentPhotoUrl, onUploadComplete }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    // Client-side validation
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setError('File size must be less than 2MB')
      setUploading(false)
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed')
      setUploading(false)
      return
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload to server
    try {
      const result = await uploadProfilePhoto(file)

      if (!result.success) {
        setError(result.error || 'Upload failed')
        setPreviewUrl(currentPhotoUrl || null)
        setUploading(false)
        return
      }

      // Success
      if (onUploadComplete && result.data?.url) {
        onUploadComplete(result.data.url)
      }
      
      setUploading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setPreviewUrl(currentPhotoUrl || null)
      setUploading(false)
    } finally {
      // Clean up object URL
      URL.revokeObjectURL(objectUrl)
    }
  }

  return (
    <div className="space-y-4">
      {/* Photo Preview */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl text-gray-400">
                👤
              </div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : previewUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP. Max 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
