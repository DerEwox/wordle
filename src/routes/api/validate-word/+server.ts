import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import path from 'path';

const localWordlistPath = path.resolve(process.cwd(), 'utils', 'wordlist-german-10.txt');
let localWordSetPromise: Promise<Set<string>> | undefined;

function normalizeForWordlist(word: string): string {
    return word
        .trim()
        .toUpperCase()
        .replace(/Ä/g, 'AE')
        .replace(/Ö/g, 'OE')
        .replace(/Ü/g, 'UE')
        .replace(/ß/g, 'SS')
        .replace(/[^A-Z]/g, '');
}

async function getLocalWordSet(): Promise<Set<string>> {
    if (!localWordSetPromise) {
        localWordSetPromise = readFile(localWordlistPath, 'utf8').then((content) => {
            const words = content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

            return new Set(words);
        });
    }

    return localWordSetPromise;
}

export const GET: RequestHandler = async ({ url }) => {
    const query = url.searchParams.get('q');
    if (!query) return new Response('Missing query', { status: 400 });

    try {
        const localWordSet = await getLocalWordSet();
        const normalizedQuery = normalizeForWordlist(query);

        if (normalizedQuery && localWordSet.has(normalizedQuery)) {
            return new Response(JSON.stringify([normalizedQuery]), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const res = await fetch(
            `https://www.dwds.de/api/wb/snippet/?q=${encodeURIComponent(query)}`
        );

        // Prüfen, ob DWDS wirklich JSON liefert
        if (!res.ok) return new Response('DWDS error', { status: res.status });

        const data = await res.json(); // jetzt sicher JSON
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response('Fetch failed', { status: 500 });
    }
};
