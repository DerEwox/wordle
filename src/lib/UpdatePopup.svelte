<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher<{ close: void }>();
	const HOLD_DURATION_MS = 3000;

	let progress = 0;
	let holdTimer: ReturnType<typeof setInterval> | undefined;
	let holdStart = 0;

	function clearHold(resetProgress = true) {
		if (holdTimer) {
			clearInterval(holdTimer);
			holdTimer = undefined;
		}

		if (resetProgress) {
			progress = 0;
		}
	}

	function startHold() {
		if (holdTimer) return;

		holdStart = performance.now();
		holdTimer = setInterval(() => {
			const elapsed = performance.now() - holdStart;
			progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);

			if (progress >= 100) {
				clearHold(false);
				dispatch('close');
			}
		}, 16);
	}

	function stopHold() {
		clearHold(true);
	}

	function handlePointerDown(event: PointerEvent) {
		event.preventDefault();
		startHold();
	}

	onDestroy(() => {
		clearHold(false);
	});
</script>

<svelte:window on:pointerup={stopHold} on:pointercancel={stopHold} on:blur={stopHold} />

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="update-title">
	<div class="card">
		<div class="badge">Update</div>
		<h2 id="update-title">Was ist neu?</h2>
		<p class="lead">Ein paar Dinge haben sich geändert:</p>

		<ul class="changes">
			<li>Neue Wörter bis Ende August 2026</li>
			<li>
				Wörter werden zuerst in der lokalen Liste gesucht und erst dann bei DWDS.
				<div class="subline">Schnelleres Überprüfen von Wörtern und <span class="accent-word">neue Wörter wie "Superpower"</span> verfügbar.</div>
			</li>
			<li class="streak-item">Die Win-Streak geht verloren, wenn du angefangen hast zu spielen, aber vor einem neuen Tag nicht beendet hast.</li>
			<li>Unterstützung für angeschlossene Tastaturen</li>
		</ul>

		<p class="hint"></p>

		<button
			class="hold-button"
			type="button"
			on:pointerdown={handlePointerDown}
			on:pointerup={stopHold}
			on:pointerleave={stopHold}
			on:lostpointercapture={stopHold}
		>
			<span class="fill" style={`transform: scaleX(${progress / 100})`}></span>
			<span class="label">Gedrückt halten zum Schließen</span>
		</button>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgba(8, 10, 14, 0.76);
		backdrop-filter: blur(8px);
	}

	.card {
		width: min(100%, 640px);
		max-height: min(90vh, 760px);
		overflow: auto;
		background: linear-gradient(180deg, #1d222b 0%, #10141c 100%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 1.4rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
		color: #f2f5ff;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		background: rgba(122, 162, 255, 0.15);
		border: 1px solid rgba(122, 162, 255, 0.35);
		color: #bcd0ff;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0.8rem 0 0.35rem;
		font-size: clamp(1.5rem, 4vw, 2.2rem);
		line-height: 1.05;
	}

	.lead,
	.hint {
		margin: 0;
		color: rgba(242, 245, 255, 0.78);
	}

	.lead {
		margin-bottom: 1rem;
	}

	.changes {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.9rem;
		color: #eef2ff;
	}

	.changes li {
		line-height: 1.45;
	}

	.accent-word {
		color: #ff7b7b;
		font-weight: 700;
	}

	.streak-item {
		color: #ff9c9c;
		background: rgba(255, 91, 91, 0.06);
		border: 1px solid rgba(255, 91, 91, 0.14);
		border-radius: 12px;
		padding: 0.75rem 0.9rem;
	}

	.subline {
		margin-top: 0.35rem;
		color: rgba(242, 245, 255, 0.7);
		font-size: 0.95rem;
	}

	.hint {
		margin-top: 1.1rem;
		margin-bottom: 0.8rem;
		font-size: 0.95rem;
	}

	.hold-button {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		width: 100%;
		min-height: 3.2rem;
		border: 0;
		border-radius: 14px;
		background: #1b2330;
		color: #ffffff;
		font-weight: 800;
		font-size: 1rem;
		cursor: pointer;
	}

	.fill {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, #64d98e 0%, #4ca8ff 100%);
		transform-origin: left center;
		transform: scaleX(0);
		transition: transform 16ms linear;
		z-index: -1;
	}

	.label {
		position: relative;
		z-index: 1;
	}
</style>