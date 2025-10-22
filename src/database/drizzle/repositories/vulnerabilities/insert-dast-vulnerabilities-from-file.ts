import crypto from "node:crypto";
import fs from "node:fs";
import { drizzle } from "~/database/drizzle";
import {
  NewVulnerability,
  vulnerabilitiesTable,
} from "~/database/drizzle/entities/vulnerabilities";
import type {
  ZapAlert,
  ZapInstance,
  ZapReport,
} from "~/models/dast-results.model";
import { ScanType } from "~/types/enums/scan-type.enums";
import { VulnerabilitySeverity } from "~/types/enums/vulnerabilities.enums";

const mapRiskToSeverity = (riskcode?: string): VulnerabilitySeverity => {
  switch (riskcode) {
    case "3":
      return VulnerabilitySeverity.ERROR; // High
    case "2":
      return VulnerabilitySeverity.WARNING; // Medium
    case "1":
    case "0":
    default:
      return VulnerabilitySeverity.NOTE; // Low/Informational
  }
};

const buildDescription = (alert: ZapAlert): string => {
  const title = alert.alert || alert.name || "ZAP Alert";
  const risk = alert.riskdesc ? `Risk: ${alert.riskdesc}` : "";
  const desc = alert.desc ? `\n\n${alert.desc}` : "";
  const solution = alert.solution ? `\n\nSolution: ${alert.solution}` : "";
  const filePath =
    alert.instances && alert.instances.length > 0
      ? `\n\nAffected URL(s):\n${alert.instances
          .map((inst: ZapInstance) => `- ${inst.uri || "unknown"}`)
          .join("\n")}`
      : "";
  return [title, risk, desc, solution, filePath].filter(Boolean).join("\n");
};

const buildFingerprint = (
  ruleId: string,
  instance?: ZapInstance,
): string | null => {
  const base = `${ruleId}|${instance?.uri ?? ""}|${instance?.param ?? ""}`;
  if (!base) return null;
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 255);
};

/**
 * Lê um arquivo JSON de relatório do ZAP e insere as vulnerabilidades no banco de dados.
 */
export async function insertDastVulnerabilitiesFromFile(
  filePath: string,
  scanId: string,
  projectId: string,
): Promise<void> {
  const content = fs.readFileSync(filePath, "utf-8");
  const report: ZapReport = JSON.parse(content);
  const sites = report.site ?? [];

  const rows: NewVulnerability[] = [];

  for (const site of sites) {
    const alerts = site.alerts ?? [];
    for (const alert of alerts) {
      const ruleId =
        alert.pluginid || alert.alertRef || alert.name || "unknown";
      const severity = mapRiskToSeverity(alert.riskcode);
      const description = buildDescription(alert);

      // Se houver instances, criamos uma vuln por ocorrência (URI/param diferentes)
      const instances = alert.instances ?? [];
      if (instances.length > 0) {
        for (const inst of instances) {
          rows.push({
            scanId,
            projectId,
            ruleId,
            scanType: ScanType.DYNAMIC,
            severity,
            description,
            filePath: inst.uri || site["@name"] || "",
            lineNumber: 0,
            fingerprint: buildFingerprint(ruleId, inst),
            priorityScore: null,
            codeFlow: {
              zap: {
                instance: {
                  id: inst.id ?? null,
                  uri: inst.uri ?? null,
                  method: inst.method ?? null,
                  param: inst.param ?? null,
                  attack: inst.attack ?? null,
                  evidence: inst.evidence ?? null,
                  otherinfo: inst.otherinfo ?? null,
                },
                alert: {
                  pluginid: alert.pluginid ?? null,
                  riskcode: alert.riskcode ?? null,
                  confidence: alert.confidence ?? null,
                  cweid: alert.cweid ?? null,
                  wascid: alert.wascid ?? null,
                  reference: alert.reference ?? null,
                  otherinfo: alert.otherinfo ?? null,
                  riskdesc: alert.riskdesc ?? null,
                },
                site: {
                  name: site["@name"] ?? null,
                  host: site["@host"] ?? null,
                  port: site["@port"] ?? null,
                  ssl: site["@ssl"] ?? null,
                },
              },
            },
          });
        }
      } else {
        // Sem instances: cria uma entrada genérica por alerta
        rows.push({
          scanId,
          projectId,
          ruleId,
          scanType: ScanType.DYNAMIC,
          severity,
          description,
          filePath: site["@name"] || "",
          lineNumber: 0,
          fingerprint: buildFingerprint(ruleId),
          priorityScore: null,
          codeFlow: {
            zap: {
              alert: {
                pluginid: alert.pluginid ?? null,
                riskcode: alert.riskcode ?? null,
                confidence: alert.confidence ?? null,
                cweid: alert.cweid ?? null,
                wascid: alert.wascid ?? null,
                reference: alert.reference ?? null,
                otherinfo: alert.otherinfo ?? null,
                riskdesc: alert.riskdesc ?? null,
                count: alert.count ?? null,
              },
              site: {
                name: site["@name"] ?? null,
                host: site["@host"] ?? null,
                port: site["@port"] ?? null,
                ssl: site["@ssl"] ?? null,
              },
            },
          },
        });
      }
    }
  }

  if (rows.length === 0) {
    console.log(`Nenhuma vulnerabilidade ZAP encontrada no scan ${scanId}.`);
    return;
  }

  await drizzle.insert(vulnerabilitiesTable).values(rows);
  console.log(
    `Inserção de vulnerabilidades ZAP concluída para o scan ${scanId}.`,
  );
}
