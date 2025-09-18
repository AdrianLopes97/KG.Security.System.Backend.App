import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import * as fs from "fs";
import { drizzle } from "~/database/drizzle";
import { scanProcessQueuesTable } from "~/database/drizzle/entities";
import { insertVulnerabilitiesFromFile } from "~/database/drizzle/repositories/vulnerabilities/insert-vulnerabilities-from-file";
import { env } from "~/env";
import { ScanStatus } from "~/types/enums/scan-status.enums";
import { ScanType } from "~/types/enums/scan-type.enums";
import { cloneOrUpdateRepo } from "~/utils/clone-or-update-repo";
import { runSastScan } from "~/utils/run-sast-scan.snyk";
import { CronTask } from "./cron-task";

@Injectable()
export class SastCronService extends CronTask {
  interval = env.CRON_SAST_INTERVAL;
  disabled = env.CRON_SAST_DISABLED;

  async execute() {
    const now = new Date();
    let tempClonePath: string | null = null;
    let tempResultPath: string | null = null;

    const processQueueCandidate =
      await drizzle.query.scanProcessQueuesTable.findFirst({
        with: {
          project: true,
        },
        where: and(
          eq(scanProcessQueuesTable.scanType, ScanType.STATIC),
          eq(scanProcessQueuesTable.status, ScanStatus.PENDING),
          isNull(scanProcessQueuesTable.executedAt),
        ),
        orderBy: desc(scanProcessQueuesTable.requestedAt),
      });

    try {
      if (!processQueueCandidate) {
        console.log(`[${now.toISOString()}] No pending SAST scan found.`);

        return;
      } else {
        await drizzle
          .update(scanProcessQueuesTable)
          .set({ status: ScanStatus.RUNNING })
          .where(eq(scanProcessQueuesTable.id, processQueueCandidate.id))
          .execute();
      }

      if (!processQueueCandidate.project.githubUrl) {
        await drizzle
          .update(scanProcessQueuesTable)
          .set({
            status: ScanStatus.FAILED,
            executedAt: new Date(),
            errorName: "MissingGitHubUrl",
            errorStringified: "Project does not have a GitHub URL configured.",
          })
          .where(eq(scanProcessQueuesTable.id, processQueueCandidate.id))
          .execute();

        console.error(
          `Project ${processQueueCandidate.project.id} does not have a GitHub URL configured.`,
        );

        return;
      }

      tempClonePath = await cloneOrUpdateRepo(
        processQueueCandidate.project.githubUrl,
        processQueueCandidate.id,
      );

      tempResultPath = await runSastScan(
        tempClonePath,
        processQueueCandidate.id,
        now.toISOString(),
      );

      await insertVulnerabilitiesFromFile(
        tempResultPath,
        processQueueCandidate.id,
      );
    } catch (error) {
      await this.logError(error, {
        scanProcessQueueId: processQueueCandidate?.id,
      });
    } finally {
      try {
        if (tempClonePath) {
          // Limpa o clone temporário
          console.log(`Limpando diretório temporário: ${tempClonePath}`);
          await fs.promises.rm(tempClonePath, { recursive: true, force: true });
        }

        if (tempResultPath) {
          // Limpa o resultado temporário
          console.log(
            `Limpando arquivo de resultado temporário: ${tempResultPath}`,
          );
          await fs.promises.rm(tempResultPath, {
            recursive: true,
            force: true,
          });
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
