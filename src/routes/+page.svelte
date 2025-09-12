<script lang="ts">
	//DWDS – Digitales Wörterbuch der deutschen Sprache. Das Wortauskunftssystem zur deutschen Sprache in Geschichte und Gegenwart, hrsg. v. d. Berlin-Brandenburgischen Akademie der Wissenschaften, <https://www.dwds.de/>, abgerufen am 17.08.2025.

	import { json } from '@sveltejs/kit';
	import { isWordValid } from './checkWordDWDS';

	// @ts-ignore
	import Confetti from 'canvas-confetti';
	import { onMount } from 'svelte';
	import {words, start as wordListStart} from '../lib/words'

	let message = '';
	let shake = false;
	let gameOver = false;
	let showConfetti = false;
	let disableInput = false;

	interface KeyColors {
		[key: string]: 'key-default' | 'key-correct' | 'key-present' | 'key-absent';
	}

	const KEYBOARD_ROWS: string[][] = [
		'QWERTZUIOP'.split(''),
		'ASDFGHJKL'.split(''),
		['ENTER', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
	];

	let keyColors: KeyColors = {};
	for (const row of KEYBOARD_ROWS) {
		for (const key of row) {
			if (key !== 'ENTER' && key !== 'BACK') keyColors[key] = 'key-default';
		}
	}

	let pointer: { row: number; cell: number } = { row: 0, cell: 0 };

	


	const today = new Date();
	const wordPointer = {
		year: today.getFullYear() - wordListStart.year,
		month: today.getMonth() + 1 - wordListStart.month,
		day: today.getDate() -1
	}

	const dayWord = words[wordPointer.year][wordPointer.month][wordPointer.day]

	let display: string[][] = Array.from({ length: 12 }, () => new Array<string>(10).fill(''));
	let displayBg: string[][] = Array.from({ length: 12 }, () => new Array<string>(10).fill(''));
	displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';

	let confettiInterval: number;
	//Speichern ------------------------------------------------------------------------

	let stats = {
		gamesPlayed: 0,
		gamesWon: 0,
		currentStreak: 0,
		bestStreak: 0,
		lastPlayed: JSON.stringify(today),
		distribution: Array(12).fill(0)
	};

	function isToday(date: Date) {
		const today = new Date();
		return (
			date.getFullYear() === today.getFullYear() &&
			date.getMonth() === today.getMonth() &&
			date.getDate() === today.getDate()
		);
	}

	function isYesterday(date: Date): boolean {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1); // einen Tag zurück

		return (
			date.getFullYear() === yesterday.getFullYear() &&
			date.getMonth() === yesterday.getMonth() &&
			date.getDate() === yesterday.getDate()
		);
	}

	onMount(() => {
		const savedDisplay = localStorage.getItem('display');
		const savedDisplayBg = localStorage.getItem('displayBg');
		const savedKeyColor = localStorage.getItem('keyColor');
		const savedPointer = localStorage.getItem('pointer');
		const savedDateStr = localStorage.getItem('date');
		const savedEnd = localStorage.getItem('end');
		const savedStats = localStorage.getItem('stats');

		if (
			savedDisplay !== null &&
			savedDisplayBg !== null &&
			savedKeyColor !== null &&
			savedPointer !== null &&
			savedDateStr !== null &&
			savedEnd !== null
		) {
			if (savedDateStr) {
				const savedDate = new Date(savedDateStr); // direkt in Date umwandeln
				if (isToday(savedDate)) {
					console.log('Speicherstand heute');
					display = JSON.parse(savedDisplay);
					displayBg = JSON.parse(savedDisplayBg);
					keyColors = JSON.parse(savedKeyColor);
					pointer = JSON.parse(savedPointer);
					gameOver = JSON.parse(savedEnd);
				} else {
					console.log('Kein Speicherstand heute');
				}
			}
		}

		if (savedStats === null) {
			localStorage.setItem('stats', JSON.stringify(stats));
		} else {
			stats = JSON.parse(savedStats);
		}
	});

	//Spiel----------------------------------------------------------------------------

	function normalizeUmlauts(input: string): string {
		// Alles Kleinbuchstaben
		let word = input.toLowerCase();

		// Sonderfälle schützen: "que" und "eue"
		word = word.replace(/que/g, '§§§QUE§§§');
		word = word.replace(/eue/g, '§§§EUE§§§');

		// Normale Ersetzungen
		word = word.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü');

		// Sonderfälle wiederherstellen
		word = word.replace(/§§§QUE§§§/g, 'que').replace(/§§§EUE§§§/g, 'eue');

		return word;
	}

	function prepareDWDSVariants(word: string): string[] {
		const umlauted = normalizeUmlauts(word);

		// Variante 1: Nomen → erster Buchstabe groß, Rest klein
		const noun = umlauted.charAt(0).toUpperCase() + umlauted.slice(1);

		// Variante 2: alles klein
		const verb = umlauted;

		return [noun, verb];
	}

	// Funktion für wiederholtes Konfetti
	function startConfetti() {
		confettiInterval = setInterval(() => {
			Confetti({
				particleCount: 50,
				spread: 70,
				origin: { y: 0.6 }
			});
		}, 1000); // alle 1 Sekunde kleine Menge Konfetti
	}

	function stopConfetti() {
		clearInterval(confettiInterval);
	}

	function showMessage(msg: string, end = true) {
		message = msg;
		if (!end) {
			shake = true;
			setTimeout(() => {
				message = '';
				shake = false;
			}, 2000);
		} else {
			setTimeout(() => {
				message = '';
				stopConfetti();
			}, 5000);
		}
	}

	async function revealRow(rowIdx: number, results: string[]) {
		const rowEl = document.querySelectorAll('.display-row')[rowIdx].children;

		Array.from(rowEl).forEach((cell, i) => {
			const el = cell as HTMLElement;

			setTimeout(() => {
				el.classList.add('reveal');

				// Farbe genau bei halber Animation setzen
				setTimeout(() => {
					displayBg[rowIdx][i] = results[i];
				}, 250); // Hälfte von 0.5s Dauer

				el.addEventListener('animationend', () => el.classList.remove('reveal'), { once: true });
			}, i * 250); // Delay pro Zelle für Welle
		});
	}

	async function evaluate() {
		disableInput = true;
		let result: string[] = new Array(display[0].length).fill('');
		const word = [...dayWord.split('')];
		const input = [...display[pointer.row]];

		if (input.includes('')) {
			showMessage('Wort zu kurz', false);
			disableInput = false;
			return;
		}

const inputStr = input.join('');

// NEU: Varianten für DWDS prüfen
const [nomen, verb] = prepareDWDSVariants(inputStr);

if (!(await isWordValid(nomen)) && !(await isWordValid(verb))) {
	showMessage('Wort existiert nicht', false);
	disableInput = false;
	return;
}


		displayBg[pointer.row][pointer.cell] = '';
		//Alle identischen Makieren
		for (let i = 0; i < display[0].length; i++) {
			if (word[i] === input[i]) {
				result[i] = 'key-correct';
				//
				word[i] = '';
				input[i] = '-';
			}
		}
		//Alle anwesenden
		for (let i = 0; i < display[0].length; i++) {
			if (word.includes(input[i])) {
				result[i] = 'key-present';
				//
				const idx = word.indexOf(input[i]);
				word[idx] = '';
				input[i] = '-';
			}
		}
		//Alle anderen
		for (let i = 0; i < display[0].length; i++) {
			if (result[i] === '') {
				result[i] = 'key-absent';
				//
			}
		}

		revealRow(pointer.row, result);
		await new Promise((r) => setTimeout(r, 3000));
		console.log('result: ', result);
		for (let i = 0; i < result.length; i++) {
			if (result[i] === 'key-correct') {
				keyColors[display[pointer.row][i]] = 'key-correct';
			} else if (result[i] === 'key-present') {
				if (keyColors[display[pointer.row][i]] !== 'key-correct')
					keyColors[display[pointer.row][i]] = 'key-present';
			} else if (result[i] === 'key-absent') {
				if (
					keyColors[display[pointer.row][i]] !== 'key-correct' &&
					keyColors[display[pointer.row][i]] !== 'key-present'
				)
					keyColors[display[pointer.row][i]] = 'key-absent';
			}
		}

		console.log(display[pointer.row].join(''));
		console.log(dayWord);

		if (display[pointer.row].join('') === dayWord) {
			showMessage('Gewonnen!', true); // permanent
			gameOver = true;
			stats.gamesPlayed += 1;
			stats.gamesWon += 1;
			stats.distribution[pointer.row] += 1;


			stats.currentStreak += 1;
			if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;

			stats.lastPlayed = today.toISOString();

			localStorage.setItem('stats', JSON.stringify(stats));
			startConfetti();
		} else if (pointer.row + 1 >= display.length) {
			showMessage(`Du hast verloren! Das Wort war ${dayWord}`, true); // permanent
			gameOver = true;
			stats.gamesPlayed += 1;
			stats.currentStreak = 0;

			stats.lastPlayed = today.toISOString();
			localStorage.setItem('stats', JSON.stringify(stats));
		} else {
			pointer.cell = 0;
			pointer.row += 1;
			displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';
		}

		localStorage.setItem('display', JSON.stringify(display));
		localStorage.setItem('displayBg', JSON.stringify(displayBg));
		localStorage.setItem('keyColor', JSON.stringify(keyColors));
		localStorage.setItem('pointer', JSON.stringify(pointer));
		localStorage.setItem('date', today.toISOString());

		if (!gameOver) {
			localStorage.setItem('end', JSON.stringify(false));
		} else {
			localStorage.setItem('end', JSON.stringify(true));
		}
		disableInput = false;
	}

	function setPointer(row: number, cell: number) {
		if (row !== pointer.row) return;
		displayBg[pointer.row][pointer.cell] = '';
		pointer.row = row;
		pointer.cell = cell;
		displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';
	}

	async function onInput(input: string) {
		if (gameOver) return;
		if (disableInput) return;

		if (input === 'BACK') {
			if (pointer.cell > 0) {
				if (display[pointer.row][pointer.cell] === '') {
					displayBg[pointer.row][pointer.cell] = '';
					pointer.cell -= 1;
				}
				display[pointer.row][pointer.cell] = '';
				displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';
			}
		} else if (input === 'ENTER') {
			displayBg[pointer.row][pointer.cell] = '';
			await evaluate();
		} else {
			display[pointer.row][pointer.cell] = input;
			if (pointer.cell < display[0].length - 1) {
				displayBg[pointer.row][pointer.cell] = '';
				pointer.cell += 1;
				displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';
			} else {
				displayBg[pointer.row][pointer.cell] = '';
			}
		}
	}

	function getKeyLabel(key: string): string {
		if (key === 'BACK') return '⌫';
		if (key === 'ENTER') return '⏎';
		return key;
	}
