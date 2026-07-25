# Orientamento

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


Non modificare file.

Aiutami a capire dove viene gestita la parte rilevante del task.

Indicami:

- file o componenti probabili compresi di percorso relativo;
- perche' sono rilevanti;
- cosa dovrei leggere prima;
- quali punti sono incerti.
- se bastano istruzioni zero-shot o se servono 1-2 esempi few-shot per chiarire formato o criterio.

Non mostrare chain-of-thought estesa: riporta solo assunzioni principali, criterio usato e verifica proposta.