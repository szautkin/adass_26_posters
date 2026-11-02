import { writeFileSync, readFileSync, existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const scheduleUrl = "https://pretalx.adass.org/adass2026/schedule/export/schedule.json"
const posterTypes = new Set(["Poster", "Featured Poster"])

function absoluteUrl(url) {
  if (!url) return undefined
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `https://pretalx.adass.org${url.startsWith("/") ? "" : "/"}${url}`
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim()
}

function loadPhotoMap() {
  const path = resolve(root, "src/data/photo-map.json")
  if (!existsSync(path)) return new Map()
  const map = JSON.parse(readFileSync(path, "utf8"))
  const winners = new Map()
  for (const photo of map.photos ?? []) {
    if (!photo.code || photo.confidence === "reject") continue
    const current = winners.get(photo.code)
    if (!current || (photo.sharpness ?? 0) > (current.sharpness ?? 0)) winners.set(photo.code, photo)
  }
  return winners
}

const response = await fetch(scheduleUrl)
if (!response.ok) {
  throw new Error(`Schedule download failed: ${response.status}`)
}
const payload = await response.json()
const conference = payload.schedule.conference
const trackSlug = new Map((conference.tracks ?? []).map((track) => [track.name, track.slug]))
const photos = loadPhotoMap()
const posters = []

for (const day of conference.days ?? []) {
  for (const events of Object.values(day.rooms ?? {})) {
    for (const event of events) {
      if (!posterTypes.has(event.type)) continue
      const attachment = (event.attachments ?? []).find((item) => item.url)
      const photo = photos.get(event.code)
      posters.push({
        code: event.code,
        title: cleanText(event.title),
        abstract: cleanText(event.abstract),
        type: event.type,
        track: {
          name: event.track,
          slug: trackSlug.get(event.track) ?? event.track,
        },
        room: event.room,
        day: String(event.date).slice(0, 10),
        start: event.start,
        duration: event.duration,
        persons: (event.persons ?? []).map((person) => ({
          name: person.public_name || person.name,
          code: person.code,
        })),
        url: event.url,
        ...(attachment ? { pdf: absoluteUrl(attachment.url) } : {}),
        ...(photo?.board ? { board: photo.board } : {}),
        ...(photo
          ? {
              image: {
                full: `/posters/${event.code}.webp`,
                thumb: `/posters/${event.code}-thumb.webp`,
              },
            }
          : {}),
      })
    }
  }
}

posters.sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title))
const destination = resolve(root, "src/data/posters.json")
writeFileSync(destination, `${JSON.stringify(posters, null, 2)}\n`)
console.log(`Wrote ${posters.length} posters to ${destination}`)
