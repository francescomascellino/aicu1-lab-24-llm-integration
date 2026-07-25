# Piano — Messaggi di errore leggibili (L24.2.5)

## Problema

Quando il provider restituisce un errore (es. scenario `invalid_output`), il frontend mostra `result.reason` crudo: `"invalid_output"`, `"timeout"`, `"refusal"`. L'utente vede il codice tecnico, non un messaggio comprensibile.

## File da modificare

**`src/incident.js`** — aggiungere un dizionario di mapping e usarlo in tutti i `setStatus` che mostrano `result.reason`.

## Mapping proposto

```js
const REASON_LABELS = {
  timeout: "Timeout del provider",
  refusal: "Il provider ha rifiutato la richiesta",
  invalid_output: "Output non valido dal provider",
  invalid_input: "Input non valido"
};
```

## Punti di modifica in `incident.js`

Tre occorrenze di `result.reason` da sostituire con `REASON_LABELS[result.reason] || result.reason`:

1. `generateAndRender()` — `setStatus(result.reason || ...)`
2. `handlePreviewAction()` regenerate — `setStatus(result.reason || ...)`

## Codice modificato

Aggiungere all'inizio del file (dopo gli import):

```js
const REASON_LABELS = {
  timeout: "Timeout del provider",
  refusal: "Il provider ha rifiutato la richiesta",
  invalid_output: "Output non valido dal provider",
  invalid_input: "Input non valido"
};
```

Nei `setStatus` con `result.reason`:

```js
// Prima
setStatus(result.reason || "Errore nella generazione.", "error");

// Dopo
setStatus(REASON_LABELS[result.reason] || result.reason || "Errore nella generazione.", "error");
```

## 5 punti operativi

| # | Decisione | Verifica |
|---|---|---|
| 1 | Aggiungere `REASON_LABELS` come costante di modulo dopo gli import | mappa ogni codice a messaggio + codice |
| 2 | Mantenere il codice tra parentesi nel messaggio (`(timeout)`) | E2E test `toContainText("invalid_output")` passa ancora |
| 3 | Applicare a `setStatus(result.reason, ...)` in `generateAndRender()` | scenario `invalid_output` mostra messaggio leggibile |
| 4 | Applicare a `setStatus(result.reason, ...)` in `handlePreviewAction()` (regenerate) | rigenera con errore mostra messaggio leggibile |
| 5 | Usare fallback `REASON_LABELS[r] \|\| r \|\| default` | codici sconosciuti mostrati raw, mai undefined |

## Cosa non tocchero`

`incident-api.js`, `incident-view.js`, `incident.html`, `server/`, `tests/`. La modifica e` confinata a `incident.js`.

## Rischio e autonomia

| Fattore | Valutazione |
|---|---|
| Chiarezza task | Media — mapping intuitivo ma non specificato esplicitamente nei requisiti |
| Blast radius | 1 file, 3 righe di mapping + 2 sostituzioni |
| Reversibilita` | `git checkout src/incident.js` |
| Rischio test | Basso — i messaggi includono il codice originale, `toContainText` matcha |

## Verifica

```bash
pnpm verify:l24
```

L'E2E test `invalid_output` usa `toContainText("invalid_output")` — il nuovo messaggio `"Output non valido dal provider (invalid_output)"` contiene la sottostringa e passa.

## Permesso massimo

Aggiungere `REASON_LABELS` + modificare 2-3 `setStatus()` che usano `result.reason` in `src/incident.js`.

## Strategia prompt

**Zero-shot.** Mapping 1:1, nessuna logica condizionale.
