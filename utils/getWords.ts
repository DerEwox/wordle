import { readTxtLines } from "./readTXT";
const steps = 180 
const offset = 0

export function getWords(path: string): string[] {
    const words = readTxtLines(path);
    const precheckWords: string[] = []

    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].toUpperCase();
        if (words[i].includes("Ä") || words[i].includes("Ö") || words[i].includes("Ü") || words[i].includes("ß")) {
            words[i] = words[i].replace("Ä", "AE").replace("Ö", "OE").replace("Ü", "UE").replace("ß", "SS");
        }

        if (words[i].length === 10) {
            precheckWords.push(words[i]);
        }
    }

    return precheckWords//.slice(0, 1000); //LIMITIERUNG
}


const words = getWords("utils/wordlist-german.txt")
let errors = 0

const ANSI = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};

// ---- Hilfsfunktionen ----

function normalizeUmlauts(input: string): string {
    let word = input.toLowerCase();

    // Sonderfälle schützen
    word = word.replace(/que/g, '§§§QUE§§§');
    word = word.replace(/eue/g, '§§§EUE§§§');

    // AE/OE/UE ersetzen
    word = word.replace(/ae/g, 'ä')
        .replace(/oe/g, 'ö')
        .replace(/ue/g, 'ü');

    // Sonderfälle wiederherstellen
    word = word.replace(/§§§QUE§§§/g, 'que')
        .replace(/§§§EUE§§§/g, 'eue');

    return word;
}

function prepareVariants(word: string): string[] {
    const umlauted = normalizeUmlauts(word);

    // Variante 1: Nomen (erstes Zeichen groß)
    const noun = umlauted.charAt(0).toUpperCase() + umlauted.slice(1);

    // Variante 2: alles klein
    const verb = umlauted;

    return [noun, verb];
}

async function isWordValid(word: string) {
    const res = await fetch(`http://localhost:5173/api/validate-word?q=${word}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.length > 0;
}


// ---- Hauptcheck ----
const WordList = words;
let countWordsChecked = 0;
let validWords: string[] = [];
// passed / checked = 0,1559
// If x words are needed:
// x / 0,1559
console.log(ANSI.yellow, "Starting check for wordlist with", WordList.length, "words (Offset ", offset, "Steps:",steps,")", ANSI.reset);


// Check Word Lengths
console.log(ANSI.cyan, ">Checking Word Lengths", ANSI.reset)
let error = false

for (let i = 0; i < WordList.length; i++) {
    if (WordList[i].length !== 10 && WordList[i] !== "") {
        error = true
        errors++
        console.log(ANSI.red, "     [WARNING]  ", ANSI.reset, ANSI.dim, "The word at index ", i, "", ANSI.reset, ANSI.blue, WordList[i], ANSI.reset, ANSI.dim, " with a length of ", WordList[i].length, ANSI.reset)
    }
}

if (!error) {
    console.log(ANSI.green, "   [OK]", ANSI.reset, ANSI.dim, " All words have 10 characters.", ANSI.reset)
}
console.log()

// Check Words on DWDS
console.log(ANSI.cyan, ">Checking Words on DWDS", ANSI.reset)
error = false

for (let i = offset; i < WordList.length; i = i+steps) {
    countWordsChecked++;
    const inputStr = WordList[i];
    if (inputStr === "") continue;

    if (/[ÄÖÜ]/.test(inputStr)) {
        console.log(ANSI.red, "     [WARNING]  ", ANSI.reset, ANSI.dim, "The word at index ", i, " word is: ", ANSI.blue, WordList[i], ANSI.reset, ANSI.dim, "contains an invalid char.", ANSI.reset)
    }

    const [nounVariant, verbVariant] = prepareVariants(inputStr);

    const validNoun = await isWordValid(nounVariant);
    const validVerb = await isWordValid(verbVariant);

    if (!validNoun && !validVerb) {
        error = true
        errors++
    }

    if (validNoun || validVerb) {
        validWords.push(inputStr);
        console.log(Math.floor((i/words.length)*100), ANSI.green, "%     [OK]       ", ANSI.reset, ANSI.dim, "The word at index ", i, " word is: ", ANSI.blue, WordList[i], ANSI.reset)
    }
}

function format(arr: string[]): string[][] {
  const result: string[][] = [];

  for (let i = 0; i < arr.length; i += 31) {
    result.push(arr.slice(i, i + 31));
  }

  return result;
}

const validWordsFormatted = format(validWords);

console.log(ANSI.red, countWordsChecked - errors + '/' + countWordsChecked, "Passed", ANSI.reset)
console.log(validWordsFormatted, ANSI.dim, validWords.length, " Valid Words", ANSI.reset)