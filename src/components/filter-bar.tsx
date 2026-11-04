import { ChevronDown, X } from "lucide-react"
import type { ReactNode } from "react"
import type { Poster, GroupBy } from "../lib/posters.ts"
import { formatDay, slugify } from "../lib/posters.ts"
import { cn } from "../lib/utils.ts"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group.tsx"

export type FilterValues = {
  q: string
  type: string
  track: string
  room: string
  day: string
  photo: string
  by: GroupBy
}

const selectClass =
  "h-10 w-full appearance-none rounded-[0.6rem] border border-line bg-card pr-9 pl-3 text-sm text-foreground shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

export function FilterBar({
  posters,
  values,
  showGrouping,
  onChange,
}: {
  posters: Poster[]
  values: FilterValues
  showGrouping: boolean
  onChange: (patch: Partial<FilterValues>) => void
}) {
  const tracks = unique(posters.map((poster) => poster.track))
  const rooms = [...new Set(posters.map((poster) => poster.room))].sort()
  const days = [...new Set(posters.map((poster) => poster.day))].sort()

  return (
    <div className="grid gap-3">
      <div className="grid gap-1 text-xs text-muted">
        <label htmlFor="poster-search">Search posters</label>
        <div className="relative">
          <input
            id="poster-search"
            type="search"
            value={values.q}
            onChange={(event) => onChange({ q: event.target.value })}
            placeholder="Title, author, abstract, code, or board"
            className={cn(
              "h-11 w-full rounded-[0.6rem] border border-line bg-card px-3 text-base text-foreground shadow-lift placeholder:text-muted/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              values.q && "pr-11",
            )}
          />
          {values.q ? <ResetButton label="Clear search" className="right-1.5" onClick={() => onChange({ q: "" })} /> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Type">
          <SelectShell value={values.type} onClear={() => onChange({ type: "" })} clearLabel="Clear type">
            <select className={selectClass} value={values.type} onChange={(event) => onChange({ type: event.target.value })}>
              <option value="">All types</option>
              <option value="featured">Featured</option>
              <option value="poster">Poster</option>
            </select>
          </SelectShell>
        </Field>
        <Field label="Track">
          <SelectShell value={values.track} onClear={() => onChange({ track: "" })} clearLabel="Clear track">
            <select className={selectClass} value={values.track} onChange={(event) => onChange({ track: event.target.value })}>
              <option value="">All tracks</option>
              {tracks.map((track) => (
                <option key={track.slug} value={track.slug}>
                  {track.name}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>
        <Field label="Room">
          <SelectShell value={values.room} onClear={() => onChange({ room: "" })} clearLabel="Clear room">
            <select className={selectClass} value={values.room} onChange={(event) => onChange({ room: event.target.value })}>
              <option value="">All rooms</option>
              {rooms.map((room) => (
                <option key={room} value={slugify(room)}>
                  {room}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>
        <Field label="Day">
          <SelectShell value={values.day} onClear={() => onChange({ day: "" })} clearLabel="Clear day">
            <select className={selectClass} value={values.day} onChange={(event) => onChange({ day: event.target.value })}>
              <option value="">All days</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {formatDay(day)}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>
        <Field label="Photo">
          <SelectShell value={values.photo} onClear={() => onChange({ photo: "" })} clearLabel="Clear photo">
            <select className={selectClass} value={values.photo} onChange={(event) => onChange({ photo: event.target.value })}>
              <option value="">With or without</option>
              <option value="yes">Has a photo</option>
              <option value="no">No photo yet</option>
            </select>
          </SelectShell>
        </Field>
        {showGrouping ? (
          <fieldset className="grid gap-1">
            <legend className="text-xs text-muted">Group by</legend>
            <ToggleGroup
              type="single"
              value={values.by}
              onValueChange={(value) => {
                if (value === "track" || value === "room" || value === "day" || value === "type") onChange({ by: value })
              }}
              aria-label="Group by"
            >
              <ToggleGroupItem value="track">Track</ToggleGroupItem>
              <ToggleGroupItem value="room">Room</ToggleGroupItem>
              <ToggleGroupItem value="day">Day</ToggleGroupItem>
              <ToggleGroupItem value="type">Type</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>
        ) : null}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid min-w-40 gap-1 text-xs text-muted">
      {label}
      {children}
    </label>
  )
}

function SelectShell({
  value,
  onClear,
  clearLabel,
  children,
}: {
  value: string
  onClear: () => void
  clearLabel: string
  children: ReactNode
}) {
  return (
    <span className="relative block">
      <span className={cn(value && "[&_select]:pr-16")}>{children}</span>
      {value ? <ResetButton label={clearLabel} className="right-8" onClick={onClear} /> : null}
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted" />
    </span>
  )
}

function ResetButton({ label, className, onClick }: { label: string; className?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "absolute top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-background hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <X className="size-3.5" />
    </button>
  )
}

function unique(tracks: Poster["track"][]) {
  const seen = new Map<string, Poster["track"]>()
  for (const track of tracks) seen.set(track.slug, track)
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}
