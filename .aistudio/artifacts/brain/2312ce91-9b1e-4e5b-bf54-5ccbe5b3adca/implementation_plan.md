# Gestione Sezioni, Riordinamento e Duplicazione Voci nei Preventivi

Piano architetturale e di design per integrare la suddivisione per sezioni/categorie nell'editor dei preventivi, il riordinamento flessibile (su/giù sia per le voci che per le sezioni), la duplicazione rapida delle voci e la resa tipografica fedele sia a schermo che nel PDF finale.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisioni confermate nella fase di chiarimento:
> 1. **Visualizzazione nell'editor**: Le voci saranno raggruppate visivamente sotto la rispettiva intestazione di sezione, con comandi rapidi per aggiungere voci direttamente alla sezione corrente o riordinare/eliminare l'intero blocco.
> 2. **Visualizzazione nel PDF finale**: Nel documento stampato le sezioni appariranno come righe divisorie di categoria eleganti e pulite, **senza subtotali parziali**, preservando il riepilogo fiscale e il totale generale a piè di pagina.
> 3. **Voci senza sezione**: Se un preventivo contiene voci non assegnate o preesistenti, saranno collocate in un blocco predefinito "Voci generali / Principali", con la possibilità di assegnarle in qualsiasi momento a una nuova sezione tramite il selettore integrato nella scheda della voce.

---

## 1. Overview & Core Concept

### Cos'è
Un sistema completo di strutturazione dei preventivi edili e termoidraulici che permette all'artigiano di organizzare le voci di capitolato in macro-fasi logiche (ad es. *Opere preliminari*, *Lavorazioni principali*, *Materiali e forniture*, *Manodopera*, *Finiture*, ecc.), riordinare liberamente qualsiasi elemento e duplicare voci complesse con un solo tocco.

### A chi si rivolge
Idraulici, elettricisti, serramentisti edili e imprese di ristrutturazione che necessitano di presentare preventivi chiari, leggibili e suddivisi per capitoli di spesa al cliente finale, sia da smartphone in cantiere sia da computer in ufficio.

### Benefici chiave
- **Preventivi strutturati come capitolati professionali**: niente più liste chilometriche disordinate; il cliente comprende immediatamente l'avanzamento dei lavori.
- **Velocità operativa**: duplicazione istantanea di lavorazioni simili (es. sostituzione sanitari, punti luce o linee tubazioni) modificando solo quantità o dettagli.
- **Flessibilità totale**: riordinamento immediato di righe e sezioni con pulsanti direzionali senza rischiare perdite di dati.

---

## 2. User Experience & Visual Design

### Flusso Utente

1. **Apertura Preventivo**:
   - L'utente accede all'editor inline del preventivo (`QuoteInlineEditor`).
   - In alto a destra rispetto al titolo "Voci", trova il pulsante a discesa con freccia **"Aggiungi sezione ▾"** affiancato al pulsante principale **"+ Aggiungi voce"**.

2. **Aggiunta di una Sezione**:
   - Cliccando su *"Aggiungi sezione"*, si apre il menu contestuale con le 8 categorie standard indicate negli screenshot:
     - `Opere preliminari`
     - `Lavorazioni principali`
     - `Materiali e forniture`
     - `Manodopera`
     - `Finiture`
     - `Smaltimenti e pulizia finale`
     - `Collaudo e consegna`
     - `Extra e opzionali`
     - `Sezione personalizzata...` (apre un dialog/input compatto per digitare un nome su misura).
   - La sezione selezionata viene aggiunta all'elenco dei capitoli del preventivo.

3. **Intestazione di Sezione (Header)**:
   - Ogni blocco presenta un banner elegante e compatto (`bg-muted/40 border border-border/80 rounded-xl px-3.5 py-2`):
     - **Titolo del capitolo** in grassetto (`font-semibold text-sm`).
     - **Controlli di sezione**:
       - Frecce di spostamento sezione **↑** e **↓** (per anticipare o posticipare un intero capitolo).
       - Pulsante **"+ Voce"** rapido per aggiungere direttamente una nuova riga a quel capitolo.
       - Icona cestino rosso (🗑️) per eliminare la sezione (con conferma e salvaguardia o riassegnazione delle voci).

4. **Card Dettaglio Voce (Stile identico agli Screenshot)**:
   - Ciascuna riga è presentata come scheda contenitore chiara e ordinata:
     - **Descrizione**: area di testo espandibile a due righe per la spiegazione dettagliata del lavoro o materiale.
     - **Quantità & Unità**: campo numerico affiancato al selettore dell'unità di misura (`cad.`, `pz`, `ore`, `corpo`, `mt`, `mq`, `mc`, `kg`).
     - **Prezzo unitario & Sconto %**: campi numerici con formattazione tabellare e calcolo automatico dello sconto riga.
     - **IVA %**: aliquota IVA specifica per la voce (default ereditato dal profilo fiscale, es. 22%, 10% o 4%).
     - **Totale Riga**: riquadro azzurro/grigio ad alto contrasto con importo calcolato in tempo reale (`0,00 €`).
     - **Tipo & Sezione**:
       - *Tipo*: menu a tendina (`Lavorazione`, `Fornitura/Materiale`, `Prestazione`, `Servizio`, `Manodopera`).
       - *Sezione*: menu a tendina dinamico per spostare la voce in qualsiasi altra sezione attiva.
     - **Barra Azioni a Piè di Scheda**:
       - `↑ Sposta su`: sposta la voce una posizione sopra.
       - `↓ Sposta giù`: sposta la voce una posizione sotto.
       - `❐ Duplica voce`: crea una copia esatta della riga subito sotto.
       - `🗑️ Elimina voce`: rimuove la voce con feedback visivo.

