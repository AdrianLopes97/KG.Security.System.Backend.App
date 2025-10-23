import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ZapScripts } from "~/types/enums/zap-scripts.enums";

export const ZAP_SCRIPTS: Record<ZapScripts, string> = {
  [ZapScripts.FULL]: "zap-full-scan.py",
  [ZapScripts.BASELINE]: "zap-baseline.py",
};

export const getReportsDir = (__dirname: string): string =>
  path.resolve(__dirname, "zap-reports");

export const ensureReportsDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    console.log(`[ZAP-SCAN] Criando diretório de relatórios em: ${dir}`);
    fs.mkdirSync(dir);
  }
};

export const buildZapCommand = (
  scanType: ZapScripts,
  targetUrl: string,
  reportsDir: string,
): string =>
  `docker run --rm --memory="4g" --cpus="2.0" -v "${reportsDir}:/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable ${ZAP_SCRIPTS[scanType]} -t ${targetUrl} -J report.json -d`;

export const runZapScan = async (
  command: string,
  targetUrl: string,
  reportsDir: string,
): Promise<{ jsonPath: string }> => {
  return new Promise(resolve => {
    exec(command, (error, stdout, stderr) => {
      const jsonPath = path.join(reportsDir, "report.json");
      const errCodeRaw = (error as unknown as { code?: number | string })?.code;
      let errCode = 0;
      if (typeof errCodeRaw === "number") {
        errCode = errCodeRaw;
      } else if (typeof errCodeRaw === "string") {
        const parsed = Number.parseInt(errCodeRaw, 10);
        errCode = Number.isNaN(parsed) ? 0 : parsed;
      }
      const acceptableExitCodes = new Set([0, 1, 2]);

      console.log(`[ZAP-SCAN] Comando executado: ${command}`);
      if (stdout) console.log(`[ZAP-SCAN] Stdout:\n${stdout}`);
      if (stderr) console.log(`[ZAP-SCAN] Stderr:\n${stderr}`);

      if (error && !acceptableExitCodes.has(errCode)) {
        console.error(
          `[ERRO] Execução do ZAP retornou código ${errCode} para '${targetUrl}'. Trataremos como falha do processo (não de achados). Detalhes: ${JSON.stringify(
            error,
          )}`,
        );
      } else if (error && acceptableExitCodes.has(errCode)) {
        console.log(
          `[ZAP-SCAN] ZAP finalizado com exit code ${errCode} (interpretação: findings/avisos). Prosseguindo com o relatório JSON se disponível.`,
        );
      } else {
        console.log(
          `[ZAP-SCAN] Scan para '${targetUrl}' concluído. Relatórios salvos em: ${reportsDir}`,
        );
      }

      resolve({ jsonPath });
    });
  });
};
