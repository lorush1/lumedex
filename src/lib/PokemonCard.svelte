<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type Pokemon = { id: number; name: string };

	let { pokemon } = $props();
	let displayId = $derived(String(pokemon.id).padStart(3, '0'));
	let label = $derived(`${pokemon.name[0].toUpperCase()}${pokemon.name.slice(1)}`);
	let spriteUrl = $derived(
		`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
	);

	const dispatch = createEventDispatcher<{ select: Pokemon }>();

	const handleClick = () => {
		dispatch('select', pokemon);
	};
</script>

<button
	type="button"
	class="pdx-card pdx-card--action"
	aria-label={`View details for ${label}`}
	onclick={handleClick}
>
	<div class="pdx-card-sprite">
		<img src={spriteUrl} alt="" width="96" height="96" loading="lazy" decoding="async" />
	</div>
	<div class="pdx-badge">#{displayId}</div>
	<h3>{label}</h3>
	<p>National Dex #{displayId}</p>
</button>
