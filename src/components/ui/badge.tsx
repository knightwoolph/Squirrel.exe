import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-sm)] border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow hover:bg-[var(--accent-primary-hover)]',
        secondary:
          'border-transparent bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80',
        destructive:
          'border-transparent bg-[var(--danger)] text-[var(--text-on-accent)] shadow hover:bg-[var(--danger)]/80',
        outline:
          'border-[var(--border-default)] text-[var(--text-primary)] bg-transparent',
        success:
          'border-transparent bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30',
        warning:
          'border-transparent bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
