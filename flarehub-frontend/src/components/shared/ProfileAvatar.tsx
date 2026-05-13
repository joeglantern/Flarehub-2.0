import { useState } from 'react'
import { User } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import type { ApiSuccess, User as UserType, SignedUploadResult } from '@/types/api'

interface ProfileAvatarProps {
  src?:       string | null
  firstName?: string
  lastName?:  string
  size?:      'sm' | 'md' | 'lg' | 'xl'
  editable?:  boolean
  className?: string
}

const sizes = {
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-base',
  xl:  'w-20 h-20 text-xl',
}

export function ProfileAvatar({ src, firstName, lastName, size = 'md', editable = false, className }: ProfileAvatarProps) {
  const { setUser } = useAuthStore()
  const [uploading, setUploading] = useState(false)

  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase()

  const handleUpload = async (file: File) => {
    if (!editable) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use JPG, PNG, or WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    setUploading(true)
    try {
      const { data: signed } = await api.post<{ success: true; data: SignedUploadResult }>(
        '/storage/signed-upload-url',
        { bucket: 'profiles', filename: file.name, mimeType: file.type, fileSize: file.size },
      )
      await fetch(signed.data.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      })
      const updated = await api.patch<ApiSuccess<UserType>>('/users/me', { profilePic: signed.data.storagePath })
      setUser(updated.data.data)
      toast.success('Profile picture updated')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const inner = src ? (
    <img src={src} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
  ) : initials ? (
    <span className="font-semibold text-[var(--color-green-700)]">{initials}</span>
  ) : (
    <User size={16} className="text-[var(--color-text-muted)]" />
  )

  if (!editable) {
    return (
      <div className={cn(
        'rounded-full flex items-center justify-center overflow-hidden shrink-0',
        src ? 'bg-transparent' : 'bg-[var(--color-green-50)]',
        sizes[size],
        className,
      )}>
        {inner}
      </div>
    )
  }

  return (
    <label className={cn('relative cursor-pointer group', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center overflow-hidden shrink-0',
        src ? 'bg-transparent' : 'bg-[var(--color-green-50)]',
        sizes[size],
      )}>
        {uploading ? <Spinner size="sm" /> : inner}
      </div>
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-xs font-medium">Edit</span>
      </div>
      <input
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
    </label>
  )
}
