<script lang="ts">
	//DWDS – Digitales Wörterbuch der deutschen Sprache. Das Wortauskunftssystem zur deutschen Sprache in Geschichte und Gegenwart, hrsg. v. d. Berlin-Brandenburgischen Akademie der Wissenschaften, <https://www.dwds.de/>, abgerufen am 17.08.2025.

	import { isWordValid } from './checkWordDWDS';

	// @ts-expect-error - canvas-confetti has incomplete TypeScript type definitions
	import Confetti from 'canvas-confetti';
	import { onMount } from 'svelte';
	import {words, start as wordListStart} from '../lib/words'
	import UpdatePopup from '../lib/UpdatePopup.svelte';

	let message = '';
	let shake = false;
	let gameOver = false;
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
		day: today.getDate() - 1
	}

	const dayWord = words[wordPointer.year][wordPointer.month][wordPointer.day]
	console.log("Today's word is: ", dayWord);

	// 10 Versuche
	let display: string[][] = Array.from({ length: 10 }, () => new Array<string>(10).fill(''));
	let displayBg: string[][] = Array.from({ length: 10 }, () => new Array<string>(10).fill(''));
	displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';

	let confettiInterval: ReturnType<typeof setInterval> | undefined;
	let showUpdatePopup = false;
	const updatePopupKey = 'wordle-update-popup-dismissed-v1';
	const updatePopupCutoff = new Date('2026-06-23T00:00:00');
	//Speichern ------------------------------------------------------------------------

	let stats = {
		gamesPlayed: 0,
		gamesWon: 0,
		currentStreak: 0,
		bestStreak: 0,
		lastPlayed: JSON.stringify(today),
		playedCountedDate: '',
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

	function movePointer(delta: number) {
		const nextCell = Math.min(display[0].length - 1, Math.max(0, pointer.cell + delta));
		if (nextCell === pointer.cell) return;

		displayBg[pointer.row][pointer.cell] = '';
		pointer.cell = nextCell;
		displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void onInput('ENTER');
			return;
		}

		if (event.key === ' ' || event.key === 'Tab' || event.key === 'ArrowRight') {
			event.preventDefault();
			movePointer(1);
			return;
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			movePointer(-1);
			return;
		}

		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			return;
		}

		if (event.key === 'Backspace') {
			event.preventDefault();
			void onInput('BACK');
			return;
		}

		if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
			void onInput(event.key.toUpperCase());
		}
	}

	// function isYesterday(date: Date): boolean {
	// 	const today = new Date();
	// 	const yesterday = new Date(today);
	// 	yesterday.setDate(today.getDate() - 1); // einen Tag zurück

	// 	return (
	// 		date.getFullYear() === yesterday.getFullYear() &&
	// 		date.getMonth() === yesterday.getMonth() &&
	// 		date.getDate() === yesterday.getDate()
	// 	);
	// }

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);

		const popupDismissed = localStorage.getItem(updatePopupKey) === 'true';
		if (!popupDismissed && new Date() < updatePopupCutoff) {
			showUpdatePopup = true;
		}

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
				const savedDate = new Date(savedDateStr);
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

		// Wenn der gespeicherte Stand nicht vom heutigen Tag ist,
		// und das Spiel gestern begonnen (mindestens ein Buchstabe eingegeben)
		// aber nicht beendet wurde (savedEnd === 'false'), dann verliert
		// der Spieler seine aktuelle Win-Streak.
		if (savedDateStr) {
			const savedDate = new Date(savedDateStr);
			if (!isToday(savedDate)) {
				if (savedEnd === 'false' && savedDisplay !== null) {
					try {
						const parsedDisplay = JSON.parse(savedDisplay) as string[][];
						const started = parsedDisplay.some((r) => r.some((c) => c !== ''));
						if (started) {
							stats.gamesPlayed += 1;
							stats.currentStreak = 0;
							localStorage.setItem('stats', JSON.stringify(stats));
							showMessage('Streak verloren', false, 10000);
						}
					} catch (e) {
						console.warn('Could not parse saved display for streak check', e);
					}
				}
			}
		}

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function closeUpdatePopup() {
		localStorage.setItem(updatePopupKey, 'true');
		showUpdatePopup = false;
	}

	//Spiel----------------------------------------------------------------------------

	function normalizeUmlauts(input: string): string {
		let word = input.toLowerCase();
		word = word.replace(/que/g, '§§§QUE§§§');
		word = word.replace(/eue/g, '§§§EUE§§§');
		word = word.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü');
		word = word.replace(/§§§QUE§§§/g, 'que').replace(/§§§EUE§§§/g, 'eue');
		return word;
	}

	function prepareDWDSVariants(word: string): string[] {
		const umlauted = normalizeUmlauts(word);
		const noun = umlauted.charAt(0).toUpperCase() + umlauted.slice(1);
		const verb = umlauted;
		return [noun, verb];
	}

	function startConfetti() {
		confettiInterval = setInterval(() => {
			Confetti({
				particleCount: 50,
				spread: 70,
				origin: { y: 0.6 }
			});
		}, 1000);
	}

	function stopConfetti() {
		clearInterval(confettiInterval);
	}

	function showMessage(msg: string, end = true, durationMs?: number) {
		message = msg;
		const dur = durationMs ?? (end ? 5000 : 2000);
		if (!end) {
			shake = true;
			setTimeout(() => {
				message = '';
				shake = false;
			}, dur);
		} else {
			setTimeout(() => {
				message = '';
				stopConfetti();
			}, dur);
		}
	}

	async function revealRow(rowIdx: number, results: string[]) {
		const rowEl = document.querySelectorAll('.display-row')[rowIdx].children;
		Array.from(rowEl).forEach((cell, i) => {
			const el = cell as HTMLElement;
			setTimeout(() => {
				el.classList.add('reveal');
				setTimeout(() => {
					displayBg[rowIdx][i] = results[i];
				}, 250);
				el.addEventListener('animationend', () => el.classList.remove('reveal'), { once: true });
			}, i * 250);
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
		const [nomen, verb] = prepareDWDSVariants(inputStr);

		if (!(await isWordValid(nomen)) && !(await isWordValid(verb))) {
			showMessage('Wort existiert nicht', false);
			disableInput = false;
			return;
		}

		displayBg[pointer.row][pointer.cell] = '';

		for (let i = 0; i < display[0].length; i++) {
			if (word[i] === input[i]) {
				result[i] = 'key-correct';
				word[i] = '';
				input[i] = '-';
			}
		}
		for (let i = 0; i < display[0].length; i++) {
			if (word.includes(input[i])) {
				result[i] = 'key-present';
				const idx = word.indexOf(input[i]);
				word[idx] = '';
				input[i] = '-';
			}
		}
		for (let i = 0; i < display[0].length; i++) {
			if (result[i] === '') {
				result[i] = 'key-absent';
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
			showMessage('Gewonnen!', true);
			gameOver = true;
			stats.gamesWon += 1;
			stats.distribution[pointer.row] += 1;
			stats.currentStreak += 1;
			stats.gamesPlayed += 1;
			if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
			stats.lastPlayed = today.toISOString();
			localStorage.setItem('stats', JSON.stringify(stats));
			startConfetti();
		} else if (pointer.row + 1 >= display.length) {
			showMessage(`Du hast verloren! Das Wort war ${dayWord}`, true);
			gameOver = true;
			stats.currentStreak = 0;
			stats.gamesPlayed += 1;
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
			if (display[pointer.row][pointer.cell] === '') {
				if (pointer.cell > 0) {
					displayBg[pointer.row][pointer.cell] = '';
					pointer.cell -= 1;
				}
			}

			display[pointer.row][pointer.cell] = '';
			displayBg[pointer.row][pointer.cell] = 'display-cell-aimed';
		} else if (input === 'ENTER') {
			displayBg[pointer.row][pointer.cell] = '';
			await evaluate();
		} else {
			// const todayKey = new Date().toISOString().split('T')[0];
			// if (stats.playedCountedDate !== todayKey) {
			// 	stats.gamesPlayed += 1;
			// 	stats.playedCountedDate = todayKey;
			// 	localStorage.setItem('stats', JSON.stringify(stats));
			// }

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

<a href="/stats" class="stats-button" aria-label="View statistics">
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="3" y="10" width="4" height="11" fill="white" />
		<rect x="10" y="6" width="4" height="15" fill="white" />
		<rect x="17" y="2" width="4" height="19" fill="white" />
	</svg>
</a>

{#if message}
	<div class="message-overlay">{message}</div>
{/if}

{#if showUpdatePopup}
	<UpdatePopup on:close={closeUpdatePopup} />
{/if}

<div class="game-wrapper">
	<div class="display-container">
		{#each display as row, rowIdx (rowIdx)}
			<div class={`display-row ${shake && rowIdx === pointer.row ? 'shake' : ''}`}>
				{#each row as cell, cellIdx (cellIdx)}
					<div
						class={`display-cell ${displayBg[rowIdx][cellIdx]}`}
						role="button"
						tabindex="0"
						on:click={() => setPointer(rowIdx, cellIdx)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								setPointer(rowIdx, cellIdx);
							}
						}}
					>
						{cell}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<div class="keyboard-container">
		{#each KEYBOARD_ROWS as row (row)}
			<div class="keyboard-row">
				{#each row as key (key)}
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
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
		overflow: hidden;
		background-color: #121213;
		color: #fff;
		font-family: system-ui, sans-serif;
	}

	/* Füllt exakt den Viewport – Grid oben, Tastatur unten, kein Leerraum */
	.game-wrapper {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		padding-top: 2.5rem; /* Platz für Stats-Button */
		box-sizing: border-box;
	}

	/* Grid wächst und füllt den Raum zwischen Padding und Tastatur */
	.display-container {
		flex: 1;
		min-height: 0; /* erlaubt Schrumpfen */
		display: flex;
		flex-direction: column;
		justify-content: flex-start;/*space-evenly; /* Zeilen gleichmäßig verteilen, kein Leer-Block */
		align-items: center;
		padding: 0 0.2em;
		gap: 0.2rem;
	}

	.display-row {
		display: flex;
		justify-content: center;
		gap: 0.2rem;
		width: 100%;
	}

	/* Zellen skalieren mit Viewport-Breite, bleiben innerhalb sinnvoller Grenzen */
	.display-cell {
		width: clamp(22px, 8vw, 44px);
		height: clamp(22px, 8vw, 44px);
		border: 2px solid rgb(51, 51, 51);
		font-weight: bold;
		font-size: clamp(13px, 4.5vw, 24px);
		text-transform: uppercase;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
		flex-shrink: 0;
		box-sizing: border-box;
	}

	.display-cell-aimed {
		border: 2px solid darkgray;
	}

	/* Tastatur haftet am unteren Rand, schrumpft nie */
	.keyboard-container {
		flex-shrink: 0;
		padding: 0.4rem 0.3rem 0.6rem;
		background: #1a1a1b;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
		box-sizing: border-box;
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
		width: 100%;
		max-width: 480px;
	}

	.key-btn {
		flex: 1;
		font-weight: bold;
		border-radius: 4px;
		font-size: clamp(0.65rem, 2.2vw, 0.95rem);
		text-transform: uppercase;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		height: clamp(2rem, 5.5vh, 3rem);
		padding: 0;
	}

	.key-btn:active {
		transform: scale(0.95);
	}

	.key-wide {
		flex: 1.5;
	}

	.key-default { background-color: #666; color: white; }
	.key-correct { background-color: #6aaa64; color: white; border-color: #6aaa64; }
	.key-present { background-color: #c9b458; color: white; border-color: #c9b458; }
	.key-absent  { background-color: #3a3a3c; color: white; border-color: #3a3a3c; }

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
		white-space: nowrap;
	}

	.stats-button {
		position: fixed;
		top: 0.5rem;
		right: 0.5rem;
		background-color: #4caf50;
		padding: 0.25rem;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		transition: background-color 0.2s, transform 0.2s;
		z-index: 100;
	}

	.stats-button:hover {
		background-color: #45a049;
		transform: scale(1.1);
	}

	.shake {
		animation: shake 0.3s;
	}

	@keyframes shake {
		0%   { transform: translateX(0); }
		25%  { transform: translateX(-5px); }
		50%  { transform: translateX(5px); }
		75%  { transform: translateX(-5px); }
		100% { transform: translateX(0); }
	}

	@keyframes flipReveal {
		0%   { transform: rotateX(0deg); }
		50%  { transform: rotateX(90deg); }
		100% { transform: rotateX(0deg); }
	}

	.reveal {
		animation: flipReveal 0.5s ease forwards;
		transform-origin: center;
	}
</style>