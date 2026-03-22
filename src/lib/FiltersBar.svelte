<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const types = [
		'normal',
		'fire',
		'water',
		'electric',
		'grass',
		'ice',
		'fighting',
		'poison',
		'ground',
		'flying',
		'psychic',
		'bug',
		'rock',
		'ghost',
		'dragon',
		'dark',
		'steel',
		'fairy'
	];
	const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	const dispatch = createEventDispatcher<{
		typechange: string;
		generationchange: number | null;
	}>();

	export let selectedType = 'all';
	export let selectedGeneration: number | null = null;

	const handleTypeChange = (event: Event) => {
		const value = (event.currentTarget as HTMLSelectElement).value;
		dispatch('typechange', value);
	};

	const handleGenerationChange = (event: Event) => {
		const value = (event.currentTarget as HTMLSelectElement).value;
		dispatch('generationchange', value ? Number(value) : null);
	};
</script>

<div class="pdx-filters-bar" role="region" aria-label="filter controls">
	<div class="pdx-filter-group">
		<span class="pdx-filter-label">Type</span>
		<select class="pdx-filter-select pdx-filter-type" value={selectedType} on:change={handleTypeChange}>
			<option value="all">All types</option>
			{#each types as type}
				<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
			{/each}
		</select>
	</div>
	<div class="pdx-filter-group">
		<span class="pdx-filter-label">Generation</span>
		<select
			class="pdx-filter-select"
			value={selectedGeneration ?? ''}
			on:change={handleGenerationChange}
		>
			<option value="">All gens</option>
			{#each generations as generation}
				<option value={generation}>Gen {generation}</option>
			{/each}
		</select>
	</div>
</div>
