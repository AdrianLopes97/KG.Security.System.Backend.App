import { Pagination } from "~/types/pagination.response";

export class PagedResponse<T> {
  data: T[];
  pagination: Pagination;

  constructor(data: T[], pagination: Pagination) {
    this.data = data;
    this.pagination = pagination;
  }
}
