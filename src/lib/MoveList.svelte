<script lang="ts">
  import {
    filterMoves,
    formatMoveCell,
    isLevelUpMove,
    isTmMove,
    normalizeMoveQuery,
    type Move
  } from '$lib/moveList';

  export let moves: Move[] = [];

  let query = '';
  $: q = normalizeMoveQuery(query);
  $: filtered = filterMoves(moves, q);
  $: levelUpMoves = filtered.filter(isLevelUpMove);
  $: tmMoves = filtered.filter(isTmMove);
</script>

<section class="pdx-moves">
  <input class="pdx-moves-filter" type="text" bind:value={query} placeholder="Filter moves by name" />

  <div class="pdx-moves-table-wrap">
    <h3>Level Up ({levelUpMoves.length})</h3>
    <table class="pdx-moves-table">
      <thead>
        <tr>
          <th>Move Name</th>
          <th>Type</th>
          <th>Category</th>
          <th>Power</th>
        </tr>
      </thead>
      <tbody>
        {#if levelUpMoves.length}
          {#each levelUpMoves as move}
            <tr>
              <td>{move.name}</td>
              <td>{formatMoveCell(move.type)}</td>
              <td>{formatMoveCell(move.category)}</td>
              <td>{move.power ?? '-'}</td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan="4">No moves found.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <div class="pdx-moves-table-wrap">
    <h3>TM/Learning ({tmMoves.length})</h3>
    <table class="pdx-moves-table">
      <thead>
        <tr>
          <th>Move Name</th>
          <th>Type</th>
          <th>Category</th>
          <th>Power</th>
        </tr>
      </thead>
      <tbody>
        {#if tmMoves.length}
          {#each tmMoves as move}
            <tr>
              <td>{move.name}</td>
              <td>{formatMoveCell(move.type)}</td>
              <td>{formatMoveCell(move.category)}</td>
              <td>{move.power ?? '-'}</td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan="4">No moves found.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</section>
