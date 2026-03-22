<script lang="ts">
	import PokedexHeader from '$lib/PokedexHeader.svelte';
	import PokedexSearch from '$lib/PokedexSearch.svelte';
	import PokemonGrid from '$lib/PokemonGrid.svelte';
	import PokemonDetails from '$lib/PokemonDetails.svelte';

	type Pokemon = { id: number; name: string };

	let { data } = $props();
	let all = $derived((data?.all ?? []) as Pokemon[]);
	let search = $state('');
	let selected = $state<Pokemon | null>(null);
	let isDetailsOpen = $state(false);

	let normalized = $derived(search.trim().toLowerCase());
	let filteredPokemons = $derived(
		normalized
			? all.filter((pokemon) => pokemon.name.toLowerCase().includes(normalized))
			: all
	);

	const handleSelection = (event: CustomEvent<Pokemon>) => {
		selected = event.detail;
		isDetailsOpen = true;
	};

	const closeDetails = () => {
		isDetailsOpen = false;
		selected = null;
	};
</script>

<main class="pdx-page">
	<section class="pdx-panel">
		<PokedexHeader total={all.length} visible={filteredPokemons.length} />
		<PokedexSearch value={search} on:search={(event) => (search = event.detail)} />
	</section>
	<section>
		<PokemonGrid pokemons={filteredPokemons} on:select={handleSelection} />
	</section>
	<PokemonDetails {selected} open={isDetailsOpen} on:close={closeDetails} />
</main>
