import {
  discardIncidentPreview,
  generateIncidentPreview,
  loadIncidentDrafts,
  loadTickets,
  saveIncidentDraft
} from "./incident-api.js";
import {
  clearPreview,
  elements,
  enforceSelectionLimit,
  getSelectedTicketIds,
  readRevision,
  renderPreview,
  renderSavedDrafts,
  renderTickets,
  setBusy,
  setStatus
} from "./incident-view.js";

let currentPreview = null;

elements.ticketList.addEventListener("change", enforceSelectionLimit);
elements.generateButton.addEventListener("click", () => generateAndRender());
elements.previewForm.addEventListener("click", handlePreviewAction);

await initialize();

async function initialize() {
  try {
    const [tickets, drafts] = await Promise.all([
      loadTickets(),
      loadIncidentDrafts()
    ]);
    renderTickets(tickets);
    renderSavedDrafts(drafts);
    setStatus("Seleziona da due a quattro ticket.");
  } catch {
    setStatus("Impossibile inizializzare il lab.", "error");
  }
}

async function generateAndRender() {
  const ticketIds = getSelectedTicketIds();

  if (ticketIds.length < 2 || ticketIds.length > 4) {
    setStatus("Seleziona da due a quattro ticket.", "error");
    return;
  }

  const scenario = elements.scenario.value;
  setBusy(true);
  setStatus("Generazione in corso...", "info");

  try {
    const result = await generateIncidentPreview({ ticketIds, scenario });

    if (result.ok) {
      currentPreview = result.preview;
      renderPreview(result.preview);
      setStatus("Anteprima generata. Controlla e salva quando pronto.", "info");
    } else {
      currentPreview = null;
      clearPreview();
      setStatus(result.reason || "Errore nella generazione.", "error");
    }
  } catch {
    currentPreview = null;
    clearPreview();
    setStatus("Errore di connessione al server.", "error");
  } finally {
    setBusy(false);
  }
}

async function handlePreviewAction(event) {
  const action = event.target.closest("button[data-action]")?.dataset.action;

  if (!action || !currentPreview) {
    return;
  }

  if (action === "regenerate" || action === "discard") {
    // TODO L24.2: regenerate or discard without persisting the proposal.
    void discardIncidentPreview;
    void clearPreview;
    return;
  }

  if (action === "save") {
    // TODO L24.3: save the reviewed fields, then reload the saved drafts.
    void saveIncidentDraft;
    void readRevision;
    void loadIncidentDrafts;
  }
}
