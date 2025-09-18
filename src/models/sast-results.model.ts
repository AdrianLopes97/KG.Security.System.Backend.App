import { VulnerabilitySeverity } from "~/types/enums/vulnerabilities.enums";

export class Sarif {
  $schema: string;
  version: string;
  runs: Run[];
}

export class Run {
  results: Result[];
}

export class Result {
  ruleId: string;
  ruleIndex: number;
  level: VulnerabilitySeverity;
  message: { text: string };
  locations: Location[];
  fingerprints: Record<string, string>;
  codeFlows?: CodeFlow[];
  properties?: Properties;
}

export class Location {
  physicalLocation: PhysicalLocation;
}

export class PhysicalLocation {
  artifactLocation: { uri: string };
  region: { startLine: number };
}

export class CodeFlow {
  threadFlows: ThreadFlow[];
}

export class ThreadFlow {
  locations: ThreadFlowLocation[];
}

export class ThreadFlowLocation {
  location: Location;
}

export class Properties {
  priorityScore?: number;
}
