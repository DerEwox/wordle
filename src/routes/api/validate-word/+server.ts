// src/routes/api/validate-word/+server.ts
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const query = url.searchParams.get('q');
    if (!query) return new Response('Missing query', { status: 400 });

    try {
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
