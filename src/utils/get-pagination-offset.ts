import { PaginationQuery } from "~/types/pagination-query.request";

export function getPaginationOffset(pagination: PaginationQuery): number {
  return Math.max((pagination.page - 1) * pagination.limit, 0);
}
