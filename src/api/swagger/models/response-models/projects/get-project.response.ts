import { UpTimeStatus } from "~/types/enums/up-time-status.enum";

export class GetProjectResponse {
  name: string;
  createdAt: Date;
  githubUrl: string | null;
  systemUrl: string | null;
  upTimeStatus: UpTimeStatus;
  monitoringRules: {
    checkIntervalSeconds: number;
    timeoutThresholdSeconds: number;
    isActive: boolean;
  } | null;
}
