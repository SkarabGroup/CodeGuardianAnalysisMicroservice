# Protocollo Operativo

## 1. Allineamento Ambiente Docker

Prima di testare e sviluppare, assicurarsi che l'immagine locale sia up-to-date
con le ultime dipendenze e configurazioni.

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

Assicurarsi che il terminale non mostri errori di compilazione NestJS al
termine dello startup. Successivamente ci si sposta in un sottobranch con
nomenclatura
`git checkout -b feature/nome-task`

## 2. Normalizzazione Estetica Prettier

Al fine di garantire che il diff di git sia pulito e privo di variazioni di
spaziature o stile non necessario (o non richiesto).

```bash
docker compose -f infra/docker/docker-compose.yml exec app npm run format
```

Questo comando modifica i file localmente applicando le regole di `.prettierrc`.

## 3. Analisi Statica Linter

Verifica la conformità alle regole TypeScript Strict e alle policy di qualità
ESLint.

```bash
docker compose -f infra/docker/docker-compose.yml exec app npm run lint
```

Assolutamente proibito il push in remoto qualora il linter restituisse errori.
La correzione deve essere manuale ed è tassativo risolverlo immediatamente.
(Non pensate di fare i furbi che tanto la GitHub Action fallisce e non si
accetta la PR).

## 4. Controllo Simmetria Architetturale

Tassativa la corrispondenza biunivoca tra logica e test: ogni file in `src/` deve
avere un suo corrispondente in `test/`.

```bash
docker compose -f infra/docker/docker-compose.yml exec app node scripts/check-test-symmetry.js
```

## 5. Validazione Logica e Coverage

Esecuzione della suite di test unitari con vincolo di copertura >= 90%.

```bash
docker compose -f infra/docker/docker-compose.yml exec app npm run test:cov
```

## 6. Invio

La procedura di pubblicazione in remoto è la seguente

```bash
git add .
git commit -m "Feature (Nome Feature): Descrizione sintetica di quanto fatto"
git push origin feature/nome-feature
```

Il commit deve essere rigorosamente in lingua inglese e deve essere
riassuntivo del codice che committa. Il mancato rispetto di questo comporta
il rigetto della PR.

Qualora il Push risultasse essere positivo, è possibile richiedere una PR
al branch più importante in quel momento.

ASSOLUTAMENTE VIETATO NON RISPETTARE UNO DEI SEGUENTI PASSAGGI.
ASSOLUTAMENTE VIETATO PUBBLICARE CODICE NON CONFORME.
ASSOLUTAMENTE VIETATO SUPERARE IL CONTROLLO DELLA PR IN AUTOMATICO (richiesta
revisione).
