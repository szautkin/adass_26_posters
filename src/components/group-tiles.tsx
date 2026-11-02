import type { PosterGroup } from "../lib/posters.ts"
import { pipFor } from "../lib/posters.ts"
import { PosterThumbnail } from "./poster-thumbnail.tsx"

export function GroupTiles({ groups, onOpen }: { groups: PosterGroup[]; onOpen: (id: string) => void }) {
  const total = groups.reduce((sum, group) => sum + group.posters.length, 0)
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <button
        type="button"
        onClick={() => onOpen("all")}
        className="flex min-h-44 flex-col rounded-[0.6rem] border border-line bg-card p-5 text-left shadow-lift transition hover:-translate-y-0.5 hover:border-[#d5cbbd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="mb-4 h-0.5 w-10 bg-primary" />
        <span className="font-serif text-2xl text-foreground">All posters</span>
        <span className="mt-2 text-sm text-muted">{total} on the programme</span>
      </button>
      {groups.map((group) => {
        const thumbs = group.posters.filter((poster) => poster.image).slice(0, 3)
        const shown = thumbs.length > 0 ? thumbs : group.posters.slice(0, 3)
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onOpen(group.id)}
            className="flex min-h-44 flex-col rounded-[0.6rem] border border-line bg-card p-5 text-left shadow-lift transition hover:-translate-y-0.5 hover:border-[#d5cbbd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="mb-4 h-0.5 w-10" style={{ backgroundColor: pipFor(group.id) }} />
            <span className="font-serif text-2xl text-balance text-foreground">{group.label}</span>
            <span className="mt-2 text-sm text-muted">
              {group.posters.length} {group.posters.length === 1 ? "poster" : "posters"}
            </span>
            <span className="mt-4 flex gap-2">
              {shown.map((poster) => (
                <span key={poster.code} className="h-16 w-12 overflow-hidden rounded-[0.35rem] border border-line">
                  <PosterThumbnail poster={poster} />
                </span>
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
