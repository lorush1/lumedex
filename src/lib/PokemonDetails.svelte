<script lang='ts'>
	import { createEventDispatcher, tick } from 'svelte';

type Pokemon = { id: number; name: string };
type EvolutionInfo = {
	id: number;
	name: string;
	sprite: string | null;
	types: string[];
	stats: { label: string; value: number }[];
};

	let { selected = null, open = false } = $props();

	const dispatch = createEventDispatcher<{ close: void }>();

	let details = $state(null as any);
	let fetchState = $state<'idle' | 'loading' | 'error'>('idle');
	let evolutionVisible = $state(false);
	let evolutionNames = $state<string[] | null>(null);
	let evolutionStatus = $state<'idle' | 'loading' | 'error'>('idle');
	let evolutionError = $state<string | null>(null);
	let evolutionDetails = $state<EvolutionInfo[] | null>(null);

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

	let panelRef = $state<HTMLDivElement | null>(null);
	let closeButton = $state<HTMLButtonElement | null>(null);

	const focusTrap = (event: KeyboardEvent) => {
		if (event.key !== 'Tab' || !panelRef) {
			return;
		}
		const focusable = Array.from(
			panelRef.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		).filter(element => !element.hasAttribute('disabled'));
		if (!focusable.length) {
			return;
		}
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey) {
			if (document.activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	};

	const collectChainNames = (root: any) => {
		const names: string[] = [];
		const seen = new Set<string>();
		const walk = (node: any) => {
			const name = node?.species?.name;
			if (name && !seen.has(name)) {
				seen.add(name);
				names.push(name);
			}
			node?.evolves_to?.forEach(walk);
		};
		if (root) {
			walk(root);
		}
		return names;
	};

	const loadEvolutions = async () => {
		const url = details?.species?.evolutionChainUrl;
		const currentName = details?.pokemon.name?.toLowerCase();
		if (!url) {
			evolutionError = 'No evolution data';
			evolutionStatus = 'error';
			return;
		}
		evolutionStatus = 'loading';
		evolutionError = null;
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('chain fetch failed');
			}
			const chain = await response.json();
			const names = collectChainNames(chain?.chain);
			const filtered = currentName ? names.filter(name => name !== currentName) : names;
			evolutionNames = filtered;
			if (!filtered.length) {
				evolutionDetails = [];
				evolutionStatus = 'idle';
				return;
			}
			const fetched = await Promise.all(
				filtered.map(name =>
					fetch(`/api/pokemon/${name}`)
						.then(r => (r.ok ? r.json() : null))
						.catch(() => null)
				)
			);
			if (details?.species?.evolutionChainUrl !== url) {
				return;
			}
			evolutionDetails = fetched
				.map((poke, index) => {
					if (!poke) {
						return null;
					}
					const pokemon = poke.pokemon;
					const sprite =
						pokemon.sprites.other?.['official-artwork']?.front_default ||
						pokemon.sprites.front_default ||
						pokemon.sprites.other?.dream_world?.front_default ||
						null;
					const typeNames = pokemon.types?.map((t: any) => t.type.name) ?? [];
					const evoStats = statOrder
						.map(statName => {
							const entry = pokemon.stats?.find((s: any) => s.stat.name === statName);
							if (!entry) {
								return null;
							}
							return { label: entry.stat.name.replace(/-/g, ' '), value: entry.base_stat };
						})
						.filter(Boolean);
					return {
						id: pokemon.id,
						name: pokemon.name,
						sprite,
						types: typeNames,
						stats: evoStats
					};
				})
				.filter(Boolean);
			evolutionStatus = 'idle';
		} catch {
			if (details?.species?.evolutionChainUrl !== url) {
				return;
			}
			evolutionError = 'Unable to load evolutions';
			evolutionStatus = 'error';
		}
	};

	const toggleEvolutions = () => {
		evolutionVisible = !evolutionVisible;
		if (!evolutionVisible || evolutionNames || evolutionStatus === 'loading') {
			return;
		}
		void loadEvolutions();
	};

	$effect(() => {
		if (!open || !selected) {
			details = null;
			fetchState = 'idle';
			evolutionVisible = false;
			evolutionNames = null;
			evolutionStatus = 'idle';
			evolutionError = null;
			evolutionDetails = null;
			return;
		}

		evolutionVisible = false;
		evolutionNames = null;
		evolutionStatus = 'idle';
		evolutionError = null;
		evolutionDetails = null;

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

	$effect(() => {
		if (!open) {
			return;
		}
		void tick().then(() => {
			(closeButton ?? panelRef)?.focus();
		});
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
	<div
		class="pdx-details-panel"
		role="dialog"
		aria-modal="true"
		aria-label="Pokemon details"
		tabindex="-1"
		bind:this={panelRef}
		onkeydown={focusTrap}
	>
		<button
			type="button"
			class="pdx-details-close"
			onclick={() => dispatch('close')}
			bind:this={closeButton}
			aria-label="Close details"
		>
			×
		</button>

		{#if fetchState === 'loading'}
			<div class="pdx-details-skeleton"></div>
		{:else if details}
			<div class="pdx-details-body">
				<div class="pdx-details-art">
					<img src={sprite} alt={details.pokemon.name} />

					<h2>{capitalize(details.pokemon.name)}</h2>
					<p class="pdx-details-id">#{String(details.pokemon.id).padStart(3, '0')}</p>

					<div class="pdx-details-types">
						{#each details.pokemon.types as t}
							<span class="pdx-details-type">{capitalize(t.type.name)}</span>
						{/each}
					</div>
				</div>

				<div class="pdx-details-info">
					<p class="pdx-details-flavor">{details.species.flavor}</p>

					<div class="pdx-details-evo">
						<button
							type="button"
							class="pdx-btn"
							onclick={toggleEvolutions}
							aria-expanded={evolutionVisible}
						>
							Evolutions
						</button>
						{#if evolutionVisible}
							{#if evolutionStatus === 'loading'}
								<p class="pdx-details-evo-status">Loading evolutions...</p>
							{:else if evolutionStatus === 'error'}
								<p class="pdx-details-evo-status pdx-details-evo-error">
									{evolutionError ?? 'Unable to load evolutions'}
								</p>
							{:else if evolutionDetails?.length}
								<div class="pdx-details-evo-grid">
									{#each evolutionDetails as evolution}
										<article class="pdx-details-evo-card">
											{#if evolution.sprite}
												<img
													class="pdx-details-evo-avatar"
													src={evolution.sprite}
													alt={capitalize(evolution.name)}
												/>
											{/if}
											<div>
												<h3>{capitalize(evolution.name)}</h3>
												<p class="pdx-details-evo-types">
													{evolution.types.join(', ')}
												</p>
												<div class="pdx-details-evo-stats">
													{#each evolution.stats as stat}
														<span>{stat.label}: {stat.value}</span>
													{/each}
												</div>
											</div>
										</article>
									{/each}
								</div>
							{:else if evolutionNames?.length}
								<ul class="pdx-details-evo-list">
									{#each evolutionNames as name}
										<li>{capitalize(name)}</li>
									{/each}
								</ul>
							{:else}
								<p class="pdx-details-evo-status">No evolutions found</p>
							{/if}
						{/if}
					</div>
					{#if !evolutionVisible}
						<div class="pdx-details-stats">
							{#each stats as s}
								<div class="pdx-details-stat">
									<span class="pdx-details-stat-name">{s.stat.name.replace(/-/g, ' ')}</span>
									<span class="pdx-details-stat-val">{s.base_stat}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<p>Details unavailable</p>
		{/if}
	</div>
</div>
{/if}

