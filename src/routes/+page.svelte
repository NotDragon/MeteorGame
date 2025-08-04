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
		<h1>🌠 Meteor Counter</h1>
		<p>Track and compare meteor sighting rates</p>
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
						class:top-three={!entry.isSpecial && index < 3}>
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
							<div class="rate-value">{formatRate(entry.ratePerHour)}</div>
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
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
		min-height: 100vh;
		color: #ffffff;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.app-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.app-header h1 {
		font-size: 3rem;
		margin: 0;
		background: linear-gradient(45deg, #f8f8ff, #e0e0ff);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.app-header p {
		color: #a8a8b8;
		font-size: 1.2rem;
		margin-top: 0.5rem;
	}

	.main-content {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2rem;
		align-items: start;
	}

	/* Leaderboard Styles */
	.leaderboard-section {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.8rem;
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
		border-color: #7c7cff;
		background: rgba(255, 255, 255, 0.15);
	}

	.leaderboard-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 600px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.entry-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.entry-card:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateX(5px);
	}

	.entry-card.top-three {
		background: rgba(124, 124, 255, 0.1);
		border-color: rgba(124, 124, 255, 0.3);
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

	.rank {
		font-size: 1.2rem;
		font-weight: bold;
		min-width: 40px;
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
		font-size: 1.5rem;
		font-weight: bold;
		background: linear-gradient(45deg, #7c7cff, #64ffda);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.rate-label {
		font-size: 0.75rem;
		color: #a8a8b8;
	}

	/* Form Styles */
	.form-section {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.form-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.8rem;
		color: #ffffff;
	}

	.form-group {
		margin-bottom: 1.5rem;
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
		border-color: #7c7cff;
		background: rgba(255, 255, 255, 0.15);
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(45deg, #7c7cff, #64ffda);
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
		box-shadow: 0 10px 20px rgba(124, 124, 255, 0.4);
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
		background: rgba(124, 124, 255, 0.1);
		border: 1px solid rgba(124, 124, 255, 0.3);
		border-radius: 10px;
		text-align: center;
	}

	.preview p {
		margin: 0;
		color: #e0e0ff;
	}

	.preview strong {
		color: #64ffda;
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
		background: rgba(124, 124, 255, 0.3);
		border-radius: 4px;
	}

	.leaderboard-list::-webkit-scrollbar-thumb:hover {
		background: rgba(124, 124, 255, 0.5);
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.main-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.form-section {
			order: -1;
		}
	}

	@media (max-width: 640px) {
		.container {
			padding: 1rem;
		}

		.app-header h1 {
			font-size: 2rem;
		}

		.section-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.search-input {
			width: 100%;
		}

		.entry-card {
			flex-wrap: wrap;
		}

		.rate {
			width: 100%;
			text-align: left;
			margin-top: 0.5rem;
			padding-top: 0.5rem;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
		}
	}
</style>