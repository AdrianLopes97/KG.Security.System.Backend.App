import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Clona ou atualiza um repositório Git em uma pasta temporária.
 * @param repoUrl URL do repositório Git.
 * @param projectId ID do projeto para identificar a pasta temporária.
 * @returns Caminho da pasta onde o repositório foi clonado ou atualizado.
 */
export async function cloneOrUpdateRepo(
  repoUrl: string,
  projectId: string,
): Promise<string> {
  try {
    // Define o diretório temporário para o repositório
    const tempDir = path.join("temp", projectId);

    if (fs.existsSync(tempDir)) {
      console.log(
        `[${projectId}] Diretório já existe. Atualizando repositório...`,
      );
      // Executa git pull se o repositório já foi clonado
      await execAsync(`git pull`, { cwd: tempDir });
      console.log(`[${projectId}] Repositório atualizado com sucesso.`);
    } else {
      console.log(
        `[${projectId}] Diretório não encontrado. Clonando repositório...`,
      );
      // Cria o diretório temporário e clona o repositório
      fs.mkdirSync(tempDir, { recursive: true });
      await execAsync(`git clone ${repoUrl} .`, { cwd: tempDir });
      console.log(`[${projectId}] Repositório clonado com sucesso.`);
    }

    return tempDir;
  } catch (error: any) {
    console.error(
      `[${projectId}] Erro ao clonar ou atualizar o repositório:`,
      error,
    );
    throw new Error(
      `Falha ao processar o repositório ${repoUrl}. ${error.message}`,
    );
  }
}
