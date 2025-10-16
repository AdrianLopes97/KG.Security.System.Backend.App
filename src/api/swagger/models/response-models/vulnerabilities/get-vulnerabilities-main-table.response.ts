import { Pagination } from "~/types/pagination.response";
import { GetVulnerabilitiesResponse } from "./get-vulnerabilities.response";

export interface GetVulnerabilitiesMainTableResponse {
  pagination: Pagination;
  vulnerabilities: GetVulnerabilitiesResponse[];
  totalCount: number;
  pendingScans: number;
  successfulScans: number;
  failedScans: number;
}
