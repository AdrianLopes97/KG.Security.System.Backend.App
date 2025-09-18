# Guia de Campos Relevantes do SARIF (Snyk)

Este documento resume os principais campos do arquivo `sast-results.json` (SARIF) gerado pelo Snyk, úteis para:

- Exibir resumos de vulnerabilidades
- Fazer comparativos entre scans
- Salvar informações relevantes no banco de dados

---

## 1. Campos para Resumo de Vulnerabilidades

Para cada vulnerabilidade (`runs[].results[]`):

- **ruleId**: tipo/categoria da vulnerabilidade (ex: "javascript/XSS")
- **level**: severidade (ex: "error", "warning", "note")
- **message.text**: descrição resumida do problema
- **locations[].physicalLocation.artifactLocation.uri**: arquivo afetado
- **locations[].physicalLocation.region.startLine**: linha do arquivo
- **fingerprints**: identificadores únicos para rastreamento/comparação
- **properties.priorityScore**: score de prioridade (quando disponível)
- **codeFlows**: fluxo do código afetado (opcional para detalhes)

---

## 2. Campos para Comparativos entre Scans

- **ruleId** + **fingerprints**: para identificar se a vulnerabilidade é nova, resolvida ou persistente
- **locations**: para saber se mudou de lugar
- **level**: para saber se a severidade mudou
- **Data/hora do scan**: (não vem no SARIF, mas é importante salvar no banco)

---

## 3. Modelo de Dados Sugerido para Banco

- id (gerado)
- scan_id (referência ao scan)
- rule_id (tipo/categoria)
- severity (level)
- description (message.text)
- file (locations[].physicalLocation.artifactLocation.uri)
- line (locations[].physicalLocation.region.startLine)
- fingerprint (um dos valores de fingerprints)
- priority_score (properties.priorityScore)
- code_flow (opcional, para detalhes)
- status (nova, resolvida, existente — calculado na comparação)
- scan_date (data/hora do scan)

---
