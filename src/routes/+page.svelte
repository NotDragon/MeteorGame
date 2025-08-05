<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData, ActionData } from './$types';

	interface MeteorEntry {
		id: number;
		name: string;
		meteorsCount: number;
		timeMinutes: number;
		ratePerHour: number;
		timestamp: string;
		isSpecial?: boolean;
		specialType?: 'expected' | 'average';
	}

	let { data }: { data: PageData } = $props();
	let searchQuery = $state('');

	// Form fields
	let name = $state('');
	let meteorsCount = $state('');
	let timeMinutes = $state('');

	// Get entries from server data
	let entries = $derived(data.entries || []);

	// Calculate average rate
	let averageRate = $derived(entries.length > 0
		? entries.reduce((sum, entry) => sum + entry.ratePerHour, 0) / entries.length
		: 0);

	// Create combined list with special entries and user entries
	let allEntries = $derived.by(() => {
		const combinedEntries: MeteorEntry[] = [...entries];
		
		// Add expected rate entry
		combinedEntries.push({
			id: -1,
			name: 'Expected Rate',
			meteorsCount: 60,
			timeMinutes: 60,
			ratePerHour: 60,
			timestamp: '',
			isSpecial: true,
			specialType: 'expected'
		});
		
		// Add average rate entry if there are user entries
		if (entries.length > 0) {
			combinedEntries.push({
				id: -2,
				name: 'Average Rate',
				meteorsCount: 0,
				timeMinutes: 0,
				ratePerHour: averageRate,
				timestamp: '',
				isSpecial: true,
				specialType: 'average'
			});
		}
		
		return combinedEntries;
	});

	// Filter and sort all entries including special ones
	let filteredEntries = $derived(allEntries
		.filter(entry => 
			entry.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
		.sort((a, b) => b.ratePerHour - a.ratePerHour));

	let isSubmitting = $state(false);

	function handleEnhance() {
		isSubmitting = true;
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				// Reset form
				name = '';
				meteorsCount = '';
				timeMinutes = '';
				// Refresh the page data
				await invalidateAll();
			}
			isSubmitting = false;
			await update();
		};
	}

	function formatRate(rate: number): string {
		return rate.toFixed(1);
	}
</script>

<svelte:head>
	<title>Meteor Counter - Track Your Stargazing</title>
</svelte:head>

