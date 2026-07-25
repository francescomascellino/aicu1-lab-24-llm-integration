# L24 - Lab feature AI controllata

Completa il flusso UI della Sintesi multi-ticket. Il backend, i provider, la
validazione del contratto e SQLite sono gia' pronti: il lavoro e' concentrato in
tre TODO ordinati dentro `src/incident.js`.

## Requisiti

- Node.js 26 o successivo;
- pnpm 11 o successivo.

## Avvio

```bash
pnpm install --frozen-lockfile
pnpm exercise:l24
pnpm dev
```

Apri l'URL stampato dal terminale, normalmente
`http://127.0.0.1:4173/incident.html`.

Replay e' gia' selezionato e non richiede account, rete o chiavi API. Usa prima
lo scenario `success`, poi controlla almeno un percorso tra `timeout`, `refusal`
e `invalid_output`.

## Obiettivo

Completa questi tre collegamenti:

1. `Genera sintesi` mostra un'anteprima non salvata;
2. modifica, rigenerazione e scarto non cambiano il database;
3. `Salva come bozza` salva i campi revisionati e aggiorna l'elenco.

La consegna completa e i criteri sono in [CONSEGNA.md](CONSEGNA.md).

## Verifica finale

```bash
pnpm setup:browsers
pnpm verify:l24
```

I test browser sono intenzionalmente rossi prima di completare i TODO. Non
modificare i test per ottenere verde.

## Provider opzionali

Puoi usare `pnpm dev:opencode` se OpenCode e' gia' configurato oppure
`pnpm dev:mistral` se disponi di una chiave Mistral nel terminale locale. Nessuno
dei due percorsi e' necessario per completare il lab.

Gli identificatori tecnici `incident-*` appartengono alla base di partenza e non
devono essere rinominati per completare l'esercizio.

Non caricare `node_modules`, database SQLite, `.env`, report Playwright o cache.
