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
  // TODO L24.1: validate the selection, request a preview and render it.
  void generateIncidentPreview;
  void getSelectedTicketIds;
  void renderPreview;
  void setBusy;
  setStatus("Collega il TODO L24.1 per generare l'anteprima.", "info");
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
