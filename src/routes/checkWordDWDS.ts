export async function isWordValid(word: string) {
    const res = await fetch(`/api/validate-word?q=${word}`);
    console.log('Fetch at: ', `/api/validate-word?q=${word}`);
    if (!res.ok) return false;
    const data = await res.json();
    if (data.length === 0) {
        return false;
    }
    return true;
}