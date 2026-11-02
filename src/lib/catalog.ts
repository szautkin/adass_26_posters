import type { Poster } from "./posters.ts"
import raw from "../data/posters.json" with { type: "json" }

export const posters = raw as Poster[]
