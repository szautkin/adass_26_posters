import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"
import { cn } from "../../lib/utils.ts"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[0.6rem] border text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "border-primary bg-primary text-[#f7fffe] hover:bg-[#0c5c5f]",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-white/70",
        outline: "border-line bg-card text-foreground shadow-lift hover:border-[#d5cbbd]",
      },
      size: {
        default: "h-10 px-3.5",
        sm: "h-8 px-2.5 text-[13px]",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, type = "button", ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className)
  if (asChild) return <Slot className={classes} {...props} />
  return <button className={classes} type={type} {...props} />
}
