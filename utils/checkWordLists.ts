import { words } from '../src/lib/words.ts'

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

// ---- Hauptloop ----
for (let i = 0; i < words.length; i++) {
    const WordList = words[i];

    console.log("\n\n", ANSI.yellow, "-----------------\n       Year ", i, ANSI.yellow, ":\n  -----------------", ANSI.reset)

    // Check Arr length
    console.log()
    console.log(ANSI.cyan, ">Checking Arr Lengths", ANSI.reset)
    for (let m = 0; m < WordList.length; m++) {
        const length = WordList[m].length
        if (length === 31) {
            console.log(ANSI.green, "   [OK]      ", ANSI.reset, ANSI.dim, "Liste ", m, " has ", ANSI.bright, ANSI.magenta, "31", ANSI.reset, ANSI.dim, " Elements", ANSI.reset)
        } else if (length === 30) {
            console.log(ANSI.yellow, "   [Check]   ", ANSI.reset, ANSI.dim, "Liste ", m, " has ", ANSI.bright, ANSI.magenta, "30", ANSI.reset, ANSI.dim, " Elements", ANSI.reset)
        } else if (length < 30 || length > 31) {
            errors++
            console.log(ANSI.red, "   [WARNING] ", ANSI.reset, ANSI.dim, "Liste ", m, " has ", ANSI.bright, ANSI.red, length, ANSI.reset, ANSI.dim, " Elements", ANSI.reset)
        }
    }
    console.log()

    // Check Word Lengths
    console.log(ANSI.cyan, ">Checking Word Lengths", ANSI.reset)
    let error = false
    for (let m = 0; m < WordList.length; m++) {
        for (let d = 0; d < WordList[m].length; d++) {
            if (WordList[m][d].length !== 10 && WordList[m][d] !== "") {
                error = true
                errors++
                console.log(ANSI.red, "     [WARNING]  ", ANSI.reset, ANSI.dim, "The word in arr ", m, " at index ", d, "", ANSI.reset, ANSI.blue, WordList[m][d], ANSI.reset, ANSI.dim, " with a length of ", WordList[m][d].length, ANSI.reset)
            }
        }
    }
    if (!error) {
        console.log(ANSI.green, "   [OK]", ANSI.reset, ANSI.dim, " All words have 10 characters.", ANSI.reset)
    }
    console.log()

    // Check Words on DWDS
    console.log(ANSI.cyan, ">Checking Words on DWDS", ANSI.reset)
    error = false
    for (let m = 0; m < WordList.length; m++) {
        for (let d = 0; d < WordList[m].length; d++) {
            const inputStr = WordList[m][d];
            if (inputStr === "") continue;

            if (/[ÄÖÜ]/.test(inputStr)) {
                console.log(ANSI.red, "     [WARNING]  ", ANSI.reset, ANSI.dim, "The word in arr ", m, " at index ", d, " word is: ", ANSI.blue, WordList[m][d], ANSI.reset, ANSI.dim, "contains an invalid char.", ANSI.red)
            }

            const [nounVariant, verbVariant] = prepareVariants(inputStr);

            const validNoun = await isWordValid(nounVariant);
            const validVerb = await isWordValid(verbVariant);

            if (!validNoun && !validVerb) {
                if (/(AE|OE|UE)/i.test(inputStr)) {
                    console.log(ANSI.yellow, "     [WARNING]    ", ANSI.reset, ANSI.dim, "The word in arr ", m, " at index ", d, " word is: ", ANSI.blue, WordList[m][d], ANSI.reset, ANSI.dim, ANSI.cyan, "got flagged by system use another word!", ANSI.reset)
                } else {
                    error = true
                    errors++
                    console.log(ANSI.red, "     [WARNING]  ", ANSI.reset, ANSI.dim, "The word in arr ", m, " at index ", d, " word is: ", ANSI.blue, WordList[m][d], ANSI.reset, ANSI.dim, " is not on DWDS", ANSI.reset)
                }
            }
        }
    }
    if (!error) {
        console.log(ANSI.green, "   [OK]", ANSI.reset, ANSI.dim, " All words are on DWDS.", ANSI.reset)
    }

    console.log(errors, "Errors")
}
