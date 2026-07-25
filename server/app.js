import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createIncidentBriefService } from "./ai/incident-brief-service.js";
import { createIncidentReplayAdapter } from "./ai/incident-replay-adapter.js";
import { validateIncidentRevision } from "./ai/incident-brief-validator.js";
import { createMistralAdapter } from "./ai/mistral-adapter.js";
import { createOpenCodeAdapter } from "./ai/opencode-adapter.js";
import { computeUrgencyLabel } from "./ticket-rules.js";
import { normalizeTicketInput, validateTicketInput } from "./validation.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultRootDir = resolve(__dirname, "..");
const defaultDataDir = join(defaultRootDir, "data");

export function createTicketApplication({
  databasePath = join(defaultDataDir, "tickets.sqlite"),
  rootDir = defaultRootDir,
  seed = true,
  now = () => new Date(),
  idFactory = () => `TCK-${Math.floor(10000 + Math.random() * 90000)}`,
  requestIdFactory = () => `req-${Math.floor(100000 + Math.random() * 900000)}`,
  logger = console,
  incidentAdapterFactory = defaultIncidentAdapterFactory,
  previewIdFactory = () =>
    `preview-${Math.floor(100000 + Math.random() * 900000)}`,
  draftIdFactory = () =>
    `INC-${Math.floor(10000 + Math.random() * 90000)}`
} = {}) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);

  database.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      customer TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL,
      source_channel TEXT NOT NULL,
      urgency_label TEXT,
      status TEXT NOT NULL DEFAULT 'aperto',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incident_drafts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      affected_ticket_ids TEXT NOT NULL,
      evidence TEXT NOT NULL,
      missing_information TEXT NOT NULL,
      suggested_next_action TEXT NOT NULL,
      risk_flags TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL
    );
  `);

  if (seed) {
    seedTickets(database, now);
  }

  backfillUrgencyLabels(database);

  const incidentPreviews = new Map();

  function listTickets() {
    return database
      .prepare(
        `
          SELECT
            id,
            title,
            customer,
            description,
            priority,
            source_channel AS sourceChannel,
            urgency_label AS urgencyLabel,
            status,
            created_at AS createdAt
          FROM tickets
          ORDER BY created_at DESC
        `
      )
      .all();
  }

  function createTicket(input) {
    const id = idFactory();
    const createdAt = now().toISOString();
    const urgencyLabel = computeUrgencyLabel(
      input.priority,
      input.sourceChannel
    );

    database.prepare(
      `
        INSERT INTO tickets (
          id,
          title,
          customer,
          description,
          priority,
          source_channel,
          urgency_label,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      id,
      input.title,
      input.customer,
      input.description,
      input.priority,
      input.sourceChannel,
      urgencyLabel,
      "aperto",
      createdAt
    );

    return database
      .prepare(
        `
          SELECT
            id,
            title,
            customer,
            description,
            priority,
            source_channel AS sourceChannel,
            urgency_label AS urgencyLabel,
            status,
            created_at AS createdAt
          FROM tickets
          WHERE id = ?
        `
      )
      .get(id);
  }

  function loadTicketsByIds(ticketIds) {
    const placeholders = ticketIds.map(() => "?").join(", ");
    return database
      .prepare(
        `
          SELECT
            id,
            title,
            customer,
            description,
            priority,
            source_channel AS sourceChannel,
            urgency_label AS urgencyLabel,
            status,
            created_at AS createdAt
          FROM tickets
          WHERE id IN (${placeholders})
          ORDER BY id
        `
      )
      .all(...ticketIds);
  }

  function listIncidentDrafts() {
    return database
      .prepare(
        `
          SELECT
            id,
            title,
            summary,
            affected_ticket_ids AS affectedTicketIds,
            evidence,
            missing_information AS missingInformation,
            suggested_next_action AS suggestedNextAction,
            risk_flags AS riskFlags,
            provider,
            model,
            status,
            created_at AS createdAt
          FROM incident_drafts
          ORDER BY created_at DESC
        `
      )
      .all()
      .map(parseIncidentDraftRow);
  }

  function saveIncidentDraft(preview, revision) {
    const id = draftIdFactory();
    const createdAt = now().toISOString();
    const draft = {
      id,
      ...revision,
      affectedTicketIds: preview.data.affectedTicketIds,
      evidence: preview.data.evidence,
      provider: preview.meta.provider,
      model: preview.meta.model,
      status: "draft",
      createdAt
    };

    database.prepare(
      `
        INSERT INTO incident_drafts (
          id,
          title,
          summary,
          affected_ticket_ids,
          evidence,
          missing_information,
          suggested_next_action,
          risk_flags,
          provider,
          model,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      draft.id,
      draft.title,
      draft.summary,
      JSON.stringify(draft.affectedTicketIds),
      JSON.stringify(draft.evidence),
      JSON.stringify(draft.missingInformation),
      draft.suggestedNextAction,
      JSON.stringify(draft.riskFlags),
      draft.provider,
      draft.model,
      draft.status,
      draft.createdAt
    );

    return draft;
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestId = requestIdFactory();
    let operation = "serve_static";

    try {
      if (request.method === "GET" && url.pathname === "/api/tickets") {
        operation = "list_tickets";
        sendJson(response, 200, { tickets: listTickets() });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/tickets") {
        operation = "create_ticket";

        if (!isJsonContentType(request.headers["content-type"])) {
          sendJson(response, 415, {
            code: "UNSUPPORTED_MEDIA_TYPE",
            message: "Invia il ticket come application/json."
          });
          return;
        }

        const body = await readJsonBody(request);
        const input = normalizeTicketInput(body);
        const fieldErrors = validateTicketInput(input);

        if (Object.keys(fieldErrors).length > 0) {
          sendJson(response, 400, {
            code: "VALIDATION_ERROR",
            message: "Controlla i campi del ticket.",
            fieldErrors
          });
          return;
        }

        sendJson(response, 201, { ticket: createTicket(input) });
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/ai/incident-previews"
      ) {
        operation = "generate_incident_preview";
        const body = await readRequiredJsonBody(request, response);

        if (!body) {
          return;
        }

        const adapter = incidentAdapterFactory({ scenario: body.scenario });
        const generateIncidentBrief = createIncidentBriefService({
          adapter,
          loadTicketsByIds
        });
        const result = await generateIncidentBrief(body.ticketIds);

        if (!result.ok) {
          sendJson(response, result.reason === "invalid_input" ? 400 : 200, result);
          return;
        }

        const previewId = previewIdFactory();
        incidentPreviews.set(previewId, {
          data: result.data,
          meta: result.meta
        });
        sendJson(response, 200, {
          ok: true,
          preview: {
            id: previewId,
            draft: result.data,
            meta: result.meta
          }
        });
        return;
      }

      if (
        request.method === "DELETE" &&
        url.pathname.startsWith("/api/ai/incident-previews/")
      ) {
        operation = "discard_incident_preview";
        const previewId = decodeURIComponent(
          url.pathname.slice("/api/ai/incident-previews/".length)
        );
        const discarded = incidentPreviews.delete(previewId);
        sendJson(response, discarded ? 200 : 404, {
          ok: discarded,
          reason: discarded ? undefined : "preview_not_found"
        });
        return;
      }

      if (
        request.method === "GET" &&
        url.pathname === "/api/ai/incident-drafts"
      ) {
        operation = "list_incident_drafts";
        sendJson(response, 200, { drafts: listIncidentDrafts() });
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/ai/incident-drafts"
      ) {
        operation = "save_incident_draft";
        const body = await readRequiredJsonBody(request, response);

        if (!body) {
          return;
        }

        const preview = incidentPreviews.get(body.previewId);
        const revision = validateIncidentRevision(body.draft);

        if (!preview || !revision) {
          sendJson(response, 400, {
            ok: false,
            reason: preview ? "invalid_draft" : "preview_not_found"
          });
          return;
        }

        const draft = saveIncidentDraft(preview, revision);
        incidentPreviews.delete(body.previewId);
        sendJson(response, 201, { ok: true, draft });
        return;
      }

      serveStatic(request, response, rootDir);
    } catch (error) {
      if (error instanceof InvalidJsonError) {
        sendJson(response, 400, {
          code: "INVALID_JSON",
          message: "Il body non contiene JSON valido."
        });
        return;
      }

      logger.error({
        operation,
        errorCode: operation === "create_ticket" ? "DB_WRITE_FAILED" : "UNEXPECTED_ERROR",
        requestId
      });
      sendJson(response, 500, {
        code: "INTERNAL_ERROR",
        message: "Errore interno del server."
      });
    }
  });

  return {
    database,
    server,
    async close() {
      if (server.listening) {
        await new Promise((resolveClose, rejectClose) => {
          server.close((error) => {
            if (error) {
              rejectClose(error);
              return;
            }

            resolveClose();
          });
        });
      }

      database.close();
    }
  };
}

async function readRequiredJsonBody(request, response) {
  if (!isJsonContentType(request.headers["content-type"])) {
    sendJson(response, 415, {
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Invia la richiesta come application/json."
    });
    return null;
  }

  return readJsonBody(request);
}

function seedTickets(database, now) {
  const count = database.prepare("SELECT COUNT(*) AS count FROM tickets").get().count;

  if (count > 0) {
    return;
  }

  const insert = database.prepare(`
    INSERT INTO tickets (
      id,
      title,
      customer,
      description,
      priority,
      source_channel,
      urgency_label,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const createdAt = now().toISOString();

  for (const ticket of [
    {
      id: "TCK-10482",
      title: "Impossibile accedere al portale clienti",
      customer: "Alfa S.r.l.",
      description: "Errore login su account amministrativo.",
      priority: "alta",
      sourceChannel: "email",
      status: "aperto"
    },
    {
      id: "TCK-10481",
      title: "Errore 500 durante il caricamento",
      customer: "Beta Consulting",
      description: "Errore intermittente nella pagina fatture.",
      priority: "normale",
      sourceChannel: "chat",
      status: "in lavorazione"
    },
    {
      id: "TCK-10480",
      title: "Ricerca ticket intermittente",
      customer: "Gamma S.p.A.",
      description: "La ricerca per ID mostra il ticket soltanto al secondo tentativo.",
      priority: "alta",
      sourceChannel: "telefono",
      status: "aperto"
    },
    {
      id: "TCK-10479",
      title: "Filtro cliente perso dopo refresh",
      customer: "Delta S.r.l.",
      description: "Il filtro selezionato scompare ricaricando la dashboard.",
      priority: "normale",
      sourceChannel: "email",
      status: "aperto"
    },
    {
      id: "TCK-10478",
      title: "Badge notifiche non aggiornato",
      customer: "Epsilon S.r.l.",
      description: "Il badge resta invariato dopo la lettura delle notifiche.",
      priority: "bassa",
      sourceChannel: "chat",
      status: "aperto"
    }
  ]) {
    insert.run(
      ticket.id,
      ticket.title,
      ticket.customer,
      ticket.description,
      ticket.priority,
      ticket.sourceChannel,
      computeUrgencyLabel(ticket.priority, ticket.sourceChannel),
      ticket.status,
      createdAt
    );
  }
}

function defaultIncidentAdapterFactory({ scenario } = {}) {
  const provider = process.env.AI_PROVIDER || "replay";

  if (provider === "mistral") {
    return createMistralAdapter();
  }

  if (provider === "opencode") {
    return createOpenCodeAdapter();
  }

  return createIncidentReplayAdapter({ scenario: scenario || "success" });
}

function parseIncidentDraftRow(row) {
  return {
    ...row,
    affectedTicketIds: JSON.parse(row.affectedTicketIds),
    evidence: JSON.parse(row.evidence),
    missingInformation: JSON.parse(row.missingInformation),
    riskFlags: JSON.parse(row.riskFlags)
  };
}

function backfillUrgencyLabels(database) {
  const tickets = database
    .prepare(
      `
        SELECT id, priority, source_channel AS sourceChannel
        FROM tickets
        WHERE urgency_label IS NULL
      `
    )
    .all();
  const update = database.prepare(
    "UPDATE tickets SET urgency_label = ? WHERE id = ?"
  );

  for (const ticket of tickets) {
    const urgencyLabel = computeUrgencyLabel(
      ticket.priority,
      ticket.sourceChannel
    );

    if (urgencyLabel) {
      update.run(urgencyLabel, ticket.id);
    }
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new InvalidJsonError();
  }
}

function isJsonContentType(contentType) {
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

class InvalidJsonError extends Error {
  constructor() {
    super("Invalid JSON body");
    this.name = "InvalidJsonError";
  }
}

function serveStatic(request, response, rootDir) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = resolve(rootDir, `.${requestedPath}`);
  const relativePath = relative(rootDir, filePath);

  if (
    relativePath.startsWith("..") ||
    isAbsolute(relativePath) ||
    !existsSync(filePath)
  ) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  };

  response.writeHead(200, {
    "content-type": contentTypes[extname(filePath)] || "application/octet-stream"
  });
  response.end(readFileSync(filePath));
}
