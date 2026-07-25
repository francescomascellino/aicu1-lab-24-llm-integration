const RISK_FLAGS = [
  "availability",
  "customer_impact",
  "data_integrity",
  "security",
  "unknown"
];

const RISK_FLAG_LABELS = {
  availability: "Disponibilita'",
  customer_impact: "Impatto clienti",
  data_integrity: "Integrita' dati",
  security: "Sicurezza",
  unknown: "Da verificare"
};

export const elements = {
  ticketList: document.querySelector("#ticket-list"),
  selectionCount: document.querySelector("#selection-count"),
  scenario: document.querySelector("#scenario"),
  generateButton: document.querySelector("#generate-button"),
  previewForm: document.querySelector("#preview-form"),
  emptyPreview: document.querySelector("#empty-preview"),
  previewState: document.querySelector("#preview-state"),
  providerName: document.querySelector("#provider-name"),
  affectedTicketIds: document.querySelector("#affected-ticket-ids"),
  evidenceList: document.querySelector("#evidence-list"),
  riskFlags: document.querySelector("#risk-flags"),
  savedDrafts: document.querySelector("#saved-drafts"),
  draftCount: document.querySelector("#draft-count"),
  appStatus: document.querySelector("#app-status")
};

export function renderTickets(tickets) {
  elements.ticketList.replaceChildren();

  for (const ticket of tickets) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const content = document.createElement("span");
    const title = document.createElement("strong");
    const description = document.createElement("small");
    const priority = document.createElement("em");

    label.className = "ticket-option";
    input.type = "checkbox";
    input.name = "ticket";
    input.value = ticket.id;
    title.textContent = `${ticket.id} · ${ticket.title}`;
    description.textContent = ticket.description;
    priority.textContent = ticket.priority;
    content.append(title, description);
    label.append(input, content, priority);
    elements.ticketList.append(label);
  }

  updateSelectionCount();
}

export function getSelectedTicketIds() {
  return [...elements.ticketList.querySelectorAll("input:checked")].map(
    (input) => input.value
  );
}

export function enforceSelectionLimit(event) {
  const selected = getSelectedTicketIds();

  if (selected.length > 4) {
    event.target.checked = false;
    setStatus("Puoi selezionare al massimo quattro ticket.", "error");
  }

  updateSelectionCount();
}

export function renderPreview(preview) {
  const { draft, meta } = preview;
  elements.emptyPreview.hidden = true;
  elements.previewForm.hidden = false;
  elements.previewForm.classList.remove("is-revealed");
  requestAnimationFrame(() => elements.previewForm.classList.add("is-revealed"));
  elements.previewState.textContent = "non salvata";
  elements.previewState.dataset.state = "preview";
  elements.providerName.textContent = `${meta.provider} · ${meta.model}`;

  elements.previewForm.elements.title.value = draft.title;
  elements.previewForm.elements.summary.value = draft.summary;
  elements.previewForm.elements.missingInformation.value =
    draft.missingInformation.join("\n");
  elements.previewForm.elements.suggestedNextAction.value =
    draft.suggestedNextAction;

  elements.riskFlags.replaceChildren(
    ...RISK_FLAGS.map((flag) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "riskFlags";
      input.value = flag;
      input.checked = draft.riskFlags.includes(flag);
      label.append(input, document.createTextNode(RISK_FLAG_LABELS[flag] || flag));
      return label;
    })
  );

  elements.affectedTicketIds.replaceChildren(
    ...draft.affectedTicketIds.map((id) => createTag(id))
  );
  elements.evidenceList.replaceChildren(
    ...draft.evidence.map((item) => {
      const row = document.createElement("li");
      const ticketId = document.createElement("strong");
      const observation = document.createElement("span");
      row.className = "evidence-item";
      ticketId.textContent = item.ticketId;
      observation.textContent = item.observation;
      row.append(ticketId, observation);
      return row;
    })
  );
}

export function readRevision() {
  const formData = new FormData(elements.previewForm);
  return {
    title: String(formData.get("title") || "").trim(),
    summary: String(formData.get("summary") || "").trim(),
    missingInformation: String(formData.get("missingInformation") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    suggestedNextAction: String(
      formData.get("suggestedNextAction") || ""
    ).trim(),
    riskFlags: formData.getAll("riskFlags").map(String)
  };
}

export function clearPreview() {
  elements.previewForm.reset();
  elements.previewForm.hidden = true;
  elements.previewForm.classList.remove("is-revealed");
  elements.emptyPreview.hidden = false;
  elements.previewState.textContent = "vuota";
  elements.previewState.dataset.state = "empty";
  elements.providerName.textContent = "non ancora chiamato";
}

export function renderSavedDrafts(drafts) {
  elements.draftCount.textContent = String(drafts.length);
  elements.savedDrafts.replaceChildren();

  if (drafts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "saved-empty";
    empty.textContent = "Nessuna bozza salvata.";
    elements.savedDrafts.append(empty);
    return;
  }

  for (const draft of drafts) {
    const article = document.createElement("article");
    article.className = "saved-draft";
    const id = document.createElement("strong");
    const title = document.createElement("span");
    const meta = document.createElement("small");
    id.textContent = draft.id;
    title.textContent = draft.title;
    meta.textContent = `${draft.provider} · ${draft.affectedTicketIds.join(", ")}`;
    article.append(id, title, meta);
    elements.savedDrafts.append(article);
  }
}

export function setBusy(busy) {
  elements.generateButton.disabled = busy;
  for (const button of elements.previewForm.querySelectorAll("button")) {
    button.disabled = busy;
  }
}

export function setStatus(message, type = "info") {
  elements.appStatus.textContent = message;
  elements.appStatus.dataset.type = type;
}

function updateSelectionCount() {
  elements.selectionCount.textContent = `${getSelectedTicketIds().length} / 4`;
}

function createTag(value) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = value;
  return tag;
}
