# Lab L24 - Completare la Sintesi multi-ticket

## Obiettivo

Collega i tre TODO in `src/incident.js` senza modificare backend, provider,
validator, database o test.

Il flusso finale deve essere:

```txt
ticket selezionati
-> anteprima non salvata
-> modifica / rigenerazione / scarto
-> salvataggio esplicito con ID
```

La starter e' autonoma: non servono file o modifiche delle lezioni precedenti.

## Avvio

```bash
pnpm install --frozen-lockfile
pnpm exercise:l24
pnpm dev
```

Apri l'URL indicato dal terminale. Replay e' gia' configurato e non richiede
account o chiavi.

## 1. Generare e mostrare

Completa `TODO L24.1`.

`Genera sintesi` deve:

- accettare una selezione da 2 a 4 ticket;
- inviare al server soltanto i loro ID;
- mostrare caricamento, successo oppure errore;
- mostrare il provider utilizzato;
- mostrare `Anteprima non salvata`;
- lasciare invariato il conteggio delle bozze.

## 2. Controllare senza salvare

Completa `TODO L24.2`.

L'operatore deve poter:

- modificare titolo, sintesi, informazioni mancanti, prossima azione e segnali di
  rischio;
- rigenerare usando gli stessi ticket;
- scartare e tornare allo stato iniziale.

ID dei ticket, evidenze e provider restano controllati dal server. Rigenera e
scarta non devono salvare.

## 3. Salvare esplicitamente

Completa `TODO L24.3`.

`Salva come bozza` deve:

- inviare la versione revisionata;
- impedire invii duplicati;
- mostrare l'ID della bozza;
- aggiornare l'elenco delle bozze salvate.

Solo questa azione modifica il database.

## Errori da provare

Dopo il percorso `success`, prova almeno uno tra:

```txt
timeout
invalid_output
```

L'errore deve essere leggibile e non deve lasciare un'anteprima falsa o una nuova
bozza.

## Matrice dei comportamenti

| Azione | Anteprima | Provider | Database |
| --- | --- | --- | --- |
| Genera | viene creata | viene chiamato | non cambia |
| Modifica | cambia localmente | non viene chiamato | non cambia |
| Rigenera | viene sostituita | viene chiamato | non cambia |
| Scarta | viene rimossa | non viene chiamato | non cambia |
| Salva | viene confermata | non viene chiamato | crea una bozza |

## Provare Mistral (facoltativo)

Completa prima i tre TODO e verifica il flusso con Replay. Mistral serve solo a
ripetere lo stesso percorso usando una vera API: non e' necessario per completare
il lab e non richiede modifiche al codice.

1. Crea una chiave API personale in Mistral Studio.
2. Configura la chiave soltanto nel terminale locale.

macOS o Linux:

```bash
export MISTRAL_API_KEY="LA_TUA_CHIAVE"
export MISTRAL_MODEL="mistral-small-latest"
pnpm dev:mistral
```

Windows PowerShell:

```powershell
$env:MISTRAL_API_KEY="LA_TUA_CHIAVE"
$env:MISTRAL_MODEL="mistral-small-latest"
pnpm dev:mistral
```

3. Apri l'URL indicato dal terminale.
4. Seleziona da 2 a 4 ticket e genera una nuova sintesi.
5. Verifica che l'anteprima mostri `mistral` come provider.
6. Revisiona il contenuto e scegli consapevolmente se scartarlo o salvarlo.

Per tornare al provider locale, interrompi il server e avvia:

```bash
pnpm dev:replay
```

Non installare SDK aggiuntivi. Non inserire la chiave nel codice, in un file
`.env`, negli screenshot o nella repository. Al termine puoi rimuoverla dal
terminale con `unset MISTRAL_API_KEY` su macOS/Linux oppure con
`Remove-Item Env:MISTRAL_API_KEY` in PowerShell.

## Agente facoltativo

```txt
Leggi AGENTS.md, README.md e i tre TODO in src/incident.js.
Aiutami con un solo TODO.

Prima indica:
- comportamento atteso nel browser;
- endpoint coinvolto;
- cosa non deve essere salvato;
- controllo da eseguire.

Non modificare backend, provider, schema, database, test o stile globale.
```

## Verifica finale

```bash
pnpm setup:browsers
pnpm verify:l24
```

La feature e' pronta quando puoi mostrare:

```txt
selezione -> genera -> modifica -> scarta
selezione -> genera -> modifica -> salva -> ID bozza
errore -> nessuna anteprima falsa -> nessun salvataggio
```

## Fuori scope

- rinominare gli identificatori tecnici `incident-*`;
- modificare automaticamente i ticket;
- modificare schema, prompt o implementazione dei provider;
- aggiungere dipendenze;
- usare dati reali o condividere chiavi.
