import { ScanType } from "~/types/enums/scan-type.enums";
import { VulnerabilitySeverity } from "~/types/enums/vulnerabilities.enums";

export interface GetVulnerabilitiesResponse {
  id: string;
  ruleId: string;
  scanType: ScanType;
  description: string;
  createdAt: Date;
  severity: VulnerabilitySeverity;
  isRecurrent: boolean;
  foundInScans: number;
}
