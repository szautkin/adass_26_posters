import type { Poster } from "../lib/posters.ts"
import { cn } from "../lib/utils.ts"

export function PosterThumbnail({
  poster,
  className,
  alt = "",
}: {
  poster: Poster
  className?: string
  alt?: string
}) {
  if (poster.image) {
    return <img src={poster.image.thumb} alt={alt} className={cn("h-full w-full object-cover object-top", className)} />
  }
  return (
    <div className={cn("flex h-full w-full flex-col items-start justify-end bg-[#efeae2] p-3", className)}>
      <span className="font-serif text-lg text-foreground/80">{poster.code}</span>
      <span className="text-xs tracking-wide text-muted uppercase">Poster</span>
    </div>
  )
}
