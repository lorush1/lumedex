<script lang="ts">
import { onMount } from 'svelte';
import TeamBuilder from '$lib/TeamBuilder.svelte';
import { mountTeamBuilder } from '$lib/team';
import PokedexHeader from '$lib/PokedexHeader.svelte';
import PokedexSearch from '$lib/PokedexSearch.svelte';
import PokemonGrid from '$lib/PokemonGrid.svelte';
import PokemonDetails from '$lib/PokemonDetails.svelte';
import FiltersBar from '$lib/FiltersBar.svelte';

type Pokemon = { id: number; name: string };

let { data } = $props();
let all = $derived((data?.all ?? []) as Pokemon[]);
let search = $state('');
let selected = $state<Pokemon | null>(null);
let isDetailsOpen = $state(false);
let typeFilter = $state('all');
let generationFilter = $state<number | null>(null);
let typeCache = $state(new Map<string, Set<string>>());
let generationCache = $state(new Map<number, Set<string>>());

const pendingTypeRequests = new Set<string>();
const pendingGenerationRequests = new Set<number>();

const matchesCache = (set: Set<string> | undefined, value: string) => !set || set.has(value);
const normalizeNames = (names: string[]) => new Set(names.map((name) => name.toLowerCase()));
const buildCache = <T>(cache: Map<T, Set<string>>, key: T, names: string[]) => {
	const next = new Map(cache);
	next.set(key, normalizeNames(names));
	return next;
};

const fetchNameSet = async <T extends string | number>(
	key: T,
	cache: Map<T, Set<string>>,
	pending: Set<T>,
	url: string
) => {
	if (pending.has(key)) return;
	pending.add(key);
	try {
		const response = await fetch(url);
		if (!response.ok) return;
		const names = (await response.json()) as string[];
		return buildCache(cache, key, names);
	} catch (error) {
		console.error(error);
	} finally {
		pending.delete(key);
	}
};

let filteredPokemons = $derived.by(() => {
	const normalized = search.trim().toLowerCase();
	const list = normalized ? all.filter((pokemon) => pokemon.name.toLowerCase().includes(normalized)) : all;
	const typeSet = typeFilter === 'all' ? undefined : typeCache.get(typeFilter);
	const generationSet = generationFilter === null ? undefined : generationCache.get(generationFilter);
	return list.filter((pokemon) => {
		const lowerName = pokemon.name.toLowerCase();
		return matchesCache(typeSet, lowerName) && matchesCache(generationSet, lowerName);
	});
});

const handleTypeFilterChange = ({ detail }: CustomEvent<string>) => {
	const normalized = detail === 'all' ? 'all' : detail.toLowerCase();
	typeFilter = normalized;
	if (normalized === 'all' || typeCache.has(normalized)) return;
	void fetchNameSet(normalized, typeCache, pendingTypeRequests, `/api/type/${normalized}`).then(
		(next) => next && (typeCache = next)
	);
};

const handleGenerationFilterChange = ({ detail }: CustomEvent<number | null>) => {
	generationFilter = detail;
	if (detail === null || generationCache.has(detail)) return;
	void fetchNameSet(detail, generationCache, pendingGenerationRequests, `/api/gen/${detail}`).then(
		(next) => next && (generationCache = next)
	);
};

const handleSelection = ({ detail }: CustomEvent<Pokemon>) => {
	selected = detail;
	isDetailsOpen = true;
};

const closeDetails = () => {
	isDetailsOpen = false;
	selected = null;
};

onMount(() => {
	const root = document.querySelector('[data-team-builder-root]');
	if (!root) return;
	const cleanup = mountTeamBuilder(root as HTMLElement);
	return cleanup;
});
</script>

<main class="pdx-page">
	<section class="pdx-panel">
		<PokedexHeader total={all.length} visible={filteredPokemons.length} />
		<PokedexSearch value={search} on:search={(event) => (search = event.detail)} />
		<FiltersBar
			selectedType={typeFilter}
			selectedGeneration={generationFilter}
			on:typechange={handleTypeFilterChange}
			on:generationchange={handleGenerationFilterChange}
		/>
	</section>
	<TeamBuilder />
	<section>
		<PokemonGrid pokemons={filteredPokemons} on:select={handleSelection} />
	</section>
	<PokemonDetails {selected} open={isDetailsOpen} on:close={closeDetails} />
</main>
