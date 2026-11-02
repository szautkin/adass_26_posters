import { useEffect, useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { posters } from "../lib/catalog.ts"
import {
  filterPosters,
  formatDay,
  groupPosters,
  paginate,
  postersInGroup,
  type Filters,
  type GroupBy,
  type ViewMode,
} from "../lib/posters.ts"
import { FilterBar } from "./filter-bar.tsx"
import { GroupTiles } from "./group-tiles.tsx"
import { PaginationBar } from "./pagination-bar.tsx"
import { PosterCard } from "./poster-card.tsx"
import { PosterDialog } from "./poster-dialog.tsx"
import { PosterSections } from "./poster-sections.tsx"
import { Button } from "./ui/button.tsx"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group.tsx"

const groupLabels: Record<GroupBy, string> = {
  track: "All tracks",
  room: "All rooms",
  day: "All days",
  type: "All types",
}

function isGroupBy(value: string | null): value is GroupBy {
  return value === "track" || value === "room" || value === "day" || value === "type"
}

export function BrowsePage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const code = params.code

  const view: ViewMode = searchParams.get("view") === "sections" ? "sections" : "cards"
  const by: GroupBy = isGroupBy(searchParams.get("by")) ? (searchParams.get("by") as GroupBy) : "track"
  const group = searchParams.get("group") ?? ""
  const page = Number(searchParams.get("page") ?? "1") || 1
  const typeParam = searchParams.get("type")
  const photoParam = searchParams.get("photo")
  const filters: Filters = {
    q: searchParams.get("q") ?? "",
    type: typeParam === "featured" || typeParam === "poster" ? typeParam : "",
    track: searchParams.get("track") ?? "",
    room: searchParams.get("room") ?? "",
    day: searchParams.get("day") ?? "",
    photo: photoParam === "yes" || photoParam === "no" ? photoParam : "",
  }

  function update(patch: Record<string, string | undefined>, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    if (resetPage) next.delete("page")
    setSearchParams(next)
  }

  const filtered = useMemo(() => filterPosters(posters, filters), [filters])
  const groups = useMemo(() => groupPosters(filtered, by), [filtered, by])
  const inGroup = group ? postersInGroup(filtered, by, group) : []
  const paged = paginate(inGroup, page)
  const sequence = view === "sections" || !group ? groups.flatMap((item) => item.posters) : inGroup
  const opened = code ? posters.find((poster) => poster.code === code) : undefined
  const openedIndex = opened ? sequence.findIndex((poster) => poster.code === opened.code) : -1
  const activeFilters = Boolean(filters.q || filters.type || filters.track || filters.room || filters.day || filters.photo)
  const groupLabel = group === "all" ? "All posters" : (groups.find((item) => item.id === group)?.label ?? "This group")

  useEffect(() => {
    document.title = opened ? `${opened.title} · ADASS XXXVI` : "ADASS XXXVI posters"
  }, [opened])

  function openPoster(nextCode: string) {
    navigate({ pathname: `/p/${nextCode}`, search: searchParams.toString() })
  }

  function closePoster() {
    navigate({ pathname: "/", search: searchParams.toString() })
  }

  function step(direction: -1 | 1) {
    const next = sequence[openedIndex + direction]
    if (next) openPoster(next.code)
  }

  return (
    <div className="min-h-svh">
      <a href="#posters" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
        Skip to posters
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs tracking-[0.16em] text-primary uppercase">Perth, Western Australia · 2–5 November 2026</p>
            <h1 className="mt-1 font-serif text-4xl text-foreground">ADASS XXXVI</h1>
            <p className="mt-1 text-sm text-muted">Poster browser</p>
          </div>
          <ToggleGroup
            type="single"
            value={view}
            aria-label="Layout"
            onValueChange={(value) => {
              if (value === "cards" || value === "sections") update({ view: value === "cards" ? undefined : value }, false)
            }}
          >
            <ToggleGroupItem value="cards">Cards</ToggleGroupItem>
            <ToggleGroupItem value="sections">Sections</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>
      <main id="posters" className="mx-auto max-w-6xl px-4 py-6">
        <FilterBar
          posters={posters}
          showGrouping={view === "sections" || !group}
          values={{ ...filters, by }}
          onChange={(patch) => update(patch.by && patch.by !== by ? { ...patch, group: undefined } : patch)}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "poster" : "posters"}
            {filters.day ? ` · ${formatDay(filters.day)}` : ""}
          </p>
          {activeFilters ? (
            <button
              type="button"
              className="text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => update({ q: undefined, type: undefined, track: undefined, room: undefined, day: undefined, photo: undefined })}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="rounded-[0.6rem] border border-line bg-card px-6 py-16 text-center shadow-lift">
              <p className="font-serif text-2xl">No posters match these filters</p>
              <p className="mt-2 text-sm text-muted">Try a shorter search, or clear a filter.</p>
            </div>
          ) : view === "sections" ? (
            <PosterSections groups={groups} onOpen={openPoster} />
          ) : !group ? (
            <GroupTiles groups={groups} onOpen={(id) => update({ group: id })} />
          ) : (
            <div>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Button size="sm" onClick={() => update({ group: undefined })}>
                    {groupLabels[by]}
                  </Button>
                  <h2 className="mt-3 font-serif text-3xl text-foreground">{groupLabel}</h2>
                </div>
              </div>
              {paged.total === 0 ? (
                <p className="text-sm text-muted">Nothing in this group matches the current filters.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paged.items.map((poster) => (
                    <PosterCard key={poster.code} poster={poster} onOpen={openPoster} />
                  ))}
                </div>
              )}
              <PaginationBar page={paged.page} pages={paged.pages} total={paged.total} onPage={(next) => update({ page: String(next) }, false)} />
            </div>
          )}
        </div>
      </main>
      <footer className="mx-auto max-w-6xl border-t border-line px-4 py-8 text-sm text-muted">
        Schedule data from{" "}
        <a className="text-primary underline-offset-4 hover:underline" href="https://pretalx.adass.org/adass2026/schedule/">
          Pretalx · ADASS XXXVI
        </a>
      </footer>
      {code ? (
        <PosterDialog
          poster={opened}
          onClose={closePoster}
          onPrevious={() => step(-1)}
          onNext={() => step(1)}
          hasPrevious={openedIndex > 0}
          hasNext={openedIndex >= 0 && openedIndex < sequence.length - 1}
        />
      ) : null}
    </div>
  )
}
