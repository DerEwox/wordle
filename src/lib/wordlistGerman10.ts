import rawWordlist from '../../utils/wordlist-german-10.txt?raw';

export const localWordSet = new Set(
	rawWordlist
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
);
