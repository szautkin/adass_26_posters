import type { Poster } from "../lib/posters.ts"
import { authorLine, formatDay } from "../lib/posters.ts"
import { PosterThumbnail } from "./poster-thumbnail.tsx"

export function PosterCard({ poster, onOpen }: { poster: Poster; onOpen: (code: string) => void }) {
  const featured = poster.type === "Featured Poster"
  return (
    <button
      type="button"
      onClick={() => onOpen(poster.code)}
      className="flex h-full flex-col overflow-hidden rounded-[0.6rem] border border-line bg-card text-left shadow-lift transition hover:-translate-y-0.5 hover:border-[#d5cbbd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="h-0.5 w-full" style={{ backgroundColor: featured ? "#b8893a" : "transparent" }} />
      <span className="aspect-[3/4] overflow-hidden border-b border-line bg-[#efeae2]">
        <PosterThumbnail poster={poster} />
      </span>
      <span className="flex flex-1 flex-col gap-2 p-4">
        {featured ? <span className="text-[11px] tracking-[0.14em] text-wattle uppercase">Featured</span> : null}
        <span className="font-serif text-xl leading-snug text-balance text-foreground">{poster.title}</span>
        <span className="line-clamp-2 text-sm text-muted">{authorLine(poster)}</span>
        <span className="mt-auto pt-2 text-xs text-muted">
          {poster.room} · {formatDay(poster.day)}
        </span>
      </span>
    </button>
  )
}
