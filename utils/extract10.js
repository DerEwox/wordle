#!/usr/bin/env node
import { existsSync, statSync, createReadStream, createWriteStream } from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = process.argv[2] || path.join(__dirname, 'wordlist-german.txt');
const output = process.argv[3] || path.join(__dirname, 'wordlist-german-10.txt');

if (!existsSync(input)) {
  console.error('Input file not found:', input);
  process.exit(1);
}

const stat = statSync(input);
const totalBytes = stat.size;
let bytesRead = 0;
const readStream = createReadStream(input, { encoding: 'utf8' });
readStream.on('data', (chunk) => { bytesRead += Buffer.byteLength(chunk, 'utf8'); });
const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });
const outStream = createWriteStream(output, { flags: 'w', encoding: 'utf8' });

const start = Date.now();
let countMatched = 0;
let linesProcessed = 0;
let lastUpdate = 0;

function replaceUmlautsAndSharpS(s) {
  return s
    .replace(/Ä/g, 'AE')
    .replace(/ä/g, 'AE')
    .replace(/Ö/g, 'OE')
    .replace(/ö/g, 'OE')
    .replace(/Ü/g, 'UE')
    .replace(/ü/g, 'UE')
    .replace(/ß/g, 'SS');
}

function formatTime(sec) {
  if (!isFinite(sec)) return '--:--';
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

function printProgress(final = false) {
  const percent = totalBytes > 0 ? Math.min(100, (bytesRead / totalBytes) * 100) : 0;
  const elapsed = (Date.now() - start) / 1000;
  const estTotal = bytesRead > 0 ? elapsed * (totalBytes / bytesRead) : 0;
  const remaining = Math.max(0, estTotal - elapsed);
  process.stdout.write(`\rProcessed: ${linesProcessed} lines  Matches: ${countMatched}  ${percent.toFixed(1)}%  ETA: ${formatTime(remaining)}`);
  if (final) process.stdout.write('\n');
}

rl.on('line', (line) => {
  linesProcessed++;
  const word = line.trim();
  if (word === '') {
    if (Date.now() - lastUpdate > 500) { printProgress(false); lastUpdate = Date.now(); }
    return;
  }

  // Convert to uppercase and replace umlauts/ß first, then clean
  const upper = word.toUpperCase();
  const out = replaceUmlautsAndSharpS(upper);
  // Remove any characters that are not A-Z after replacement
  const cleaned = out.replace(/[^A-Z]/g, '');
  // Count characters properly (handle Unicode code points) after conversion
  const cpLen = Array.from(cleaned).length;
  if (cpLen === 10) {
    outStream.write(cleaned + '\n');
    countMatched++;
  }

  if (Date.now() - lastUpdate > 500) { printProgress(false); lastUpdate = Date.now(); }
});

rl.on('close', () => {
  printProgress(true);
  outStream.end();
  console.log(`Wrote ${countMatched} words to ${output}`);
});
