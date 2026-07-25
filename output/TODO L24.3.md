# Piano — TODO L24.3

## Task

`Salva come bozza` deve:
- inviare la versione revisionata;
- impedire invii duplicati;
- mostrare l'ID della bozza;
- aggiornare l'elenco delle bozze salvate.

Solo questa azione modifica il database.

## Matrice dei comportamenti

| Azione    | Anteprima          | Provider          | Database        |
|-----------|--------------------|-------------------|-----------------|
| Salva     | viene confermata   | non viene chiamato | crea una bozza  |

---

## File da modificare

**`src/incident.js`** — sola funzione `handlePreviewAction()`, blocco `action === "save"` (righe 130-134).

---

## Cosa copre vs cosa e` gia` attivo

- **Modifica campi**: gia` funzionante tramite il form HTML. Nessun codice da scrivere.
- **Salvataggio**: da implementare nel blocco `if (action === "save")`.

---

### Codice attuale (da sostituire)

```js
  if (action === "save") {
    // TODO L24.3: save the reviewed fields, then reload the saved drafts.
    void saveIncidentDraft;
    void readRevision;
    void loadIncidentDrafts;
  }
```

### Codice proposto

```js
  if (action === "save") {
    const revision = readRevision();
    setBusy(true);
    setStatus("Salvataggio in corso...", "info");

    try {
      const result = await saveIncidentDraft({ previewId: currentPreview.id, draft: revision });

      if (result.ok) {
        clearPreview();
        currentPreview = null;
        setStatus(`Bozza salvata: ${result.draft.id}`, "info");
        const drafts = await loadIncidentDrafts();
        renderSavedDrafts(drafts);
      } else {
        setStatus(REASON_LABELS[result.reason] || result.reason || "Errore nel salvataggio.", "error");
      }
    } catch {
      setStatus("Errore di connessione al server.", "error");
    } finally {
      setBusy(false);
    }
  }
```

---

## 5 punti operativi

| # | Decisione | Verifica |
|---|---|---|
| 1 | `readRevision()` legge i campi editabili dal form | `{ title, summary, missingInformation, suggestedNextAction, riskFlags }` |
| 2 | `saveIncidentDraft({ previewId: currentPreview.id, draft: revision })` | POST con previewId e campi revisionati |
| 3 | `setBusy(true)` blocca il doppio click; server rifiuta preview gia` consumata | pulsante disabilitato + `preview_not_found` al secondo invio |
| 4 | Successo → `clearPreview()` + `currentPreview = null` + reload + render bozze | `#draft-count` aggiornato, titolo nella lista, ID mostrato |
| 5 | Errore → `currentPreview` **non** viene azzerato, utente puo` riprovare | preview ancora disponibile dopo `preview_not_found` |

---

## Cosa non tocchero`

`incident-api.js`, `incident-view.js`, `incident.html`, `server/`, `tests/`, `REASON_LABELS`, `generateAndRender()`.
Nessun nuovo file.

---

## Rischio e autonomia

| Fattore | Valutazione |
|---|---|
| Chiarezza task | Alta — test E2E fornisce criterio di accettazione esplicito |
| Blast radius | 1 funzione, 1 file, solo frontend |
| Reversibilita` | `git checkout src/incident.js` |
| Costo verifica | `pnpm verify:l24` |
| Permesso massimo | Sostituire righe 130-134 di `src/incident.js` |

---

## Verifica

```bash
pnpm verify:l24
```

Dopo questa patch, il test E2E "incident proposal stays a preview until the user saves it" deve passare:
- genera 2 ticket → modifica titolo → Salva → `#draft-count = "1"` → titolo visibile

---

## Strategia prompt

**Zero-shot.** Il pattern e` identico a generate/regenerate: read → API → ok → update UI + reload.
