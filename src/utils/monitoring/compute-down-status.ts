import dayjs from "dayjs";
import type { Heartbeat } from "~/database/drizzle/entities/heartbeats";
import type { MonitoringRule } from "~/database/drizzle/entities/monitoring-rules";
import "~/dayjs";
import { HeartbeatStatus } from "~/types/enums/heartbeats.enums";
import type { DownEvaluation } from "~/types/monitoring.types";

export function computeDownStatus(
  rule: MonitoringRule,
  latestHeartbeat: Heartbeat,
  now: Date,
): DownEvaluation {
  const secondsSinceLast = dayjs(now).diff(
    dayjs(latestHeartbeat.receivedAt),
    "second",
  );
  const isTimeout = secondsSinceLast > (rule.timeoutThresholdSeconds ?? 0);
  const isErrorStatus = latestHeartbeat.status === HeartbeatStatus.ERROR;
  const isDown = isTimeout || isErrorStatus;
  let reason: DownEvaluation["reason"]; // inferred union
  if (isDown) {
    reason = isTimeout ? "TIMEOUT_EXCEEDED" : "HEARTBEAT_ERROR";
  }

  return {
    isDown,
    isTimeout,
    isErrorStatus,
    secondsSinceLast,
    reason,
  };
}
