const multipler = 1000;
const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

export function formatBytes(
  bytes: number,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 },
): string {
  if (bytes === 0 || isNaN(bytes)) {
    return "0 B";
  }

  const formatter = Intl.NumberFormat("pt-BR", options);
  const index = Math.floor(Math.log(bytes) / Math.log(multipler));

  return `${formatter.format(bytes / Math.pow(multipler, index))} ${
    sizes[index]
  }`;
}
