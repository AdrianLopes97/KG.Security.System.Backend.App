import { UpTimeStatus } from "~/types/enums/up-time-status.enum";

export interface GetProjectResponse {
  name: string;
  createdAt: Date;
  githubUrl: string | null;
  systemUrl: string | null;
  upTimeStatus: UpTimeStatus;
  monitoringRules: {
    id: string;
    checkIntervalSeconds: number;
    timeoutThresholdSeconds: number;
    isActive: boolean;
    slackWebhookUrl?: string | null;
  } | null;
}
