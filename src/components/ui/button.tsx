import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow hover:bg-[var(--accent-primary-hover)]',
        destructive:
          'bg-[var(--danger)] text-[var(--text-on-accent)] shadow-sm hover:bg-[var(--danger)]/90',
        outline:
          'border border-[var(--border-default)] bg-transparent shadow-sm hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] text-[var(--text-primary)]',
        secondary:
          'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm hover:bg-[var(--bg-tertiary)]',
        ghost:
          'hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] text-[var(--text-secondary)]',
        link:
          'text-[var(--accent-primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-[var(--radius-sm)] px-3 text-xs',
        lg: 'h-10 rounded-[var(--radius-lg)] px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
