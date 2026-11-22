import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { pageWindow } from "@/lib/utils/pagination";

// Page links that keep any existing filters (search/location) in the URL
export default function EventsPager({ page, totalPages, query = {} }) {
  if (totalPages <= 1) return null;
  const href = (p) => `?${new URLSearchParams({ ...query, page: String(p) })}`;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href={href(Math.max(1, page - 1))} aria-disabled={page <= 1} /></PaginationItem>
        {pageWindow(page, totalPages).map((p) => (
          <PaginationItem key={p}><PaginationLink href={href(p)} isActive={p === page}>{p}</PaginationLink></PaginationItem>
        ))}
        <PaginationItem><PaginationNext href={href(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} /></PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
