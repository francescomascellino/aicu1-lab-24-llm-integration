# Piano — TODO L24.2

## Task

L'operatore deve poter:
- modificare titolo, sintesi, informazioni mancanti, prossima azione e segnali di rischio;
- rigenerare usando gli stessi ticket;
- scartare e tornare allo stato iniziale.

ID dei ticket, evidenze e provider restano controllati dal server. Rigenera e scarta non devono salvare.

## Matrice dei comportamenti

| Azione    | Anteprima          | Provider          | Database        |
|-----------|--------------------|-------------------|-----------------|
| Genera    | viene creata       | viene chiamato    | non cambia      |
| Modifica  | cambia localmente  | non viene chiamato | non cambia      |
| Rigenera  | viene sostituita   | viene chiamato    | non cambia      |
| Scarta    | viene rimossa      | non viene chiamato | non cambia      |
| Salva     | viene confermata   | non viene chiamato | crea una bozza  |

---

## Cosa copre vs cosa e` gia` attivo

- **Modifica**: gia` funzionante — `renderPreview()` popola i campi del form HTML, l'utente puo` modificarli liberamente. Nessun codice da scrivere.
- **Rigenera** e **Scarta**: da implementare nel blocco `if (action === "regenerate" || action === "discard")`.

---

## File da modificare

**`src/incident.js`** — sola funzione `handlePreviewAction()`, righe 83-88.

### Codice attuale (da sostituire)

```js
  if (action === "regenerate" || action === "discard") {
    // TODO L24.2: regenerate or discard without persisting the proposal.
    void discardIncidentPreview;
    void clearPreview;
    return;
  }
```

### Codice proposto

```js
  if (action === "discard") {
    try { await discardIncidentPreview(currentPreview.id); } catch {}
    clearPreview();
    currentPreview = null;
    setStatus("Anteprima scartata.", "info");
    return;
  }

  if (action === "regenerate") {
    try { await discardIncidentPreview(currentPreview.id); } catch {}

    const ticketIds = currentPreview.draft.affectedTicketIds;
    const scenario = elements.scenario.value;
    setBusy(true);
    setStatus("Rigenerazione in corso...", "info");

    try {
      const result = await generateIncidentPreview({ ticketIds, scenario });

      if (result.ok) {
        currentPreview = result.preview;
        renderPreview(result.preview);
        setStatus("Anteprima rigenerata.", "info");
      } else {
        currentPreview = null;
        clearPreview();
        setStatus(result.reason || "Errore nella rigenerazione.", "error");
      }
    } catch {
      currentPreview = null;
      clearPreview();
      setStatus("Errore di connessione al server.", "error");
    } finally {
      setBusy(false);
    }
    return;
  }
```

### Perche' i catch vuoti

Se il `DELETE` fallisce (es. 404), la preview lato server e` gia` sparita: e` il risultato voluto. I catch vuoti evitano che l'errore blocchi l'operazione.
`requestJson()` (in `incident-api.js:10`) trasforma ogni risposta non-ok in un throw, quindi un doppio scarto o una rigenerazione con preview scaduta scatenerebbero l'eccezione senza motivo reale.

---

## 5 punti operativi

| # | Decisione | Verifica |
|---|---|---|
| 1 | Split `"regenerate" \|\| "discard"` in due `if` separati | ciascuno ha logica e stato UI diverso |
| 2 | Discard: `discardIncidentPreview(id)` lato server + `clearPreview()` + `currentPreview = null` | anteprima rimossa, form nascosto |
| 3 | Rigenera: discard old + `generateIncidentPreview({ ticketIds: currentPreview.draft.affectedTicketIds, scenario })` | stessi ticket, provider richiamato |
| 4 | `setBusy(true/false)` + `try/catch/finally` per rigenera | pulsanti disabilitati durante attesa, errori gestiti |
| 5 | Errore rigenera → `currentPreview = null`, `clearPreview()`, mostra `reason` | nessuna anteprima falsa |

---

## Cosa non tocchero`

`incident-api.js`, `incident-view.js`, `incident.html`, `server/`, `tests/`, nessun nuovo file.
`generateAndRender()` (L24.1) resta invariato.

---

## Rischio e autonomia

| Fattore | Valutazione |
|---|---|
| Chiarezza task | Alta — matrice esplicita: rigenera "viene sostituita", scarta "viene rimossa" |
| Blast radius | 1 funzione, solo frontend |
| Reversibilita` | `git checkout src/incident.js` |
| Costo verifica | `pnpm verify:l24` + test manuale rigenera/scarta |
| Permesso massimo | Sostituire righe 83-88 di `src/incident.js` |

---

## Verifica

```bash
pnpm verify:l24
```

Copertura: unit test (8/8), API test (3/3). Il test E2E "save" fallira` ancora per L24.3.
Test manuale aggiuntivo: Genera → clicca Rigenera (nuova anteprima, `#draft-count` resta "0") → clicca Scarta (form nascosto, stato vuoto).

---

## Strategia prompt

**Zero-shot.** Il pattern e` simmetrico a L24.1 con l'aggiunta del discard preventivo. Le funzioni helper sono gia` importate.
