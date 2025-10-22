import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import * as fs from "node:fs";
import path from "node:path";
import { drizzle } from "~/database/drizzle";
import { scanProcessQueuesTable } from "~/database/drizzle/entities";
import { insertDastVulnerabilitiesFromFile } from "~/database/drizzle/repositories/vulnerabilities/insert-dast-vulnerabilities-from-file";
import { env } from "~/env";
import { ScanStatus } from "~/types/enums/scan-status.enums";
import { ScanType } from "~/types/enums/scan-type.enums";
import { ZapScripts } from "~/types/enums/zap-scripts.enums";
import { extractErrorInfo } from "~/utils/extract-error-info";
import {
  buildZapCommand,
  ensureReportsDir,
  getReportsDir,
  runZapScan,
} from "~/utils/run-dast-scan.snyk";
import { CronTask } from "./cron-task";

@Injectable()
export class DastCronService extends CronTask {
  interval = env.CRON_DAST_INTERVAL;
  disabled = env.CRON_DAST_DISABLED;

  async execute() {
    const now = new Date();
    let reportsDir: string | null = null;
    let jsonReportPath: string | null = null;

    const processQueueCandidate =
      await drizzle.query.scanProcessQueuesTable.findFirst({
        with: {
          project: true,
        },
        where: and(
          eq(scanProcessQueuesTable.scanType, ScanType.DYNAMIC),
          eq(scanProcessQueuesTable.status, ScanStatus.PENDING),
          isNull(scanProcessQueuesTable.executedAt),
        ),
        orderBy: desc(scanProcessQueuesTable.requestedAt),
      });

    try {
      if (processQueueCandidate) {
        await drizzle
          .update(scanProcessQueuesTable)
          .set({ status: ScanStatus.RUNNING })
          .where(eq(scanProcessQueuesTable.id, processQueueCandidate.id))
          .execute();
      } else {
        console.log(`[${now.toISOString()}] No pending DAST scan found.`);
        return;
      }

      if (!processQueueCandidate.project.systemUrl) {
        await drizzle
          .update(scanProcessQueuesTable)
          .set({
            status: ScanStatus.FAILED,
            executedAt: new Date(),
            errorName: "MissingSystemUrl",
            errorStringified: "Project does not have a system URL configured.",
          })
          .where(eq(scanProcessQueuesTable.id, processQueueCandidate.id))
          .execute();

        console.error(
          `Project ${processQueueCandidate.project.id} does not have a system URL configured.`,
        );

        return;
      }

      // Build and run ZAP baseline scan against the system URL
      reportsDir = getReportsDir(process.cwd());
      ensureReportsDir(reportsDir);
      const targetUrl = processQueueCandidate.project.systemUrl;
      const command = buildZapCommand(
        ZapScripts.BASELINE,
        targetUrl,
        reportsDir,
      );
      console.log(`[DAST] Iniciando scan ZAP em: ${targetUrl}`);
      const { jsonPath } = await runZapScan(command, targetUrl, reportsDir);
      jsonReportPath = jsonPath;

      // Persistir vulnerabilidades extraídas do relatório JSON
      if (jsonReportPath && fs.existsSync(jsonReportPath)) {
        await insertDastVulnerabilitiesFromFile(
          jsonReportPath,
          processQueueCandidate.id,
          processQueueCandidate.project.id,
        );
      }

      await drizzle
        .update(scanProcessQueuesTable)
        .set({
          status: ScanStatus.COMPLETED,
          executedAt: new Date(),
        })
        .where(eq(scanProcessQueuesTable.id, processQueueCandidate.id))
        .execute();
    } catch (error) {
      await this.logError(error, {
        scanProcessQueueId: processQueueCandidate?.id,
      });

      if (processQueueCandidate) {
        const errorDetails = extractErrorInfo(error);
        await drizzle
          .update(scanProcessQueuesTable)
          .set({
            status: ScanStatus.FAILED,
            executedAt: new Date(),
            errorName: `${errorDetails.errorName} -> ${errorDetails.errorMessage}`,
            errorStringified: errorDetails.errorStringified,
            errorStack: errorDetails.errorStack,
          })
          .where(eq(scanProcessQueuesTable.id, processQueueCandidate.id))
          .execute();
      }
    } finally {
      try {
        // Limpeza: remover relatórios gerados
        if (jsonReportPath && fs.existsSync(jsonReportPath)) {
          await fs.promises.rm(jsonReportPath, { force: true });
        }
        // Remover zap.yaml gerado pelo ZAP na mesma pasta de relatórios
        if (reportsDir) {
          const yamlPath = path.join(reportsDir, "zap.yaml");
          if (fs.existsSync(yamlPath)) {
            await fs.promises.rm(yamlPath, { force: true });
          }
        }
      } catch (cleanupError) {
        console.error("Erro ao limpar arquivos temporários:", cleanupError);
        this.logError(cleanupError, {
          scanProcessQueueId: processQueueCandidate?.id,
        });
      }
    }
  }
}
