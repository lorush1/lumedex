<script lang="ts">
  type MoveCategory = 'physical' | 'special' | 'status' | string;
  type LearnMethod = 'level-up' | 'tm' | 'machine' | string;

  export type Move = {
    name: string;
    type: string;
    category: MoveCategory;
    power?: number | null;
    learnMethod: LearnMethod;
  };

  export let moves: Move[] = [];

  let query = '';

  const isLevelUp = (m: Move) => m.learnMethod.toLowerCase() === 'level-up';
  const isTm = (m: Move) => {
    const method = m.learnMethod.toLowerCase();
    return method === 'tm' || method === 'machine';
  };
  const norm = (v: string) => v.trim().toLowerCase();
  const format = (v: string) => (v ? v[0].toUpperCase() + v.slice(1).toLowerCase() : '-');
  const match = (m: Move, q: string) => m.name.toLowerCase().includes(q);

  $: q = norm(query);
  $: filtered = q ? moves.filter((m) => match(m, q)) : moves;
  $: levelUpMoves = filtered.filter(isLevelUp);
  $: tmMoves = filtered.filter(isTm);
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
              <td>{format(move.type)}</td>
              <td>{format(move.category)}</td>
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
              <td>{format(move.type)}</td>
              <td>{format(move.category)}</td>
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