5. **Visualizzazione Documento & PDF (`DocPreview`)**:
   - Nella tabella degli articoli del preventivo stampabile, ogni cambio di sezione inserisce una riga d'intestazione a tutta larghezza stilizzata (`font-bold`, sfondo soft del tema, bordo di separazione), senza subtotali parziali intermedi come da preferenza dell'utente.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisione 1: Struttura Dati Retrocompatibile**
  - *Scelta*: Salvare la sezione (`section?: string`), il tipo (`item_type?: string`), lo sconto (`discount?: number`) e l'ordine direttamente all'interno dell'array `items` di Supabase, affiancato da un elenco ordinato `sections?: string[]` nel documento.
  - *Perché*: Garantisce il 100% di compatibilità con tutti i preventivi già esistenti a database senza migrazioni distruttive. Se un vecchio preventivo non ha sezioni definite, continua a funzionare perfettamente visualizzando le voci nel blocco principale.
  - *Alternative scartate*: Creare una tabella relazionale separata per le sezioni, che avrebbe aumentato la latenza di rete e complicato il salvataggio atomico delle bozze.

- **Decisione 2: Pulsanti di Spostamento Fisici (↑ / ↓) + Drag Drop Opzionale**
  - *Scelta*: Fornire pulsanti espliciti di salita e discesa per ogni voce e sezione.
  - *Perché*: Su smartphone e touchscreen (iOS/Android) il drag-and-drop è spesso impreciso quando le schede sono lunghe e si scorre con il pollice. I pulsanti freccia garantiscono un'azione immediata, sicura al 100% e priva di errori di trascinamento accidentale.

- **Decisione 3: Duplicazione Atomica della Voce**
  - *Scelta*: Il pulsante "Duplica" clona fedelmente tutti i parametri (descrizione, prezzo, quantità, sconto, iva, tipo e sezione) e posiziona la copia esattamente dopo la voce originale.
  - *Perché*: È il pattern più naturale nell'esperienza d'uso: l'artigiano che aggiunge "Box doccia 80x80" può duplicarlo e cambiare in 2 secondi la dicitura in "Box doccia 90x90".

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QuoteInlineEditor.tsx                           │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ Titolo "Voci"         │  │ Dropdown "Aggiungi sezione ▾"         │  │
│  │ Button "+ Agg. voce"  │  │ (Opere prelim., Lavorazioni, etc.)    │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Sezione: "Lavorazioni principali"       [ ↑ ] [ ↓ ] [+ Voce] [🗑] │  │
│  │ ┌──────────────────────────────────────────────────────────────┐ │  │
│  │ │ Card Voce 1: "POSA BOX DOCCIA"                              │ │  │
│  │ │ • Q.tà: 1  |  U.M.: cad.  |  Prezzo: 150€  |  Sconto: 0%    │ │  │
│  │ │ • IVA: 22% |  Totale: 150,00 €                              │ │  │
│  │ │ • Tipo: Lavorazione  |  Sezione: Lavorazioni principali     │ │  │
│  │ │ • [ ↑ ] [ ↓ ] [ ❐ Duplica ] [ 🗑️ Elimina ]                   │ │  │
│  │ └──────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Sezione: "Materiali e forniture"        [ ↑ ] [ ↓ ] [+ Voce] [🗑] │  │
│  │ ┌──────────────────────────────────────────────────────────────┐ │  │
│  │ │ Card Voce 2: "Miscelatore termostatico"                     │ │  │
│  │ │ • [ ↑ ] [ ↓ ] [ ❐ Duplica ] [ 🗑️ Elimina ]                   │ │  │
│  │ └──────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DocPreview.tsx (PDF)                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ TABELLA ARTICOLI PREVENTIVO                                      │  │
│  │ ──────────────────────────────────────────────────────────────── │  │
│  │ ► LAVORAZIONI PRINCIPALI (Intestazione di categoria a piena riga)│  │
│  │   1. Posa box doccia          1 cad.    150,00 €     150,00 €    │  │
│  │ ──────────────────────────────────────────────────────────────── │  │
│  │ ► MATERIALI E FORNITURE                                          │  │
│  │   2. Miscelatore termostatico 1 pz      120,00 €     120,00 €    │  │
│  │ ──────────────────────────────────────────────────────────────── │  │
│  │ Totale Imponibile: 270,00 €  |  IVA (22%): 59,40 €               │  │
│  │ TOTALE DOCUMENTO: 329,40 €                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Modello Dati e Interfacce

```typescript
export interface DocItem {
  id?: string;
  description: string;
  qty: number;
  unit_price: number;
  unit?: string;
  discount?: number;     // Sconto percentuale applicato alla riga
  vat?: number;          // Aliquota IVA specifica
  item_type?: string;    // Lavorazione, Materiale, Manodopera, etc.
  section?: string;      // Nome del capitolo di appartenenza
}

export interface DocFormValue {
  // Campi standard esistenti
  id?: string;
  number: string;
  date: string;
  client_id?: string;
  title?: string;
  body?: string;
  items: DocItem[];
  sections?: string[];   // Ordine personalizzato delle sezioni attive
  // ... note, pagamenti, condizioni
}
```

### Elenco Sezioni Standard (come da screenshot)
1. `Opere preliminari`
2. `Lavorazioni principali`
3. `Materiali e forniture`
4. `Manodopera`
5. `Finiture`
6. `Smaltimenti e pulizia finale`
7. `Collaudo e consegna`
8. `Extra e opzionali`
9. Dialog interattivo per `Sezione personalizzata...`
