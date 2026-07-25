async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: options.body
      ? { "content-type": "application/json", ...options.headers }
      : options.headers
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.reason || body.code || "request_failed");
  }

  return body;
}

export async function loadTickets() {
  const body = await requestJson("/api/tickets");
  return body.tickets;
}

export async function generateIncidentPreview({ ticketIds, scenario }) {
  return requestJson("/api/ai/incident-previews", {
    method: "POST",
    body: JSON.stringify({ ticketIds, scenario })
  });
}

export async function discardIncidentPreview(previewId) {
  return requestJson(
    `/api/ai/incident-previews/${encodeURIComponent(previewId)}`,
    { method: "DELETE" }
  );
}

export async function saveIncidentDraft({ previewId, draft }) {
  return requestJson("/api/ai/incident-drafts", {
    method: "POST",
    body: JSON.stringify({ previewId, draft })
  });
}

export async function loadIncidentDrafts() {
  const body = await requestJson("/api/ai/incident-drafts");
  return body.drafts;
}

