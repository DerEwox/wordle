## Beschreibung
Eine version des bekannten `Wordles` aber mit 10 Buchstaben, sowie Statistiken.

---
## Preview 

Eine Vorschau gibt es bei [emox-wordle.vercel.app](https://emox-wordle.vercel.app)

---
## Wordle Utilities

Dieses Repository enthält verschiedene Hilfsprogramme und Funktionen, die für die Arbeit mit Wortlisten in einem Wordle-ähnlichen Spiel verwendet werden können. Die Hauptfunktionen sind in den Dateien checkWordLists.ts, shuffelWords.ts, wordsToUpperCase.ts und words.ts implementiert. Im Folgenden wird beschrieben, wie diese Dateien verwendet werden können.

---


### **1. words.ts**
Diese Datei enthält die Hauptwortlisten, die im Spiel verwendet werden. Die Struktur ist wie folgt:
- `words[year][month][day]`: Die Wörter sind nach Jahr, Monat und Tag organisiert.
- Alle Wörter müssen in Großbuchstaben geschrieben sein (siehe 2.).
- Umlaute wie Ä, Ö, Ü müssen in `ae`, `oe`, `ue` umgeschrieben werden.
- ```export const start = { year: 2025, month: 8 }``` beschreibt das Jahr und der Monat bei dem die Liste beginnt.

#### **Beispiel:**
```ts
export const words: string[][][] = [
  [
    ['', '', '', 'BIBLIOTHEK', 'SCHWIMMBAD', 'LEBENSLAUF'...],
    ['FILMKRITIK', 'PULSMESSER', 'LEBERKAESE'...]
  ]
];
```

---

### **2. wordsToUpperCase.ts**
Diese Datei konvertiert alle Wörter in den Listen in Großbuchstaben. Dies ist erforderlich, da alle Wörter in words.ts in Großbuchstaben vorliegen müssen.

#### **Verwendung:**
1. Stelle sicher, dass die Datei words.ts korrekt importiert ist.
2. Führe das Skript aus:
   ```bash
   npx ts-node utils/wordsToUpperCase.ts
   ```
3. Die konvertierten Wörter werden in der Konsole ausgegeben. Kopiere die Ausgabe und ersetze die Inhalte in words.ts, falls nötig.

---

### **3. checkWordLists.ts**
Diese Datei überprüft die Wortlisten auf Konsistenz und Validität. Sie führt verschiedene Prüfungen durch, wie z. B. die Länge der Listen, die Länge der Wörter und ob die Wörter in einem Wörterbuch (DWDS) existieren.

#### **Verwendung:**
1. Stelle sicher, dass die Datei words.ts korrekt importiert ist.
2. Führe das Skript aus:
   ```bash
   npm run dev
   ```
   Dann in neuer Konsole:
   ```bash
   npx ts-node utils/checkWordLists.ts
   ```
3. Das Skript gibt detaillierte Informationen über Fehler oder Warnungen in der Konsole aus.

---

### **4. shuffelWords.ts**
Diese Datei mischt die Wörter in den Listen zufällig durch. Dies kann nützlich sein, um die Reihenfolge der Wörter zu ändern.

#### **Verwendung:**
1. Stelle sicher, dass die Datei words.ts korrekt importiert ist.
2. Führe das Skript aus:
   ```bash
   npx ts-node utils/shuffelWords.ts
   ```
3. Die gemischten Wörter werden in der Konsole ausgegeben. Kopiere die Ausgabe und ersetze die Inhalte in words.ts, falls gewünscht.

---


### **Voraussetzungen**
- Node.js und TypeScript müssen installiert sein.
- Installiere die Abhängigkeiten mit:
  ```bash
  npm install
  ```

---

### **Entwicklung**
- Starte den Entwicklungsserver:
  ```bash
  npm run dev
  ```
- Baue das Projekt:
  ```bash
  npm run build
  ```
- Vercel Deploy
  ```bash
  vercel --prod
  ```

---
by  
![Logo](https://files.catbox.moe/s0htru.png)
