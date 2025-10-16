import * as fs from "fs";
import { Sarif } from "~/models/sast-results.model";
import { drizzle } from "../..";
import {
  NewVulnerability,
  vulnerabilitiesTable,
} from "../../entities/vulnerabilities";

/**
 * Lê um arquivo SARIF e insere as vulnerabilidades no banco de dados.
 * @param filePath Caminho do arquivo SARIF.
 * @param scanId ID do scan relacionado.
 * @param projectId ID do projeto relacionado.
 */
export async function insertVulnerabilitiesFromFile(
  filePath: string,
  scanId: string,
  projectId: string,
): Promise<void> {
  try {
    // Lê o arquivo SARIF
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const sarif: Sarif = JSON.parse(fileContent);

    // Processa os resultados
    const vulnerabilities: NewVulnerability[] = sarif.runs.flatMap(run =>
      run.results.map(result => ({
        scanId,
        projectId: projectId,
        ruleId: result.ruleId,
        severity: result.level,
        description: result.message.text,
        filePath:
          result.locations[0]?.physicalLocation.artifactLocation.uri || "",
        lineNumber: result.locations[0]?.physicalLocation.region.startLine || 0,
        fingerprint: result.fingerprints?.["1"] || null,
        priorityScore: result.properties?.priorityScore || null,
        codeFlow: result.codeFlows || null,
      })),
    );

    if (vulnerabilities.length === 0) {
      console.log(`Nenhuma vulnerabilidade encontrada no scan ${scanId}.`);
      return;
    }
    // Insere no banco de dados
    await drizzle.insert(vulnerabilitiesTable).values(vulnerabilities);
    console.log(
      `Inserção de vulnerabilidades concluída para o scan ${scanId}.`,
    );
  } catch (error) {
    console.error("Erro ao inserir vulnerabilidades:", error);
    throw error;
  }
}
