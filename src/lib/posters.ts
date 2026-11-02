export type PosterType = "Poster" | "Featured Poster"

export type Poster = {
  code: string
  title: string
  abstract: string
  type: PosterType
  track: { name: string; slug: string }
  room: string
  day: string
  start: string
  duration: string
  persons: { name: string; code: string }[]
  url: string
  pdf?: string
  board?: string
  image?: { full: string; thumb: string }
}

export type GroupBy = "track" | "room" | "day" | "type"
export type ViewMode = "cards" | "sections"

export type Filters = {
  q: string
  type: "" | "featured" | "poster"
  track: string
  room: string
  day: string
  photo: "" | "yes" | "no"
}

export type PosterGroup = {
  id: string
  label: string
  posters: Poster[]
}

export const PAGE_SIZE = 12
export const SECTION_PREVIEW = 6

const PIPS = ["#0e6b6e", "#b8893a", "#3e6b52", "#a24b32", "#3d4d73", "#8a6232", "#6d4c6f"]

const dayFormat = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Australia/Perth",
})

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function formatDay(day: string): string {
  return dayFormat.format(new Date(`${day}T12:00:00+08:00`))
}

export function authorLine(poster: Poster): string {
  return poster.persons.map((person) => person.name).join(", ")
}

export function abstractParagraphs(abstract: string): string[] {
  return abstract
    .replace(/\r\n/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean)
}

export function pipFor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PIPS[hash % PIPS.length] ?? PIPS[0]
}

export function sortPosters(posters: Poster[]): Poster[] {
  return [...posters].sort(
    (a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title),
  )
}

export function filterPosters(posters: Poster[], filters: Filters): Poster[] {
  const query = filters.q.trim().toLowerCase()
  return posters.filter((poster) => {
    if (filters.type === "featured" && poster.type !== "Featured Poster") return false
    if (filters.type === "poster" && poster.type !== "Poster") return false
    if (filters.track && poster.track.slug !== filters.track) return false
    if (filters.room && slugify(poster.room) !== filters.room) return false
    if (filters.day && poster.day !== filters.day) return false
    if (filters.photo === "yes" && !poster.image) return false
    if (filters.photo === "no" && poster.image) return false
    if (!query) return true
    const haystack = [
      poster.title,
      poster.abstract,
      poster.code,
      poster.board ?? "",
      ...poster.persons.map((person) => person.name),
    ]
      .join(" ")
      .toLowerCase()
    return haystack.includes(query)
  })
}

export function groupKey(poster: Poster, by: GroupBy): { id: string; label: string } {
  if (by === "track") return { id: poster.track.slug, label: poster.track.name }
  if (by === "room") return { id: slugify(poster.room), label: poster.room }
  if (by === "day") return { id: poster.day, label: formatDay(poster.day) }
  return {
    id: poster.type === "Featured Poster" ? "featured" : "poster",
    label: poster.type === "Featured Poster" ? "Featured posters" : "Posters",
  }
}

export function groupPosters(posters: Poster[], by: GroupBy): PosterGroup[] {
  const groups = new Map<string, PosterGroup>()
  for (const poster of sortPosters(posters)) {
    const key = groupKey(poster, by)
    const existing = groups.get(key.id)
    if (existing) existing.posters.push(poster)
    else groups.set(key.id, { id: key.id, label: key.label, posters: [poster] })
  }
  const list = [...groups.values()]
  if (by === "day") return list.sort((a, b) => a.id.localeCompare(b.id))
  if (by === "type") return list.sort((a, b) => (a.id === "featured" ? -1 : b.id === "featured" ? 1 : 0))
  return list.sort((a, b) => b.posters.length - a.posters.length || a.label.localeCompare(b.label))
}

export function postersInGroup(posters: Poster[], by: GroupBy, groupId: string): Poster[] {
  if (groupId === "all") return sortPosters(posters)
  return sortPosters(posters.filter((poster) => groupKey(poster, by).id === groupId))
}

export function paginate<T>(items: T[], page: number, perPage = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / perPage))
  const current = Math.min(Math.max(page, 1), pages)
  const start = (current - 1) * perPage
  return { items: items.slice(start, start + perPage), page: current, pages, total: items.length }
}
