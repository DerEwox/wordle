import { readFileSync } from "fs";

export function readTxtLines(path: string): string[] {
  const content = readFileSync(path, "utf-8");

  return content
    .split(/\r?\n/)      // trennt nach Zeilen (Windows & Unix)
    .filter(line => line.length > 0); // optional: leere Zeilen entfernen
}
