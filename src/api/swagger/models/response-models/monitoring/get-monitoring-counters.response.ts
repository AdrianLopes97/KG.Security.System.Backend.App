import { UpTimeStatus } from "~/types/enums/up-time-status.enum";

export interface GetMonitoringCountersResponse {
  systemStatus: UpTimeStatus;
  totalHeartbeats: number;
  currentUptime: string;
  downtimeInTime: string;
  totalTimeMonitored: string;
  sentAlertsCount: number;
  uptimePercentage: number;
  monitoringRules: {
    checkIntervalSeconds: number;
    timeoutThresholdSeconds: number;
    alertsConfigured: number;
  } | null;
}
