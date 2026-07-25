# Piano Breve

Task:
Collega i tre TODO in `src/incident.js` senza modificare backend, provider,
validator, database o test.

Il flusso finale deve essere:

```txt
ticket selezionati
-> anteprima non salvata
-> modifica / rigenerazione / scarto
-> salvataggio esplicito con ID
```

# Matrice dei comportamenti

| Azione    | Anteprima          | Provider          | Database        |
|-----------|--------------------|-------------------|-----------------|
| Genera    | viene creata       | viene chiamato    | non cambia      |
| Modifica  | cambia localmente  | non viene chiamato | non cambia      |
| Rigenera  | viene sostituita   | viene chiamato    | non cambia      |
| Scarta    | viene rimossa      | non viene chiamato | non cambia      |
| Salva     | viene confermata   | non viene chiamato | crea una bozza  |

> Questa matrice descrive il comportamento osservabile, non i nomi delle funzioni.

Completa [TASK]

Prima di modificare file, restituisci una bozza di piano in massimo 5 punti operativi (decisioni/azioni verificabili). Fuori scope, verifica, rischio e permesso massimo sono extra e non contano nel limite.

In questa fase non scrivere codice.

Indica:

- file probabili da modificare o da creare (percorso relativo);
- snippet di codice aggiunto/modificato e file/funzione relativa;
- modifica minima proposta;
- cosa non toccherai;
- rischi;
- prova di controllo;
- permesso massimo da concedere;
- strategia prompt: zero-shot o few-shot.

Valuta rischio e autonomia in base a: chiarezza del task, blast radius, reversibilità del diff, costo della verifica, permesso massimo da concedere per la risoluzione dei task indicati nel piano.

Se il task richiede redesign, routing, nuove feature o refactor, fermati e segnalalo.

Non mostrare chain-of-thought estesa. Se proponi esempi few-shot, usa al massimo 1-2 esempi brevi per chiarire formato o criterio, senza anticipare la soluzione.