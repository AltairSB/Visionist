import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-plum text-white shadow-card hover:-translate-y-0.5 hover:bg-violet hover:shadow-atelier',
    secondary: 'border border-plum/15 bg-white text-plum hover:-translate-y-0.5 hover:border-violet hover:bg-lilac/55',
    ghost: 'border border-plum/25 bg-mist text-plum hover:-translate-y-0.5 hover:bg-white',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