</script>

<a href="/stats" class="stats-button">
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="3" y="10" width="4" height="11" fill="white" />
		<rect x="10" y="6" width="4" height="15" fill="white" />
		<rect x="17" y="2" width="4" height="19" fill="white" />
	</svg>
</a>
<!-- Overlay-Meldung -->
{#if message}
	<div class="message-overlay">{message}</div>
{/if}

<div class="display-container">
	{#each display as row, rowIdx}
		<div class={`display-row ${shake && rowIdx === pointer.row ? 'shake' : ''}`}>
			{#each row as cell, cellIdx}
				<div
					class={`display-cell ${displayBg[rowIdx][cellIdx]}`}
					on:click={() => setPointer(rowIdx, cellIdx)}
				>
					{cell}
				</div>
			{/each}
		</div>
	{/each}
</div>

<div class="keyboard-container">
	{#each KEYBOARD_ROWS as row}
		<div class="keyboard-row">
			{#each row as key}
				<button
					class={`key-btn ${keyColors[key] ?? 'key-default'} ${key === 'ENTER' || key === 'BACK' ? 'key-wide' : ''}`}
					on:click={() => onInput(key)}
				>
					{getKeyLabel(key)}
				</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	:global(body) {
		background-color: #121213;
		color: #fff;
		font-family: system-ui, sans-serif;
		margin: 0;
		height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}

	.message-overlay {
		position: fixed;
		top: 50px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(255, 0, 0, 0.9);
		color: white;
		font-weight: bold;
		padding: 10px 20px;
		border-radius: 8px;
		z-index: 1000;
	}

	.display-container {
		position: fixed;
		top: 20px;
		left: calc(50% - (336px / 2));
		margin-top: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 0;
	}

	.display-row {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
		width: 100%;
		max-width: 500px;
	}

	.shake {
		animation: shake 0.3s;
	}

	@keyframes shake {
		0% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-5px);
		}
		50% {
			transform: translateX(5px);
		}
		75% {
			transform: translateX(-5px);
		}
		100% {
			transform: translateX(0);
		}
	}

	.display-cell {
		width: 26px;
		height: 26px;
		border: rgb(51, 51, 51) 2px solid;
		font-weight: bold;
		font-size: 21px;
		text-transform: uppercase;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
	}

	.keyboard-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.5rem;
		background: #1a1a1b;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
		width: 100%;
		max-width: 500px;
	}

	.key-btn {
		flex: 1;
		padding: 1rem 0;
		font-weight: bold;
		border-radius: 4px;
		font-size: 1rem;
		text-transform: uppercase;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 3rem;
	}

	.key-btn:active {
		transform: scale(0.95);
	}

	.key-wide {
		flex: 1.5;
	}

	.key-default {
		background-color: #666;
		color: white;
	}
	.key-correct {
		background-color: #6aaa64;
		color: white;
		border-color: #6aaa64;
	}
	.key-present {
		background-color: #c9b458;
		color: white;
		border-color: #c9b458;
	}
	.key-absent {
		background-color: #3a3a3c;
		color: white;
		border-color: #3a3a3c;
	}
	.display-cell-aimed {
		border: darkgray 2px solid;
	}

	.stats-button {
		position: fixed;
		top: 0.5rem;
		right: 0.5rem;
		background-color: #4caf50;
		padding: 0.25rem; /* kleineres Padding */
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		transition:
			background-color 0.2s,
			transform 0.2s;
		z-index: 100;
	}

	.stats-button:hover {
		background-color: #45a049;
		transform: scale(1.1);
	}

	@keyframes flipReveal {
		0% {
			transform: rotateX(0deg);
		}
		50% {
			transform: rotateX(90deg);
		}
		100% {
			transform: rotateX(0deg);
		}
	}

	.reveal {
		animation: flipReveal 0.5s ease forwards;
		transform-origin: center;
	}
</style>
