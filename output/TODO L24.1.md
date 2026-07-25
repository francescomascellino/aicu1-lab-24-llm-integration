# Piano — TODO L24.1

## Task

`Genera sintesi` deve:
- accettare una selezione da 2 a 4 ticket;
- inviare al server soltanto i loro ID;
- mostrare caricamento, successo oppure errore;
- mostrare il provider utilizzato;
- mostrare `Anteprima non salvata`;
- lasciare invariato il conteggio delle bozze.

## Matrice dei comportamenti

| Azione    | Anteprima          | Provider          | Database        |
|-----------|--------------------|-------------------|-----------------|
| Genera    | viene creata       | viene chiamato    | non cambia      |
| Modifica  | cambia localmente  | non viene chiamato | non cambia      |
| Rigenera  | viene sostituita   | viene chiamato    | non cambia      |
| Scarta    | viene rimossa      | non viene chiamato | non cambia      |
| Salva     | viene confermata   | non viene chiamato | crea una bozza  |

---

## File da modificare

**`src/incident.js`** — sola funzione `generateAndRender()` (righe 43-50).

### Codice attuale (da sostituire)

```js
async function generateAndRender() {
  // TODO L24.1: validate the selection, request a preview and render it.
  void generateIncidentPreview;
  void getSelectedTicketIds;
  void renderPreview;
  void setBusy;
  setStatus("Collega il TODO L24.1 per generare l'anteprima.", "info");
}
```

### Codice proposto

```js
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
```

---

## 5 punti operativi (con decisioni)

| # | Decisione | Verifica |
|---|---|---|
| 1 | Leggere `getSelectedTicketIds()` + `elements.scenario.value` | restituiscono array di stringhe e stringa |
| 2 | Validare `length < 2 \|\| length > 4` lato client con early return | evita chiamata API inutile |
| 3 | `setBusy(true)` prima della chiamata, `finally { setBusy(false) }` dopo | pulsanti inattivi durante attesa |
| 4 | `result.ok === true` → `currentPreview = result.preview`, `renderPreview(...)` | anteprima renderizzata, `Anteprima non salvata` visibile |
| 5 | `result.ok === false` o eccezione → `currentPreview = null`, `clearPreview()` | nessuna anteprima falsa, `#draft-count` resta "0" |

---

## Cosa non toccherò

`incident-api.js`, `incident-view.js`, `incident.html`, `server/`, `tests/`, `package.json`. Nessun nuovo file.

---

## Rischio e autonomia

| Fattore | Valutazione |
|---|---|
| Chiarezza task | Alta — matrice + test E2E |
| Blast radius | 1 funzione, 1 file, solo frontend |
| Reversibilita` | `git checkout src/incident.js` |
| Costo verifica | `pnpm verify:l24` ~ pochi secondi |

---

## Verifica

```bash
pnpm verify:l24
```

Casi coperti dai test:
- **E2E test 1**: 2 ticket → click Genera → anteprima visibile → `#draft-count = "0"` → Salva → `#draft-count = "1"`
- **E2E test 2**: scenario `invalid_output` → errore in `#app-status` → pulsante Salva nascosto
- **API test**: generazione non persiste bozza, save persiste solo campi editabili

---

## Permesso massimo

Sostituire il corpo di `generateAndRender()` (righe 43-50). Nessun accesso al resto del file, nessun nuovo import, nessuna dipendenza.

---

## Strategia prompt

**Zero-shot.** Il task e` delimitato con esattezza dalla matrice dei comportamenti e dai test E2E. Le firme helper sono gia` importate.
