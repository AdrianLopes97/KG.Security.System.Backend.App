import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { env } from "~/env";

export async function runSastScan(
  repoPath: string,
  projectId: string,
  datetime: string,
): Promise<string> {
  const execAsync = promisify(exec);

  try {
    // Garante que o diretório de saída exista
    const outputDir = path.join("sast-output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Caminho do arquivo de saída
    const outputPath = path.join(outputDir, `${projectId}-${datetime}.json`);

    // Autentica com o Snyk CLI
    const authCommand = `snyk auth ${env.SNYK_TOKEN}`;
    console.log(`[${projectId} - ${datetime}] Autenticando com o Snyk...`);
    await execAsync(authCommand);
    console.log(
      `[${projectId} - ${datetime}] Autenticação com Snyk bem-sucedida.`,
    );

    // Executa a varredura SAST
    const command = `snyk code test --json`;
    console.log(
      `[${projectId} - ${datetime}] Executando varredura SAST em: ${repoPath}`,
    );

    const { stdout, stderr } = await execAsync(command, {
      cwd: repoPath,
    });

    if (stderr && !stdout) {
      // snyk code test pode retornar sucesso no stderr
      console.error(`[${projectId} - ${datetime}] Snyk CLI stderr: ${stderr}`);
    }

    const output = stdout || stderr;
    fs.writeFileSync(outputPath, output);
    console.log(
      `[${projectId} - ${datetime}] Resultado da varredura salvo em: ${outputPath}`,
    );

    console.log(`[${projectId} - ${datetime}] Varredura Snyk SAST concluída.`);
    return outputPath;
  } catch (error: any) {
    // O Snyk CLI retorna um código de saída quando encontra vulnerabilidades.
    // Isso não é um erro de execução, então tratamos como sucesso e retornamos o relatório.
    const output = error.stdout || error.stderr;
    if (output) {
      console.log(
        `[${projectId} - ${datetime}] Varredura Snyk SAST concluída. Vulnerabilidades encontradas.`,
      );
      const outputDir = path.join("sast-output");
      const outputPath = path.join(outputDir, `${projectId}-${datetime}.json`);
      fs.writeFileSync(outputPath, output);
      console.log(
        `[${projectId} - ${datetime}] Resultado da varredura salvo em: ${outputPath}`,
      );
      return outputPath;
    }

    console.error(
      `[${projectId} - ${datetime}] Erro ao executar a varredura Snyk SAST:`,
      error,
    );
    throw new Error(
      `[${projectId} - ${datetime}] Falha ao executar a varredura Snyk SAST. ${error.message}`,
    );
  }
}
