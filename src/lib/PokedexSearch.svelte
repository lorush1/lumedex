<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let { value = '' } = $props();
	const dispatch = createEventDispatcher<{ search: string }>();

	const handleInput = (event: Event) => {
		const next = (event.currentTarget as HTMLInputElement).value;
		dispatch('search', next);
	};
</script>

<div>
	<input
		class="pdx-input"
		type="search"
		placeholder="Search by name"
		value={value}
		aria-label="Filter pokémon list"
		oninput={handleInput}
	/>
</div>
