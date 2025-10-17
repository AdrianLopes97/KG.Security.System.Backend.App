import { Pagination } from "~/types/pagination.response";
import { GetObservabilitiesResponse } from "./get-observabilities.response";

export interface GetObservabilitiesMainTableResponse {
  pagination: Pagination;
  observabilities: GetObservabilitiesResponse[];
  totalCount: number;
  errorLogs: number;
  alertLogs: number;
  infoLogs: number;
}
