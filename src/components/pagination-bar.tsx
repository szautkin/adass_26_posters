import { Button } from "./ui/button.tsx"

export function PaginationBar({
  page,
  pages,
  total,
  onPage,
}: {
  page: number
  pages: number
  total: number
  onPage: (page: number) => void
}) {
  if (pages < 2) return null
  return (
    <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-sm text-muted">
        Page {page} of {pages}
        <span className="sr-only">, {total} posters</span>
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Next
        </Button>
      </div>
    </nav>
  )
}
