<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import PokemonCard from '$lib/PokemonCard.svelte';

	type Pokemon = { id: number; name: string };

	let { pokemons = [] } = $props();

	const dispatch = createEventDispatcher<{ select: Pokemon }>();
</script>

{#if pokemons.length}
	<div class="pdx-grid">
		{#each pokemons as pokemon (pokemon.id)}
			<PokemonCard {pokemon} on:select={(event) => dispatch('select', event.detail)} />
		{/each}
	</div>
{:else}
	<div class="pdx-panel">
		<p class="pdx-badge">No results</p>
		<p>Adjust the search term to see more entries.</p>
	</div>
{/if}
