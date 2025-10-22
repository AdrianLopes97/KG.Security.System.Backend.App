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
      console.log(
        `[ZAP-SCAN] O processo de scan para '${targetUrl}' foi finalizado.`,
      );
      const jsonPath = path.join(reportsDir, "report.json");
      if (error) {
        console.error(
          `[ERRO] Falha ao executar o scan para '${targetUrl}': ${error.message}`,
        );
        console.error(`[ERRO] Stderr: ${stderr}`);
        return resolve({ jsonPath });
      }
      console.log(
        `[SUCESSO] Scan para '${targetUrl}' concluído. Relatórios salvos em: ${reportsDir}`,
      );
      console.log(`[SUCESSO] Stdout: ${stdout}`);
      resolve({ jsonPath });
    });
  });
};
