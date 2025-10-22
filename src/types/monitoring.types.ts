import { Heartbeat } from "~/database/drizzle/entities/heartbeats";

export type DownReason = "TIMEOUT_EXCEEDED" | "HEARTBEAT_ERROR";

export interface DownEvaluation {
  isDown: boolean;
  isTimeout: boolean;
  isErrorStatus: boolean;
  secondsSinceLast: number;
  reason?: DownReason | null;
}

export interface SlackMessage {
  text: string;
}

export interface HttpPostJsonResult {
  delivered: boolean;
  statusCode: number;
  responseBody?: string | null;
  error?: string | null;
}

export interface LatestHeartbeatResult {
  heartbeat?: Heartbeat | null;
}
