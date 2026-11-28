import React from "react";
import { useSearchParams } from "@remix-run/react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// The shadcn primitives default to `outline`/`ghost` button variants, which
// paint `border-input` and `bg-background` — pre-redesign tokens that read as a
// pale box in the redesigned shell. Override them with the redesign surfaces.
const linkClassName = (isActive: boolean) =>
  cn(
    "min-w-[40px] border-transparent transition-colors",
    isActive
      ? "bg-surface-2 text-fg"
      : "bg-transparent text-fg-subtle hover:bg-surface-hover hover:text-fg"
  );

const stepClassName =
  "border-transparent bg-transparent text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  basePath?: string;
  searchTerm?: string;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  basePath = "",
  searchTerm = "",
  className,
}) => {
  const [searchParams] = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    if (searchTerm) {
      params.set("q", searchTerm);
    }
    return `${basePath}?${params.toString()}`;
  };

  const renderPageNumbers = () => {
    const pages: React.ReactNode[] = [];
    const maxVisiblePages = 5; // Reduced to prevent cramping

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              href={createPageUrl(i)}
              isActive={currentPage === i}
              className={linkClassName(currentPage === i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            href={createPageUrl(1)}
            isActive={currentPage === 1}
            className={linkClassName(currentPage === 1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis or pages around current page
      if (currentPage > 4) {
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              href={createPageUrl(i)}
              isActive={currentPage === i}
              className={linkClassName(currentPage === i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis or last page
      if (currentPage < totalPages - 3) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href={createPageUrl(totalPages)}
              isActive={currentPage === totalPages}
              className={linkClassName(currentPage === totalPages)}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return pages;
  };

  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // No card, border or shadow around the control: the redesigned pages place
  // content directly on the page background, so a floating panel here read as
  // a stray pale box.
  return (
    <div className="flex w-full justify-center py-2">
      <Pagination className={className}>
        <PaginationContent className="gap-1">
          {hasPrevPage && (
            <PaginationItem>
              <PaginationPrevious
                href={createPageUrl(currentPage - 1)}
                className={stepClassName}
              />
            </PaginationItem>
          )}

          {renderPageNumbers()}

          {hasNextPage && (
            <PaginationItem>
              <PaginationNext
                href={createPageUrl(currentPage + 1)}
                className={stepClassName}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationControls;
