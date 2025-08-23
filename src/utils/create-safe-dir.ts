import * as fs from "fs";
import * as path from "path";

export function createSafeDir(dir: string): string {
  try {
    const directory = path.dirname(dir);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      return `directory created: ${directory}`;
    }

    return "directory already exists";
  } catch (error) {
    throw error;
  }
}
