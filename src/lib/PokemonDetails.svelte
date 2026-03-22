<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type Pokemon = { id: number; name: string };

	let { selected = null, open = false } = $props();

	const dispatch = createEventDispatcher<{ close: void }>();

	let details = $state(null as any);
	let fetchState = $state<'idle' | 'loading' | 'error'>('idle');

	const statOrder = ['hp', 'attack', 'defense', 'special-attack', 'speed'];

	const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

	const sprite = $derived(
		details?.pokemon.sprites.other?.['official-artwork']?.front_default ||
		details?.pokemon.sprites.front_default
	);

	const stats = $derived(
		statOrder
			.map(n => details?.pokemon.stats?.find((s: any) => s.stat.name === n))
			.filter(Boolean)
	);

	$effect(() => {
		if (!open || !selected) {
			details = null;
			fetchState = 'idle';
			return;
		}

		const ac = new AbortController();
		fetchState = 'loading';

		fetch(`/api/pokemon/${(selected.name ?? selected.id).toString().toLowerCase()}`, { signal: ac.signal })
			.then(r => {
				if (!r.ok) throw 0;
				return r.json();
			})
			.then(d => {
				details = d;
				fetchState = 'idle';
			})
			.catch(e => {
				if (e.name !== 'AbortError') fetchState = 'error';
			});

		return () => ac.abort();
	});

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dispatch('close');
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

</script>

{#if open}
<div class="pdx-details-backdrop">
	<button
		type="button"
		class="pdx-details-backdrop-hit"
		tabindex="-1"
		aria-label="Close dialog"
		onclick={() => dispatch('close')}
	></button>
	<div class="pdx-details-panel" role="dialog" aria-modal="true" aria-label="Pokemon details">
		<button type="button" class="pdx-details-close" onclick={() => dispatch('close')}>×</button>

		{#if fetchState === 'loading'}
			<div class="pdx-details-skeleton"></div>
		{:else if details}
			<div class="pdx-details-body">
				<img src={sprite} alt={details.pokemon.name} />

				<h2>{capitalize(details.pokemon.name)}</h2>
				<p>#{String(details.pokemon.id).padStart(3, '0')}</p>

				<div>
					{#each details.pokemon.types as t}
						<span>{capitalize(t.type.name)}</span>
					{/each}
				</div>

				<p>{details.species.flavor}</p>

				<div>
					{#each stats as s}
						<div>{s.stat.name.toUpperCase()} {s.base_stat}</div>
					{/each}
				</div>
			</div>
		{:else}
			<p>Details unavailable</p>
		{/if}
	</div>
</div>
{/if}