<script lang="ts">
	import { onMount } from 'svelte';
	let stats = {
		gamesPlayed: 0,
		gamesWon: 0,
		currentStreak: 0,
		bestStreak: 0,
		lastPlayed: JSON.stringify(new Date()),
		distribution: Array(12).fill(0)
	};

	let maxDist = 1; // Default 1, damit Balken sichtbar ist, auch wenn alle 0

	onMount(() => {
		const savedStats = localStorage.getItem('stats');
		if (savedStats) {
			stats = JSON.parse(savedStats);
		}
		maxDist = Math.max(...stats.distribution, 1); // Berechnet das Maximum
		console.log(maxDist);
		for (let i = 0; i < stats.distribution.length; i++) {
			const count = stats.distribution[i];
			console.log((count / maxDist) * 100);
		}
	});

	//{(count / maxDist) * 100}%
</script>

<div class="stats-container">
	<h1>Spiel-Statistiken</h1>

	<div class="stats">
		<div class="stat">
			<p class="label">Gespielte Spiele</p>
			<p class="value">{stats.gamesPlayed}</p>
		</div>
		<div class="stat">
			<p class="label">Gewonnen</p>
			<p class="value">{stats.gamesWon}</p>
		</div>
		<div class="stat">
			<p class="label">Aktuelle Serie</p>
			<p class="value">{stats.currentStreak}</p>
		</div>
		<div class="stat">
			<p class="label">Beste Serie</p>
			<p class="value">{stats.bestStreak}</p>
		</div>
	</div>

	<h2>Verteilung der Spiele</h2>

	<div>
		<div class="distribution">
			{#each stats.distribution as count, i}
				<div class="bar-container">
					<div class="bar" style="height: {(count / maxDist) * 100}%"></div>
				</div>
			{/each}
			<div class="distribution-info">
				{#each stats.distribution as count, i}
					<div>
						<p class="bar-count">{count}</p>
						<p class="bar-label">{i + 1}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style lang="css">
	:global(body) {
		background-color: #121213;
		color: #fff;
		font-family: system-ui, sans-serif;
		margin: 0;
		padding: 1rem;
	}

	.stats-container {
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	h1,
	h2 {
		text-align: center;
		margin: 0.5rem 0;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.stat {
		background-color: #1e1e1e;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
	}

	.stat .label {
		font-size: 0.9rem;
		color: #bbb;
		margin-bottom: 0.25rem;
	}

	.stat .value {
		font-size: 1.5rem;
		font-weight: bold;
	}

	.bar-container,
	.distribution-info > div {
		flex: 1; /* gleiche Breite */
		max-width: 30px; /* optional Limit */
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.distribution {
		position: relative;
		display: flex;
		gap: 0.4rem;
		justify-content: space-between;
		align-items: flex-end; /* Balken wachsen vom Boden nach oben */
		height: 200px; /* höheres Diagramm */
		padding: 0 0rem;
		background: #1a1a1a;
		border-radius: 0.5rem;
	}

	.distribution-info {
		width: 100%;
		bottom: -10px;
		left: 0px;
		position: absolute;
		display: flex;
		gap: 0.4rem;
		justify-content: space-between;
		align-items: flex-end; /* Balken wachsen vom Boden nach oben */
		height: 52px; /* höheres Diagramm */
		padding: 0 0rem;
		border-radius: 0.5rem;
	}

	.bar-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 30px;
		height: 90%;
		justify-content: flex-end;
	}

	.bar {
		width: 100%;
		background-color: #4caf50;
		border-radius: 0.25rem 0.25rem 0 0;
		transition: height 0.3s;
	}

	.bar-count {
		font-size: 0.75rem;
		color: #fff;
		margin-bottom: 0.25rem; /* Abstand über Balken */
	}

	.bar-label {
		font-size: 0.75rem;
		color: #bbb;
		margin-top: 0.25rem; /* Abstand unter Balken */
	}
</style>
