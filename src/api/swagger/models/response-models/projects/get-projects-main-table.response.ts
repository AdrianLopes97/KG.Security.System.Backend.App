import { Pagination } from "~/types/pagination.response";
import { GetProjectsResponse } from "./get-projects.response";

export interface GetProjectsMainTableResponse {
  pagination: Pagination;
  projects: GetProjectsResponse[];
  totalCount: number;
  vulnerabilityTotalCount: number;
  logsTotalCount: number;
  totalProjectsOnlineCount: number;
}
