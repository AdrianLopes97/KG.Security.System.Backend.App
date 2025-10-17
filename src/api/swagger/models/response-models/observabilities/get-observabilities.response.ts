import { ObservabilityLevels } from "~/types/enums/observabilities-levels.enums";

export interface GetObservabilitiesResponse {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  level: ObservabilityLevels;
}
