import { PaginationQuery } from "~/types/pagination-query.request";
import { Pagination } from "~/types/pagination.response";

export function getPaginationResponse(
  totalCount: number,
  paginationInput?: PaginationQuery | null,
): Pagination {
  if (!paginationInput || !paginationInput.page || !paginationInput.limit) {
    return {
      pageCount: 1,
      totalCount,
      hasMore: false,
    };
  }

  const pageCount = paginationInput
    ? Math.max(Math.ceil(totalCount / paginationInput.limit), 1)
    : 1;

  const page = paginationInput?.page ?? 1;

  return {
    pageCount,
    totalCount,
    hasMore: page < pageCount,
  };
}
