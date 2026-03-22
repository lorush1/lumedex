<script lang="ts">
	let { total = 0, visible = 0 } = $props();
</script>

<div class="pdx-header">
	<div>
		<p class="pdx-badge">Lumedex</p>
		<p>{visible} of {total} entries</p>
	</div>
</div>
