## Relatório do JSON de Resultado do ZAP

Este documento descreve as principais propriedades do arquivo de resultado em JSON gerado pelo OWASP ZAP. Exemplo real no projeto: `zap-reports/report.json`.

### Estrutura de alto nível

- "@programName" (string): Nome do programa que gerou o relatório (ex.: "ZAP").
- "@version" (string): Versão do ZAP que gerou o relatório.
- "@generated" (string): Data/hora legível da geração.
- created (string ISO-8601): Timestamp de criação do relatório.
- site (array de objetos): Lista de sites/targets analisados. Normalmente contém 1 item.
- sequences (array): Sequências de navegação/execução (pode estar vazio).

### Estrutura de `site[]`

Cada item de `site` contém:

- "@name" (string): URL base do alvo (ex.: `http://testphp.vulnweb.com`).
- "@host" (string): Host do alvo.
- "@port" (string): Porta utilizada.
- "@ssl" (string): "true" ou "false" indicando se foi usado SSL/TLS.
- alerts (array): Lista de alertas/vulnerabilidades identificados para o site.

### Estrutura de `alerts[]`

Cada alerta possui as seguintes propriedades principais:

- pluginid (string): ID do plugin/regra do ZAP que detectou o problema.
- alertRef (string): Referência única do alerta (pode incluir sufixos como `-1`, `-2`).
- alert / name (string): Título do alerta.
- riskcode (string): Código numérico do risco.
- confidence (string): Nível de confiança da detecção.
- riskdesc (string): Descrição resumida do risco e confiança (ex.: `Medium (High)`).
- desc (string HTML): Descrição detalhada do problema.
- instances (array): Exemplos/ocorrências do problema.
- count (string): Quantidade total de ocorrências (tamanho de `instances`).
- solution (string HTML): Recomendações de correção.
- otherinfo (string HTML): Informações adicionais relevantes.
- reference (string HTML): Referências e links úteis.
- cweid (string): ID CWE (Common Weakness Enumeration) relacionado.
- wascid (string): ID WASC (Web Application Security Consortium) relacionado.
- sourceid (string): Fonte do alerta (usado internamente pelo ZAP).

#### Mapeamento de níveis (útil para priorização)

- riskcode:
  - 0: Informational (informativo)
  - 1: Low (baixo)
  - 2: Medium (médio)
  - 3: High (alto)
- confidence:
  - 0: False Positive (potencial falso positivo)
  - 1: Low
  - 2: Medium
  - 3: High
  - 4: Confirmed

### Estrutura de `instances[]`

Cada ocorrência de um alerta geralmente inclui:

- id (string): Identificador interno da ocorrência.
- uri (string): URL exata onde o problema foi observado.
- method (string): Método HTTP (GET, POST, etc.).
- param (string): Parâmetro afetado (quando aplicável).
- attack (string): Payload utilizado (quando aplicável).
- evidence (string): Evidência encontrada (trecho de resposta, cabeçalho, etc.).
- otherinfo (string): Observações adicionais do caso específico.

### Exemplos do relatório analisado

- Programa/Versão: `"@programName": "ZAP"`, `"@version": "2.16.1"`
- Site alvo: `"@name": "http://testphp.vulnweb.com"`
- Exemplo de alerta (médio): "Content Security Policy (CSP) Header Not Set" com `riskcode = "2"` e `confidence = "3"`.
- Exemplo de alerta (informativo): "Modern Web Application" com `riskcode = "0"`.

### Glossário

- CWE: Catálogo de fraquezas comuns. https://cwe.mitre.org
- WASC: Classificação de ameaças de segurança web. http://projects.webappsec.org

### Observações práticas

- Muitos campos de texto vêm em HTML (desc/solution/reference). A aplicação cliente pode optar por renderizá-los ou sanitizá-los.
- Os códigos numéricos (`riskcode`, `confidence`) devem ser mapeados para níveis amigáveis para priorização de correções.
- O campo `"@ssl"` vem como string ("true"/"false"); converta explicitamente para booleano se necessário.
- Nem todos os alertas possuem os mesmos campos sempre; trate chaves ausentes como opcionais.
