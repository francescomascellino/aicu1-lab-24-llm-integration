import assert from "node:assert/strict";
import test from "node:test";

import { buildTicket, postTicket, startTestApplication } from "../helpers/ticket-api.js";

test("generating a proposal does not persist an incident draft", async (t) => {
  const baseUrl = await startTestApplication(t, {
    previewIdFactory: () => "preview-test"
  });
  const ticketIds = await createTwoTickets(baseUrl);

  const generated = await postJson(`${baseUrl}/api/ai/incident-previews`, {
    ticketIds,
    scenario: "success"
  });
  const preview = await generated.json();
  const drafts = await fetch(`${baseUrl}/api/ai/incident-drafts`).then((response) =>
    response.json()
  );

  assert.equal(generated.status, 200);
  assert.equal(preview.ok, true);
  assert.equal(preview.preview.id, "preview-test");
  assert.deepEqual(drafts.drafts, []);
});

test("an explicit save persists only editable fields from the client", async (t) => {
  const baseUrl = await startTestApplication(t, {
    previewIdFactory: () => "preview-test",
    draftIdFactory: () => "INC-TEST"
  });
  const ticketIds = await createTwoTickets(baseUrl);
  const generated = await postJson(`${baseUrl}/api/ai/incident-previews`, {
    ticketIds,
    scenario: "success"
  }).then((response) => response.json());

  const response = await postJson(`${baseUrl}/api/ai/incident-drafts`, {
    previewId: generated.preview.id,
    affectedTicketIds: ["TCK-INVENTED"],
    evidence: [{ ticketId: "TCK-INVENTED", observation: "inventata" }],
    draft: {
      title: "Titolo rivisto dalla persona",
      summary: "Sintesi rivista prima del salvataggio.",
      missingInformation: ["Timestamp precisi"],
      suggestedNextAction: "Confrontare i log applicativi.",
      riskFlags: ["availability"]
    }
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.draft.id, "INC-TEST");
  assert.deepEqual(result.draft.affectedTicketIds, ticketIds);
  assert.notDeepEqual(result.draft.evidence, [
    { ticketId: "TCK-INVENTED", observation: "inventata" }
  ]);

  const saved = await fetch(`${baseUrl}/api/ai/incident-drafts`).then((item) =>
    item.json()
  );
  assert.equal(saved.drafts.length, 1);
  assert.equal(saved.drafts[0].title, "Titolo rivisto dalla persona");
});

test("a stopped provider path creates neither preview nor saved draft", async (t) => {
  const baseUrl = await startTestApplication(t);
  const ticketIds = await createTwoTickets(baseUrl);
  const response = await postJson(`${baseUrl}/api/ai/incident-previews`, {
    ticketIds,
    scenario: "invalid_output"
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid_output");
  assert.deepEqual(
    await fetch(`${baseUrl}/api/ai/incident-drafts`).then((item) => item.json()),
    { drafts: [] }
  );
});

async function createTwoTickets(baseUrl) {
  const responses = await Promise.all([
    postTicket(baseUrl, buildTicket({ title: "Ricerca non disponibile" })),
    postTicket(
      baseUrl,
      buildTicket({
        title: "Filtro perso",
        priority: "alta",
        sourceChannel: "chat"
      })
    )
  ]);

  return Promise.all(
    responses.map(async (response) => (await response.json()).ticket.id)
  );
}

function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}
