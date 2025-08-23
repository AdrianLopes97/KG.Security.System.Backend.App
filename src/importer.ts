/* eslint-disable @typescript-eslint/no-var-requires */

import type { Type } from "@nestjs/common";
import { isObject } from "class-validator";
import { globSync } from "glob";

interface ImporterParams {
  path: string;
  suffix: string;
}

export function importer(params: ImporterParams): Type[] {
  const normalizedPath = params.path.replace(/\\\\/g, "/").replace(/\\/g, "/");

  const filePaths = globSync(
    `${normalizedPath}/**/*.${params.suffix.toLowerCase()}.{js,ts}`,
  );

  const classes: Type[] = [];

  filePaths.forEach(filePath => {
    const Module = require(filePath.replace(/^dist(\\|\/)src/, "./"));

    Object.entries(Module).map(([key, value]) => {
      if (
        key.endsWith(params.suffix) &&
        isObject(value) &&
        "prototype" in value
      ) {
        classes.push(value as Type);
      }
    });
  });

  return classes;
}
