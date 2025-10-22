/*
 * Tipagens para deserializar o JSON de relatório do OWASP ZAP
 * Exemplo de uso:
 *   import type { ZapReport } from "~/models/dast-results.model";
 *   const data: ZapReport = JSON.parse(jsonString);
 */

export type RiskCode = "0" | "1" | "2" | "3"; // 0: Info, 1: Low, 2: Medium, 3: High
export type ConfidenceCode = "0" | "1" | "2" | "3" | "4"; // 0: FP, 1: Low, 2: Medium, 3: High, 4: Confirmed

export interface ZapReport {
  "@programName"?: string;
  "@version"?: string;
  "@generated"?: string; // ex.: "Wed, 22 Oct 2025 16:43:39"
  created?: string; // ISO-8601
  site?: ZapSite[];
  sequences?: unknown[];
}

export interface ZapSite {
  "@name"?: string; // URL base do alvo
  "@host"?: string;
  "@port"?: string; // número como string
  "@ssl"?: "true" | "false";
  alerts?: ZapAlert[];
}

export interface ZapAlert {
  pluginid?: string;
  alertRef?: string;
  alert?: string;
  name?: string;
  riskcode?: RiskCode;
  confidence?: ConfidenceCode;
  riskdesc?: string; // ex.: "Medium (High)"
  desc?: string; // HTML
  instances?: ZapInstance[];
  count?: string; // total de instances
  solution?: string; // HTML
  otherinfo?: string; // HTML
  reference?: string; // HTML
  cweid?: string;
  wascid?: string;
  sourceid?: string;
}

export interface ZapInstance {
  id?: string;
  uri?: string;
  method?: string;
  param?: string;
  attack?: string;
  evidence?: string;
  otherinfo?: string;
}

// Utilitário opcional: mapeia códigos numéricos para rótulos legíveis
export const RiskLabel: Record<
  RiskCode,
  "Informational" | "Low" | "Medium" | "High"
> = {
  "0": "Informational",
  "1": "Low",
  "2": "Medium",
  "3": "High",
};

export const ConfidenceLabel: Record<
  ConfidenceCode,
  "False Positive" | "Low" | "Medium" | "High" | "Confirmed"
> = {
  "0": "False Positive",
  "1": "Low",
  "2": "Medium",
  "3": "High",
  "4": "Confirmed",
};
