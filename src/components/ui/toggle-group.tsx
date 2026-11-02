import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import type { ComponentProps } from "react"
import { cn } from "../../lib/utils.ts"

export function ToggleGroup(props: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      {...props}
      className={cn("inline-flex rounded-[0.6rem] border border-line bg-card p-0.5 shadow-lift", props.className)}
    />
  )
}

export function ToggleGroupItem({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "rounded-[0.45rem] px-3 py-1.5 text-sm text-muted data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      {...props}
    />
  )
}
