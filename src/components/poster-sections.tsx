import { useState } from "react"
import type { PosterGroup } from "../lib/posters.ts"
import { SECTION_PREVIEW, authorLine, formatDay, pipFor } from "../lib/posters.ts"
import { PosterThumbnail } from "./poster-thumbnail.tsx"

export function PosterSections({ groups, onOpen }: { groups: PosterGroup[]; onOpen: (code: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  return (
    <div className="grid gap-10">
      {groups.map((group) => {
        const open = expanded[group.id] ?? false
        const visible = open ? group.posters : group.posters.slice(0, SECTION_PREVIEW)
        return (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-2">
              <h2 id={`group-${group.id}`} className="flex items-center gap-3 font-serif text-2xl text-foreground">
                <span className="h-4 w-0.5" style={{ backgroundColor: pipFor(group.id) }} />
                {group.label}
              </h2>
              <span className="text-sm text-muted">{group.posters.length}</span>
            </div>
            <ul className="overflow-hidden rounded-[0.6rem] border border-line bg-card shadow-lift">
              {visible.map((poster) => (
                <li key={poster.code} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onOpen(poster.code)}
                    className="flex w-full items-center gap-4 px-3 py-3 text-left hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="h-16 w-12 shrink-0 overflow-hidden rounded-[0.35rem] border border-line">
                      <PosterThumbnail poster={poster} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-lg leading-snug text-foreground">{poster.title}</span>
                      <span className="mt-1 block truncate text-sm text-muted">{authorLine(poster)}</span>
                    </span>
                    <span className="hidden shrink-0 text-right text-xs text-muted sm:block">
                      {poster.type === "Featured Poster" ? <span className="mb-1 block text-wattle">Featured</span> : null}
                      {poster.room}
                      <span className="mt-1 block">{formatDay(poster.day)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {group.posters.length > SECTION_PREVIEW ? (
              <button
                type="button"
                className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setExpanded((current) => ({ ...current, [group.id]: !open }))}
              >
                {open ? "Show fewer" : `Show all ${group.posters.length} in this group`}
              </button>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