<div class="container">
	<div class="app-header">
		<h1>Meteor Counter</h1>
		<div class="instructions">
			<h3>How to Use This Tracker</h3>
			<ol>
				<li>Record your observations by entering your name, the number of meteors you spotted, and your observation time in minutes.</li>
				<li>Compare your rate to the expected of 60 meteors per hour at this location.</li>
				<li>See all results in the table, sorted by rate (highest at top). Green rates are above average, red are below.</li>
			</ol>
		</div>
	</div>

	<div class="main-content">
		<!-- Leaderboard Section -->
		<div class="leaderboard-section">
			<div class="section-header">
				<h2>Leaderboard</h2>
				<input
					type="text"
					placeholder="Search names..."
					bind:value={searchQuery}
					class="search-input"
				/>
			</div>

			<div class="leaderboard-list">
				{#each filteredEntries as entry, index}
					<div class="entry-card" 
						class:special-entry={entry.isSpecial}
						class:expected={entry.specialType === 'expected'}
						class:average={entry.specialType === 'average'}
						class:top-three={!entry.isSpecial && index < 3}
						class:above-average={!entry.isSpecial && entry.ratePerHour > averageRate}
						class:below-average={!entry.isSpecial && entry.ratePerHour < averageRate}>
						<div class="rank">
							{#if entry.specialType === 'expected'}
								★
							{:else if entry.specialType === 'average'}
								⌀
							{:else}
								#{filteredEntries.slice(0, index).filter(e => !e.isSpecial).length + 1}
							{/if}
						</div>
						<div class="entry-details">
							<div class="name">{entry.name}</div>
							<div class="stats">
								{#if entry.specialType === 'expected'}
									Standard expectation
								{:else if entry.specialType === 'average'}
									Based on {entries.length} observation{entries.length !== 1 ? 's' : ''}
								{:else}
									{entry.meteorsCount} meteors in {entry.timeMinutes} min
								{/if}
							</div>
						</div>
						<div class="rate">
							<div class="rate-value" 
								class:above-avg={!entry.isSpecial && entry.ratePerHour > averageRate}
								class:below-avg={!entry.isSpecial && entry.ratePerHour < averageRate}>
								{formatRate(entry.ratePerHour)}
							</div>
							<div class="rate-label">meteors/hr</div>
						</div>
					</div>
				{/each}

				{#if entries.length === 0}
					<div class="empty-state">
						<p>No observations yet. Be the first to submit!</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Form Section -->
		<div class="form-section">
			<h2>Submit Your Observation</h2>
			<form method="POST" action="?/addEntry" use:enhance={handleEnhance}>
				<div class="form-group">
					<label for="name">Your Name</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={name}
						placeholder="Enter your name"
						required
					/>
				</div>

				<div class="form-group">
					<label for="meteors">Meteors Counted</label>
					<input
						id="meteors"
						name="meteorsCount"
						type="number"
						bind:value={meteorsCount}
						placeholder="How many meteors?"
						min="0"
						required
					/>
				</div>

				<div class="form-group">
					<label for="time">Time Spent (minutes)</label>
					<input
						id="time"
						name="timeMinutes"
						type="number"
						bind:value={timeMinutes}
						placeholder="Observation time"
						min="0.1"
						step="0.1"
						required
					/>
				</div>

				<button type="submit" class="submit-btn" disabled={isSubmitting}>
					{isSubmitting ? 'Submitting...' : 'Calculate & Submit'}
				</button>

				{#if meteorsCount && timeMinutes}
					<div class="preview">
						<p>Your rate: <strong>{formatRate((parseInt(meteorsCount) / parseFloat(timeMinutes)) * 60)}</strong> meteors/hr</p>
					</div>
				{/if}
			</form>
		</div>
	</div>

	<!-- Footer with Logo -->
	<footer class="app-footer">
		<img 
			src="https://www.thecyprusplanetarium.com/storage/front/images/logo.png" 
			alt="Cyprus Planetarium" 
			class="footer-logo"
		/>
		<p class="copyright">© 2025 Michalis Chatzittofi. All rights Reserved</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #2d1b0e 0%, #4a2c3d 50%, #3d2a24 100%);
		min-height: 100vh;
		color: #ffffff;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
	}

	.app-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.app-header h1 {
		font-size: 2.5rem;
		margin: 0 0 1rem 0;
		background: linear-gradient(45deg, #ffede0, #ffd6a5, #f8c291);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.instructions {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 15px;
		padding: 1rem 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: left;
		max-width: 800px;
		margin: 0 auto;
	}

	.instructions h3 {
		margin: 0 0 0.75rem 0;
		color: #ffffff;
		font-size: 1.2rem;
	}

	.instructions ol {
		margin: 0;
		padding-left: 1.2rem;
		color: #e0e0ff;
		line-height: 1.4;
	}

	.instructions li {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	/* Footer Styles */
	.app-footer {
		text-align: center;
		padding: 2rem 0;
		margin-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.footer-logo {
		height: 80px;
		width: auto;
		filter: brightness(1.1) contrast(1.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.75rem;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
		opacity: 0.9;
	}

	.footer-logo:hover {
		opacity: 1;
		transform: scale(1.02);
		background: rgba(255, 255, 255, 0.15);
	}

	.copyright {
		margin: 1rem 0 0 0;
		color: #a8a8b8;
		font-size: 0.85rem;
		letter-spacing: 0.5px;
	}

	.main-content {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 1.5rem;
		align-items: start;
	}

	/* Leaderboard Styles */
	.leaderboard-section {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 15px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #ffffff;
	}

	.search-input {
		padding: 0.5rem 1rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: white;
		font-size: 0.9rem;
		width: 200px;
		transition: all 0.3s ease;
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.search-input:focus {
		outline: none;
		border-color: #e67e22;
		background: rgba(255, 255, 255, 0.15);
	}

	.leaderboard-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 500px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.entry-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		transition: all 0.3s ease;
	}

	.entry-card:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateX(5px);
	}

	.entry-card.top-three {
		background: rgba(230, 126, 34, 0.1);
		border-color: rgba(230, 126, 34, 0.3);
	}

	.entry-card.special-entry {
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid;
	}

	.entry-card.expected {
		border-color: rgba(255, 215, 0, 0.5);
		background: rgba(255, 215, 0, 0.1);
	}

	.entry-card.average {
		border-color: rgba(100, 255, 218, 0.5);
		background: rgba(100, 255, 218, 0.1);
	}

	.entry-card.above-average {
		border-left: 3px solid #4ade80;
	}

	.entry-card.below-average {
		border-left: 3px solid #f87171;
	}

	.rank {
		font-size: 1.1rem;
		font-weight: bold;
		min-width: 35px;
		text-align: center;
		color: #a8a8b8;
	}

	.special-entry .rank {
		font-size: 1.5rem;
		color: #ffffff;
	}

	.entry-details {
		flex: 1;
	}

	.name {
		font-weight: 600;
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.stats {
		font-size: 0.85rem;
		color: #a8a8b8;
	}

	.rate {
		text-align: right;
	}

	.rate-value {
		font-size: 1.3rem;
		font-weight: bold;
		background: linear-gradient(45deg, #f39c12, #e67e22);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.rate-value.above-avg {
		background: linear-gradient(45deg, #4ade80, #22c55e);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.rate-value.below-avg {
		background: linear-gradient(45deg, #f87171, #ef4444);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.rate-label {
		font-size: 0.7rem;
		color: #a8a8b8;
	}

	/* Form Styles */
	.form-section {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 15px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.form-section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		color: #ffffff;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #e0e0ff;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: white;
		font-size: 1rem;
		transition: all 0.3s ease;
	}

	.form-group input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.form-group input:focus {
		outline: none;
		border-color: #e67e22;
		background: rgba(255, 255, 255, 0.15);
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(45deg, #e67e22, #f39c12);
		border: none;
		border-radius: 10px;
		color: #ffffff;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(230, 126, 34, 0.4);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.preview {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(230, 126, 34, 0.1);
		border: 1px solid rgba(230, 126, 34, 0.3);
		border-radius: 10px;
		text-align: center;
	}

	.preview p {
		margin: 0;
		color: #e0e0ff;
	}

	.preview strong {
		color: #f39c12;
		font-size: 1.2rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #a8a8b8;
	}

	/* Scrollbar Styling */
	.leaderboard-list::-webkit-scrollbar {
		width: 8px;
	}

	.leaderboard-list::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	.leaderboard-list::-webkit-scrollbar-thumb {
		background: rgba(230, 126, 34, 0.3);
		border-radius: 4px;
	}

	.leaderboard-list::-webkit-scrollbar-thumb:hover {
		background: rgba(230, 126, 34, 0.5);
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.main-content {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.form-section {
			order: -1;
		}
	}

	@media (max-width: 640px) {
		.container {
			padding: 0.75rem;
		}

		.app-header h1 {
			font-size: 2rem;
		}

		.instructions {
			padding: 0.75rem 1rem;
			font-size: 0.85rem;
		}

		/* Mobile footer adjustments */
		.app-footer {
			padding: 1.5rem 0;
			margin-top: 1.5rem;
		}

		.footer-logo {
			height: 60px;
			padding: 0.5rem;
		}

		.copyright {
			font-size: 0.75rem;
		}

		.section-header {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}

		.search-input {
			width: 100%;
		}

		.entry-card {
			flex-wrap: wrap;
			padding: 0.5rem;
		}

		.rate {
			width: 100%;
			text-align: left;
			margin-top: 0.5rem;
			padding-top: 0.5rem;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
		}

		.leaderboard-section,
		.form-section {
			padding: 1rem;
		}
	}
</style>