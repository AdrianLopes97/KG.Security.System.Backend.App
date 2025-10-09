import { UpTimeStatus } from "~/types/enums/up-time-status.enum";

export interface GetProjectsResponse {
  id: string;
  name: string;
  createdAt: Date;
  upTimeStatus: UpTimeStatus;
  systemUrl?: string | null;
  totalVulnerabilities: number;
  uptimePercentage?: number | null;
  lastScanAt?: Date | null;
  logsCount: number;
}
