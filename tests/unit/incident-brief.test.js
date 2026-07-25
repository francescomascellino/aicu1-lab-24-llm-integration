import assert from "node:assert/strict";
import test from "node:test";

import { createIncidentBriefService } from "../../server/ai/incident-brief-service.js";
import { createIncidentReplayAdapter } from "../../server/ai/incident-replay-adapter.js";

const tickets = [
  {
    id: "TCK-1",
    title: "Errore ricerca",
    description: "La ricerca fallisce al primo tentativo.",
    priority: "alta",
    sourceChannel: "email",
    urgencyLabel: "intervento rapido"
  },
  {
    id: "TCK-2",
    title: "Filtro perso",
    description: "Il filtro scompare dopo il refresh.",
    priority: "normale",
    sourceChannel: "chat",
    urgencyLabel: "monitorare"
  }
];

function createService(scenario = "success") {
  return createIncidentBriefService({
    adapter: createIncidentReplayAdapter({ scenario }),
    loadTicketsByIds: (ids) => tickets.filter((ticket) => ids.includes(ticket.id))
  });
}

test("creates a validated proposal from two explicit ticket snapshots", async () => {
  const result = await createService()(["TCK-1", "TCK-2"]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.affectedTicketIds, ["TCK-1", "TCK-2"]);
  assert.deepEqual(
    result.data.evidence.map((item) => item.ticketId),
    ["TCK-1", "TCK-2"]
  );
});

test("rejects fewer than two or more than four selected tickets", async () => {
  assert.equal((await createService()(["TCK-1"])).reason, "invalid_input");
  assert.equal(
    (await createService()(["1", "2", "3", "4", "5"])).reason,
    "invalid_input"
  );
});

for (const [scenario, reason] of [
  ["timeout", "timeout"],
  ["refusal", "refusal"],
  ["invalid_output", "invalid_output"]
]) {
  test(`maps ${scenario} to ${reason}`, async () => {
    const result = await createService(scenario)(["TCK-1", "TCK-2"]);

    assert.equal(result.ok, false);
    assert.equal(result.reason, reason);
  });
}
