export const validPriorities = ["bassa", "normale", "alta"];
export const validSourceChannels = ["email", "telefono", "chat"];

export function normalizeTicketInput(body) {
  const source = isPlainObject(body) ? body : {};

  return {
    title: normalizeString(source.title),
    customer: normalizeString(source.customer),
    description: normalizeString(source.description),
    priority: normalizeString(source.priority),
    sourceChannel: normalizeString(source.sourceChannel)
  };
}

export function validateTicketInput(input) {
  const fieldErrors = {};

  if (typeof input.title !== "string" || input.title.length < 3) {
    fieldErrors.title = "Inserisci un titolo di almeno 3 caratteri.";
  }

  if (typeof input.customer !== "string" || input.customer.length < 2) {
    fieldErrors.customer = "Inserisci il nome del cliente.";
  }

  if (typeof input.description !== "string") {
    fieldErrors.description = "La descrizione deve essere testo.";
  }

  if (!validPriorities.includes(input.priority)) {
    fieldErrors.priority = "Priorita' non valida.";
  }

  if (!validSourceChannels.includes(input.sourceChannel)) {
    fieldErrors.sourceChannel = "Canale di richiesta non valido.";
  }

  return fieldErrors;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
