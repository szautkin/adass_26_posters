import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, FileText } from "lucide-react"
import type { Poster } from "../lib/posters.ts"
import { abstractParagraphs, authorLine, formatDay } from "../lib/posters.ts"
import { Badge } from "./ui/badge.tsx"
import { Button } from "./ui/button.tsx"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog.tsx"
import { ScrollArea } from "./ui/scroll-area.tsx"

export function PosterDialog({
  poster,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  poster: Poster | undefined
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}) {
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => setZoomed(false), [poster?.code])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (zoomed) return
      if (event.key === "ArrowLeft" && hasPrevious) onPrevious()
      if (event.key === "ArrowRight" && hasNext) onNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hasNext, hasPrevious, onNext, onPrevious, zoomed])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (zoomed) {
            event.preventDefault()
            setZoomed(false)
          }
        }}
        onInteractOutside={(event) => {
          if (zoomed) {
            event.preventDefault()
            setZoomed(false)
          }
        }}
      >
        {poster ? (
          <div className="grid max-h-[min(92vh,920px)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="border-b border-line bg-[#efeae2] md:border-r md:border-b-0">
              {poster.image ? (
                <button
                  type="button"
                  className="block h-full max-h-[46vh] w-full md:max-h-[min(92vh,920px)]"
                  onClick={() => setZoomed(true)}
                >
                  <img src={poster.image.full} alt={poster.title} className="h-full w-full object-contain" />
                  <span className="sr-only">Enlarge poster image</span>
                </button>
              ) : (
                <div className="flex h-64 flex-col items-start justify-end p-8 md:h-full">
                  <p className="font-serif text-4xl text-foreground">{poster.code}</p>
                  <p className="mt-2 text-sm text-muted">No photograph of this poster yet.</p>
                </div>
              )}
            </div>
            <ScrollArea className="h-[46vh] md:h-[min(92vh,920px)]">
              <div className="grid gap-4 px-5 py-6 pr-14">
                <div className="flex flex-wrap gap-2">
                  <Badge className={poster.type === "Featured Poster" ? "border-wattle text-wattle" : ""}>{poster.type}</Badge>
                  {poster.board ? <Badge>Board {poster.board}</Badge> : null}
                </div>
                <DialogTitle className="font-serif text-3xl leading-tight text-balance text-foreground">{poster.title}</DialogTitle>
                <DialogDescription className="text-sm text-muted">{authorLine(poster)}</DialogDescription>
                <p className="text-sm text-foreground">
                  {poster.track.name}
                  <span className="text-muted"> · {poster.room}</span>
                  <span className="text-muted">
                    {" "}
                    · {poster.start} · {formatDay(poster.day)}
                  </span>
                </p>
                <div className="grid gap-3 text-[15px] leading-relaxed text-foreground">
                  {abstractParagraphs(poster.abstract).map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="primary" asChild>
                    <a href={poster.url} target="_blank" rel="noreferrer">
                      View on Pretalx <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  {poster.pdf ? (
                    <Button asChild>
                      <a href={poster.pdf} target="_blank" rel="noreferrer">
                        Poster PDF <FileText className="size-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
                  <Button size="sm" onClick={onPrevious} disabled={!hasPrevious}>
                    <ChevronLeft className="size-4" /> Previous
                  </Button>
                  <Button size="sm" onClick={onNext} disabled={!hasNext}>
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="p-8">
            <DialogTitle className="font-serif text-2xl">This poster is not in the programme</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted">The link does not match a poster in the schedule.</DialogDescription>
          </div>
        )}
        {zoomed && poster?.image ? (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-[#1b2a30]/80 p-4" onClick={() => setZoomed(false)}>
            <button
              type="button"
              className="absolute top-4 right-4 rounded-[0.6rem] border border-white/30 px-3 py-2 text-sm text-white"
              onClick={() => setZoomed(false)}
            >
              Close image
            </button>
            <img
              src={poster.image.full}
              alt={poster.title}
              className="max-h-[92vh] max-w-[92vw] object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
