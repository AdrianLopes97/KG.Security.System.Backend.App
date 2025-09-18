export function getCallerInfo(limit = 5, ignoreNodeModules = true): string {
  try {
    const timestamp = new Date().toISOString();
    const error = new Error();
    const lines = error.stack?.split("\n").slice(2) ?? [];

    const stackLines: string[] = [];
    let count = 0;

    for (const rawLine of lines) {
      if (count >= limit) break;

      const line = rawLine.trim();
      if (ignoreNodeModules && line.includes("node_modules")) continue;

      const matchFunc = line.match(/at (.*?) \((.*):(\d+):(\d+)\)/);
      const matchAnon = line.match(/at (.*):(\d+):(\d+)/);

      const formatLine = (
        file: string,
        func: string,
        lineNum: string,
        colNum: string,
      ) =>
        `${count + 1}>>>>> ${timestamp} | ${file} | (FUNCTION) ${func} | (L.,C) ${lineNum}:${colNum}`;

      if (matchFunc) {
        const [, func, file, lineNum, colNum] = matchFunc;
        stackLines.push(formatLine(file, func, lineNum, colNum));
        count++;
      } else if (matchAnon) {
        const [, file, lineNum, colNum] = matchAnon;
        stackLines.push(formatLine(file, "anonymous", lineNum, colNum));
        count++;
      }
    }

    return stackLines.length > 0 ? stackLines.join("\n") : "unknown";
  } catch {
    return "unknown";
  }
}
