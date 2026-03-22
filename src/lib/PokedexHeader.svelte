<script lang="ts">
	let { total = 0, visible = 0 } = $props();
</script>

<div class="pdx-header">
	<div>
		<p class="pdx-badge">National Dex</p>
		<h1>Phase 2 Pokedex</h1>
		<p>{visible} of {total} entries</p>
	</div>
	<button type="button" class="pdx-btn">Scan region</button>
</div>
