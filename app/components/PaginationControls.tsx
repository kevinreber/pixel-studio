import React from "react";
import { Link, useSearchParams } from "@remix-run/react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

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
              className="min-w-[40px] hover:bg-accent hover:text-accent-foreground transition-colors"
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
            className="min-w-[40px] hover:bg-accent hover:text-accent-foreground transition-colors"
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
              className="min-w-[40px] hover:bg-accent hover:text-accent-foreground transition-colors"
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
              className="min-w-[40px] hover:bg-accent hover:text-accent-foreground transition-colors"
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

  return (
    <div className="w-full flex justify-center">
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 mt-2 mb-2 p-0 shadow-lg">
        <Pagination className={className}>
          <PaginationContent className="gap-1">
            {hasPrevPage && (
              <PaginationItem>
                <PaginationPrevious
                  href={createPageUrl(currentPage - 1)}
                  className="hover:bg-accent hover:text-accent-foreground transition-colors"
                />
              </PaginationItem>
            )}

            {renderPageNumbers()}

            {hasNextPage && (
              <PaginationItem>
                <PaginationNext
                  href={createPageUrl(currentPage + 1)}
                  className="hover:bg-accent hover:text-accent-foreground transition-colors"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default PaginationControls;
