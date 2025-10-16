import { VulnerabilitySeverity } from "~/types/enums/vulnerabilities.enums";

export interface GetVulnerabilitiesResponse {
  id: string;
  ruleId: string;
  description: string;
  createdAt: Date;
  severity: VulnerabilitySeverity;
  isRecurrent: boolean;
  foundInScans: number;
}
