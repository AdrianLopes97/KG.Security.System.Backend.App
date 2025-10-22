import { eq } from "drizzle-orm";
import { drizzle } from "~/database/drizzle";
import { monitoringRulesTable } from "~/database/drizzle/entities";
import type { MonitoringRule } from "~/database/drizzle/entities/monitoring-rules";

export async function getActiveRules(): Promise<MonitoringRule[]> {
  return drizzle
    .select()
    .from(monitoringRulesTable)
    .where(eq(monitoringRulesTable.isActive, true));
}
