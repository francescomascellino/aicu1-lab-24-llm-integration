export const INCIDENT_RISK_FLAGS = [
  "availability",
  "customer_impact",
  "data_integrity",
  "security",
  "unknown"
];

export function validateIncidentBrief(value, allowedTicketIds) {
  if (!isRecord(value)) {
    return null;
  }

  const allowedIds = new Set(allowedTicketIds);
  const evidence = validateEvidence(value.evidence, allowedIds);
  const missingInformation = validateStringArray(value.missingInformation);
  const riskFlags = validateRiskFlags(value.riskFlags);

  if (
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.summary) ||
    !isNonEmptyString(value.suggestedNextAction) ||
    !evidence ||
    !missingInformation ||
    !riskFlags
  ) {
    return null;
  }

  return {
    title: value.title.trim(),
    summary: value.summary.trim(),
    evidence,
    missingInformation,
    suggestedNextAction: value.suggestedNextAction.trim(),
    riskFlags
  };
}

export function validateIncidentRevision(value) {
  if (!isRecord(value)) {
    return null;
  }

  const missingInformation = validateStringArray(value.missingInformation);
  const riskFlags = validateRiskFlags(value.riskFlags);

  if (
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.summary) ||
    !isNonEmptyString(value.suggestedNextAction) ||
    !missingInformation ||
    !riskFlags
  ) {
    return null;
  }

  return {
    title: value.title.trim(),
    summary: value.summary.trim(),
    missingInformation,
    suggestedNextAction: value.suggestedNextAction.trim(),
    riskFlags
  };
}

function validateEvidence(value, allowedIds) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const evidence = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.ticketId) ||
      !isNonEmptyString(item.observation) ||
      !allowedIds.has(item.ticketId)
    ) {
      return null;
    }

    evidence.push({
      ticketId: item.ticketId,
      observation: item.observation.trim()
    });
  }

  return evidence;
}

function validateStringArray(value) {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    return null;
  }

  return value.map((item) => item.trim());
}

function validateRiskFlags(value) {
  if (
    !Array.isArray(value) ||
    !value.every((flag) => INCIDENT_RISK_FLAGS.includes(flag))
  ) {
    return null;
  }

  return [...new Set(value)];
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

