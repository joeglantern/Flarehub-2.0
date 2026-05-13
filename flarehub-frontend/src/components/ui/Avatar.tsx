import * as RadixAvatar from '@radix-ui/react-avatar'
import { cn, initials as getInitials } from '@/lib/utils'
import type { CSSProperties } from 'react'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<Size, { cls: string; px: number }> = {
  xs: { cls: 'w-5  h-5  text-[10px]', px: 20 },
  sm: { cls: 'w-7  h-7  text-xs',     px: 28 },
  md: { cls: 'w-9  h-9  text-sm',     px: 36 },
  lg: { cls: 'w-11 h-11 text-base',   px: 44 },
  xl: { cls: 'w-14 h-14 text-lg',     px: 56 },
}

interface AvatarProps {
  src?:       string | null
  firstName?: string | null
  lastName?:  string | null
  initials?:  string
  size?:      Size | number
  color?:     string
  online?:    boolean
  ring?:      boolean
  className?: string
}

export function Avatar({ src, firstName, lastName, initials, size = 'md', color, online, ring, className }: AvatarProps) {
  const numericSize = typeof size === 'number'
  const sizeNum     = typeof size === 'number' ? size : sizes[size].px
  const sizeCls     = typeof size === 'number' ? '' : sizes[size].cls

  const fallback = initials ?? getInitials(firstName, lastName)

  const bgColor = color
    ? `${color}20`
    : 'var(--color-forest-100)'

  const textColor = color ?? 'var(--color-forest-700)'

  return (
    <span className="relative inline-flex shrink-0">
      <RadixAvatar.Root
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold select-none',
          ring && 'ring-2 ring-white',
          sizeCls,
          className,
        )}
        style={
          numericSize
            ? { width: sizeNum, height: sizeNum, fontSize: sizeNum * 0.38, background: bgColor, color: textColor } as CSSProperties
            : { background: bgColor, color: textColor } as CSSProperties
        }
      >
        <RadixAvatar.Image
          src={src ?? undefined}
          alt={`${firstName ?? ''} ${lastName ?? ''}`.trim()}
          className="w-full h-full rounded-full object-cover"
        />
        <RadixAvatar.Fallback className="flex items-center justify-center w-full h-full">
          {fallback}
        </RadixAvatar.Fallback>
      </RadixAvatar.Root>

      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </span>
  )
}
