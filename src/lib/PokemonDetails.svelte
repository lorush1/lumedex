<script lang='ts'>
	import { createEventDispatcher, tick } from 'svelte';
	import PokemonTactics from '$lib/PokemonTactics.svelte';
	import MoveList from '$lib/MoveList.svelte';
	import PokemonRegistry from '$lib/PokemonRegistry.svelte';

type Pokemon = { id: number; name: string };
type EvolutionInfo = {
	id: number;
	name: string;
	sprite: string | null;
	types: string[];
	stats: { label: string; value: number }[];
};
type LearnMethod = { name?: string };
type VersionDetail = { move_learn_method?: LearnMethod };
type PokemonMove = {
	move?: { name?: string; url?: string };
	version_group_details?: VersionDetail[];
};
type MoveMeta = { type: string; category: string; power: number | null };
type RegistryVariety = {
	id: string;
	label: string;
	icon: string | null;
	sprites: any;
};
type MoveRow = {
	name: string;
	type: string;
	category: string;
	power: number | null;
	learnMethod: string;
	moveUrl: string;
};
const moveMetaCache = new Map<string, MoveMeta>();

	let { selected = null, open = false } = $props();

	const dispatch = createEventDispatcher<{ close: void }>();

	let details = $state(null as any);
	let fetchState = $state<'idle' | 'loading' | 'error'>('idle');
	let infoView = $state<'overview' | 'moves' | 'registry'>('overview');
	let moveMetaByName = $state<Record<string, MoveMeta>>({});
	let registryVarieties = $state<RegistryVariety[]>([]);
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
	const baseMoveRows = $derived(
		(details?.pokemon?.moves ?? [])
			.map((entry: PokemonMove) => {
				const method = entry.version_group_details?.[0]?.move_learn_method?.name ?? '';
				return {
					name: entry.move?.name ?? 'unknown',
					learnMethod: method,
					moveUrl: entry.move?.url ?? ''
				};
			})
			.filter((m: { name: string; learnMethod: string }) => m.learnMethod === 'level-up' || m.learnMethod === 'machine')
	);
	const moveList = $derived(
		baseMoveRows.map((move: { name: string; learnMethod: string; moveUrl: string }) => {
			const meta = moveMetaByName[move.name];
			return {
				name: move.name,
				type: meta?.type ?? '-',
				category: meta?.category ?? '-',
				power: meta?.power ?? null,
				learnMethod: move.learnMethod,
				moveUrl: move.moveUrl
			} satisfies MoveRow;
		})
	);
	const registryData = $derived({
		name: details?.pokemon?.name ?? 'pokemon',
		sprites: details?.pokemon?.sprites ?? {},
		varieties: registryVarieties
	});

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
			const evolutions = fetched
				.map((poke): EvolutionInfo | null => {
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
						.filter((entry): entry is { label: string; value: number } => Boolean(entry));
					return {
						id: pokemon.id,
						name: pokemon.name,
						sprite,
						types: typeNames,
						stats: evoStats
					};
				})
				.filter((entry): entry is EvolutionInfo => Boolean(entry));
			evolutionDetails = evolutions;
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
		infoView = 'overview';
		evolutionVisible = !evolutionVisible;
		if (!evolutionVisible || evolutionNames || evolutionStatus === 'loading') {
			return;
		}
		void loadEvolutions();
	};
	const showOverview = () => {
		infoView = 'overview';
		evolutionVisible = false;
	};
	const showMoves = () => {
		infoView = 'moves';
		evolutionVisible = false;
	};
	const title = (value?: string) =>
		value ? value.split('-').map(part => (part ? part[0].toUpperCase() + part.slice(1) : '')).join(' ') : '-';
	const formLabel = (value: string) => value.split('-').map(part => capitalize(part)).join(' ');

	$effect(() => {
		const toFetch = baseMoveRows.filter((move: { name: string }) => !moveMetaCache.has(move.name));
		if (!toFetch.length) {
			moveMetaByName = Object.fromEntries(moveMetaCache.entries());
			return;
		}
		let cancelled = false;
		Promise.all(
			toFetch.map(async (move: { name: string; moveUrl: string }) => {
				try {
					const url = move.moveUrl || `https://pokeapi.co/api/v2/move/${move.name}`;
					const response = await fetch(url);
					if (!response.ok) {
						return;
					}
					const json: any = await response.json();
					moveMetaCache.set(move.name, {
						type: title(json?.type?.name),
						category: title(json?.damage_class?.name),
						power: json?.power ?? null
					});
				} catch {}
			})
		).finally(() => {
			if (!cancelled) {
				moveMetaByName = Object.fromEntries(moveMetaCache.entries());
			}
		});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const speciesUrl = details?.pokemon?.species?.url;
		if (!speciesUrl) {
			registryVarieties = [];
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const speciesRes = await fetch(speciesUrl);
				if (!speciesRes.ok) {
					if (!cancelled) registryVarieties = [];
					return;
				}
				const speciesJson: any = await speciesRes.json();
				const varieties = speciesJson?.varieties ?? [];
				const fetched = await Promise.all(
					varieties.map(async (entry: any) => {
						const name = entry?.pokemon?.name as string | undefined;
						const url = entry?.pokemon?.url as string | undefined;
						if (!name || !url) {
							return null;
						}
						try {
							const formRes = await fetch(url);
							if (!formRes.ok) {
								return null;
							}
							const formJson: any = await formRes.json();
							const icon =
								formJson?.sprites?.front_default ??
								formJson?.sprites?.other?.['official-artwork']?.front_default ??
								null;
							return {
								id: name,
								label: formLabel(name),
								icon,
								sprites: formJson?.sprites ?? {}
							} satisfies RegistryVariety;
						} catch {
							return null;
						}
					})
				);
				if (!cancelled) {
					registryVarieties = fetched.filter(Boolean);
				}
			} catch {
				if (!cancelled) {
					registryVarieties = [];
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!open || !selected) {
			details = null;
			fetchState = 'idle';
			infoView = 'overview';
			moveMetaByName = {};
			registryVarieties = [];
			evolutionVisible = false;
			evolutionNames = null;
			evolutionStatus = 'idle';
			evolutionError = null;
			evolutionDetails = null;
			return;
		}

		evolutionVisible = false;
		infoView = 'overview';
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
						<div class="pdx-details-actions">
						<button
							type="button"
							class="pdx-btn"
							onclick={showOverview}
							aria-pressed={infoView === 'overview'}
						>
							Overview
						</button>
						<button
							type="button"
							class="pdx-btn"
							onclick={showMoves}
							aria-pressed={infoView === 'moves'}
						>
							Moves
						</button>
						<button
							type="button"
							class="pdx-btn"
							onclick={() => {
								infoView = 'registry';
								evolutionVisible = false;
							}}
							aria-pressed={infoView === 'registry'}
						>
							Registry
						</button>
						<button
							type="button"
							class="pdx-btn"
							onclick={toggleEvolutions}
							aria-expanded={evolutionVisible}
						>
							Evolutions
						</button>
						</div>
						{#if !evolutionVisible && infoView === 'overview'}
							<PokemonTactics
								pokemon={{
									types: details.pokemon.types.map((t: any) => t.type.name),
									stats: details.pokemon.stats
								}}
							/>
						{/if}
						{#if !evolutionVisible && infoView === 'moves'}
							<MoveList moves={moveList} />
						{/if}
						{#if !evolutionVisible && infoView === 'registry'}
							<PokemonRegistry pokemon={registryData} />
						{/if}
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
				</div>
			</div>
		{:else}
			<p>Details unavailable</p>
		{/if}
	</div>
</div>
{/if}

