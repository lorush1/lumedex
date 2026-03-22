<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getSpriteObjectUrl } from '$lib/spriteCache';

	type Pokemon = { id: number; name: string };

	const placeholder =
		'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

	let { pokemon } = $props();
	let displayId = $derived(String(pokemon.id).padStart(3, '0'));
	let label = $derived(`${pokemon.name[0].toUpperCase()}${pokemon.name.slice(1)}`);
	let spriteUrl = $state(placeholder);

	$effect(() => {
		const id = pokemon.id;
		let blobToRevoke: string | null = null;
		let cancelled = false;
		spriteUrl = placeholder;
		getSpriteObjectUrl(id).then((url) => {
			if (cancelled) {
				if (url.startsWith('blob:')) URL.revokeObjectURL(url);
				return;
			}
			if (url.startsWith('blob:')) blobToRevoke = url;
			spriteUrl = url;
		});
		return () => {
			cancelled = true;
			if (blobToRevoke) URL.revokeObjectURL(blobToRevoke);
		};
	});

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
