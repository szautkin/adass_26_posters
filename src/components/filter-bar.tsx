import type { ReactNode } from "react"
import type { Poster, GroupBy } from "../lib/posters.ts"
import { formatDay, slugify } from "../lib/posters.ts"
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
  "h-10 rounded-[0.6rem] border border-line bg-card px-3 text-sm text-foreground shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

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
      <label className="grid gap-1 text-xs text-muted">
        Search posters
        <input
          value={values.q}
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder="Title, author, abstract, code, or board"
          className="h-11 rounded-[0.6rem] border border-line bg-card px-3 text-base text-foreground shadow-lift placeholder:text-muted/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Type">
          <select className={selectClass} value={values.type} onChange={(event) => onChange({ type: event.target.value })}>
            <option value="">All types</option>
            <option value="featured">Featured</option>
            <option value="poster">Poster</option>
          </select>
        </Field>
        <Field label="Track">
          <select className={selectClass} value={values.track} onChange={(event) => onChange({ track: event.target.value })}>
            <option value="">All tracks</option>
            {tracks.map((track) => (
              <option key={track.slug} value={track.slug}>
                {track.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room">
          <select className={selectClass} value={values.room} onChange={(event) => onChange({ room: event.target.value })}>
            <option value="">All rooms</option>
            {rooms.map((room) => (
              <option key={room} value={slugify(room)}>
                {room}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Day">
          <select className={selectClass} value={values.day} onChange={(event) => onChange({ day: event.target.value })}>
            <option value="">All days</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {formatDay(day)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Photo">
          <select className={selectClass} value={values.photo} onChange={(event) => onChange({ photo: event.target.value })}>
            <option value="">With or without</option>
            <option value="yes">Has a photo</option>
            <option value="no">No photo yet</option>
          </select>
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
    <label className="grid gap-1 text-xs text-muted">
      {label}
      {children}
    </label>
  )
}

function unique(tracks: Poster["track"][]) {
  const seen = new Map<string, Poster["track"]>()
  for (const track of tracks) seen.set(track.slug, track)
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}
