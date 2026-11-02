import { describe, expect, it } from "vitest"
import { filterPosters, groupPosters, paginate, type Poster } from "./posters.ts"

function poster(overrides: Partial<Poster> & Pick<Poster, "code" | "title">): Poster {
  return {
    abstract: "A study of astronomical software.",
    type: "Poster",
    track: { name: "Topical Computing, Software and Algorithms", slug: "topical" },
    room: "Conference Foyer 1",
    day: "2026-11-02",
    start: "10:00",
    duration: "00:09",
    persons: [{ name: "Ada Lovelace", code: "AL" }],
    url: "https://example.test",
    ...overrides,
  }
}

const posters: Poster[] = [
  poster({ code: "AAAAAA", title: "Golden image pipelines", persons: [{ name: "Conrad Holmberg", code: "CH" }], board: "P603" }),
  poster({
    code: "BBBBBB",
    title: "Sky brightness network",
    type: "Featured Poster",
    track: { name: "AI for discovery", slug: "ai" },
    room: "Seminar Room 2",
    day: "2026-11-03",
    start: "11:00",
    persons: [{ name: "Simón Torres", code: "ST" }],
    image: { full: "/a.webp", thumb: "/a-thumb.webp" },
  }),
  poster({ code: "CCCCCC", title: "Archive scaling", day: "2026-11-04", start: "09:00" }),
]

describe("filterPosters", () => {
  it("matches a title, an author, a code, and a board number", () => {
    const base = { type: "", track: "", room: "", day: "", photo: "" } as const
    expect(filterPosters(posters, { ...base, q: "holmberg" }).map((item) => item.code)).toEqual(["AAAAAA"])
    expect(filterPosters(posters, { ...base, q: "bbbbbb" }).map((item) => item.code)).toEqual(["BBBBBB"])
    expect(filterPosters(posters, { ...base, q: "p603" }).map((item) => item.code)).toEqual(["AAAAAA"])
  })

  it("filters by type, room, day, and photo", () => {
    const base = { q: "", type: "", track: "", room: "", day: "", photo: "" } as const
    expect(filterPosters(posters, { ...base, type: "featured" })).toHaveLength(1)
    expect(filterPosters(posters, { ...base, room: "seminar-room-2" })).toHaveLength(1)
    expect(filterPosters(posters, { ...base, day: "2026-11-04" })).toHaveLength(1)
    expect(filterPosters(posters, { ...base, photo: "yes" })).toHaveLength(1)
    expect(filterPosters(posters, { ...base, photo: "no" })).toHaveLength(2)
  })
})

describe("groupPosters", () => {
  it("groups by track and orders the larger group first", () => {
    const groups = groupPosters(posters, "track")
    expect(groups.map((group) => group.id)).toEqual(["topical", "ai"])
    expect(groups[0]?.posters).toHaveLength(2)
  })

  it("orders days chronologically and featured posters before the rest", () => {
    expect(groupPosters(posters, "day").map((group) => group.id)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"])
    expect(groupPosters(posters, "type").map((group) => group.id)).toEqual(["featured", "poster"])
  })
})

describe("paginate", () => {
  it("slices a page and clamps an out-of-range page", () => {
    const items = ["a", "b", "c", "d", "e"]
    expect(paginate(items, 2, 2)).toMatchObject({ items: ["c", "d"], page: 2, pages: 3, total: 5 })
    expect(paginate(items, 9, 2).page).toBe(3)
    expect(paginate([], 1, 12)).toMatchObject({ items: [], page: 1, pages: 1, total: 0 })
  })
})
